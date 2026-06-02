import { FormIntegration } from "../models/formIntegration.js";
import { FormFeedback } from "../models/formFeedback.js";
import { IntegrationEvent } from "../models/integrationEvent.js";
import { NotificationSettings } from "../models/notificationSettings.js";
import { Request } from "../models/request.js";
import { env } from "../config/env.js";
import { sendMessage } from "../services/whatsappService.js";
import { SCENARIO_IDS, getScenario } from "../config/formScenarios.js";
import { Op } from "sequelize";

function formRequestsUrl(formId, formTitle) {
  const baseUrl = env.publicBaseUrl.replace(/\/$/, "");
  if (!formId) return `${baseUrl}/forms`;

  const params = formTitle
    ? `?formTitle=${encodeURIComponent(formTitle)}`
    : "";

  return `${baseUrl}/forms/${encodeURIComponent(formId)}/requests${params}`;
}

async function dispatchWhatsappNotifications(formId, record) {
  try {
    const settings = await NotificationSettings.findAll({
      where: { formId, channel: "whatsapp", enabled: true }
    });

    for (const s of settings) {
      if (!s.phoneNumber) continue;
      if (s.mode === "daily_summary") continue;
      const title = record.formTitle || formId;
      const email = record.respondentEmail ? `\nОт: ${record.respondentEmail}` : "";
      const text = [
        "FormBridge: новая заявка",
        `Форма: «${title}»${email}`,
        "",
        `Открыть заявки: ${formRequestsUrl(formId, title)}`
      ].join("\n");
      try {
        await sendMessage(s.phoneNumber, text);
        console.log(`[WhatsApp] Sent to ${s.phoneNumber}`);
      } catch (err) {
        console.warn(`[WhatsApp] Failed to send to ${s.phoneNumber}:`, err.message);
      }
    }
  } catch (err) {
    console.error("[WhatsApp] dispatchWhatsappNotifications error:", err.message);
  }
}

async function writeEvent(fields) {
  return IntegrationEvent.create(fields).catch((err) => {
    console.error("Failed to write ingestion event", err.message);
  });
}

function normalizeAnswersForDedupe(answers) {
  return JSON.stringify((Array.isArray(answers) ? answers : [])
    .map((item) => ({
      question: String(item?.question || ""),
      answer: String(item?.answer || "")
    }))
    .sort((a, b) => a.question.localeCompare(b.question) || a.answer.localeCompare(b.answer)));
}

function publicRequest(row) {
  return {
    id: row.id,
    source: row.source,
    formId: row.formId,
    formTitle: row.formTitle,
    responseId: row.responseId,
    respondentEmail: row.respondentEmail,
    submittedAt: row.submittedAt,
    status: row.status,
    answers: row.answers,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function googleFormsWebhook(req, res) {
  console.log("[googleFormsWebhook] hit", {
    responseId: req.body?.responseId,
    source: req.body?.source,
    isTest: req.body?.isTest,
    hasSecretHeader: Boolean(req.headers["x-formbridge-secret"])
  });

  const secretHeader = req.headers["x-formbridge-secret"];
  const expectedSecret = process.env.FORMBRIDGE_WEBHOOK_SECRET || "";
  const payload = req.body || {};
  const responseId = payload.responseId;
  const formId = payload.form?.id || null;

  const integration = formId
    ? await FormIntegration.findOne({ where: { formId } })
    : null;
  const acceptedSecret = integration?.webhookSecret || expectedSecret;

  if (!acceptedSecret) {
    await writeEvent({ integrationId: integration?.id || null, responseId, type: "ingest", status: "error", message: "Webhook secret is not configured", payload });
    return res.status(500).json({ error: "FORMBRIDGE_WEBHOOK_SECRET is not configured" });
  }

  if (!secretHeader || secretHeader !== acceptedSecret) {
    if (integration) {
      integration.healthStatus = "broken";
      integration.lastErrorAt = new Date();
      integration.lastErrorReason = "Invalid webhook secret";
      await integration.save();
    }
    await writeEvent({ integrationId: integration?.id || null, responseId, type: "ingest", status: "error", message: "Invalid webhook secret", payload });
    return res.status(401).json({ error: "Invalid webhook secret" });
  }

  if (!responseId) {
    if (integration) {
      integration.healthStatus = "broken";
      integration.lastErrorAt = new Date();
      integration.lastErrorReason = "responseId is required";
      await integration.save();
    }
    await writeEvent({ integrationId: integration?.id || null, type: "ingest", status: "error", message: "responseId is required", payload });
    return res.status(400).json({ error: "responseId is required" });
  }

  const answers = Array.isArray(payload.answers) ? payload.answers : [];
  if (!payload.isTest && formId) {
    const recentRequests = await Request.findAll({
      where: {
        formId,
        createdAt: { [Op.gte]: new Date(Date.now() - 15_000) }
      },
      order: [["createdAt", "DESC"]],
      limit: 20
    });
    const incomingFingerprint = normalizeAnswersForDedupe(answers);
    const duplicate = recentRequests.find((row) => (
      row.respondentEmail === (payload.respondentEmail || null)
      && normalizeAnswersForDedupe(row.answers) === incomingFingerprint
    ));

    if (duplicate) {
      await writeEvent({
        integrationId: integration?.id || null,
        requestId: duplicate.id,
        responseId,
        type: "ingest",
        status: "duplicate",
        message: "Near-identical webhook ignored",
        payload: { formId, duplicateOf: duplicate.responseId }
      });
      return res.status(200).json({ ok: true, deduplicated: true, id: duplicate.id });
    }
  }

  const [record, created] = await Request.findOrCreate({
    where: { responseId },
    defaults: {
      source: payload.source || "google_forms",
      formId,
      formTitle: payload.form?.title || null,
      respondentEmail: payload.respondentEmail || null,
      submittedAt: payload.submittedAt ? new Date(payload.submittedAt) : null,
      answers,
      rawPayload: payload,
      status: payload.isTest ? "test" : "new"
    }
  });

  if (integration) {
    integration.lastEventAt = new Date();
    integration.healthStatus = "connected";
    integration.lastErrorReason = null;
    if (payload.isTest) integration.lastTestResult = "ok";
    if (payload.isTest) integration.lastTestAt = new Date();
    await integration.save();
  }

  await writeEvent({
    integrationId: integration?.id || null,
    requestId: record.id,
    responseId,
    type: "ingest",
    status: created ? "ok" : "duplicate",
    message: created ? "Request saved" : "Duplicate response ignored",
    payload: { formId, isTest: Boolean(payload.isTest) }
  });

  if (!created) {
    return res.status(200).json({ ok: true, deduplicated: true, id: record.id });
  }

  // fire-and-forget — не задерживаем ответ webhook
  dispatchWhatsappNotifications(formId, record).catch(() => {});

  return res.status(201).json({ ok: true, id: record.id });
}

export async function listRequests(req, res) {
  const { status, formId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (formId) where.formId = formId;

  const records = await Request.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: 100
  });

  return res.json({ items: records.map(publicRequest) });
}

export async function getRequest(req, res) {
  const record = await Request.findByPk(req.params.id);
  if (!record) return res.status(404).json({ error: "Request not found" });

  const events = await IntegrationEvent.findAll({
    where: { requestId: record.id },
    order: [["createdAt", "DESC"]],
    limit: 50
  });

  return res.json({ item: publicRequest(record), rawPayload: record.rawPayload, events });
}

export async function updateRequestStatus(req, res) {
  const { status } = req.body;
  const allowed = [
    "new", "in_progress", "done", "test",
    "contacted", "documents_needed", "accepted", "rejected",
    "shortlisted", "interview", "hired",
    "urgent", "waiting_client",
    "confirmed", "waiting_payment", "cancelled", "attended"
  ];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
  }

  const record = await Request.findByPk(req.params.id);
  if (!record) return res.status(404).json({ error: "Request not found" });

  record.status = status;
  await record.save();

  await writeEvent({ requestId: record.id, responseId: record.responseId, type: "status_change", status: "ok", message: `Status changed to ${status}` });
  return res.json({ item: publicRequest(record) });
}

export async function debugLastRequests(_req, res) {
  const records = await Request.findAll({
    order: [["createdAt", "DESC"]],
    limit: 20
  });

  return res.json({
    count: records.length,
    items: records.map((row) => ({
      id: row.id,
      status: row.status,
      responseId: row.responseId,
      formTitle: row.formTitle,
      respondentEmail: row.respondentEmail,
      submittedAt: row.submittedAt,
      createdAt: row.createdAt
    }))
  });
}

// ─── Workspace ───────────────────────────────────────────────────────────────

export async function getWorkspace(req, res) {
  const { formId } = req.params;
  const userId = req.user?.id;

  const integration = await FormIntegration.findOne({ where: { formId, userId } });
  if (!integration) {
    return res.status(404).json({ error: "Form integration not found or access denied" });
  }

  const scenarioId = integration.scenario || "universal";
  const scenarioMeta = getScenario(scenarioId);

  const requests = await Request.findAll({
    where: { formId },
    order: [["createdAt", "DESC"]],
    limit: 100,
    attributes: ["id", "status", "submittedAt", "createdAt", "respondentEmail"]
  });

  const now = new Date();
  const todayCount = requests.filter((r) => {
    const d = new Date(r.submittedAt || r.createdAt);
    return !Number.isNaN(d.getTime()) && d.toDateString() === now.toDateString();
  }).length;
  const weekCount = requests.filter((r) => {
    const d = new Date(r.submittedAt || r.createdAt);
    return !Number.isNaN(d.getTime()) && d >= new Date(now.getTime() - 7 * 86400000);
  }).length;
  const newCount = requests.filter((r) => r.status === "new").length;

  return res.json({
    form: {
      id: integration.formId,
      title: integration.formTitle,
      status: integration.status,
      healthStatus: integration.healthStatus,
      lastEventAt: integration.lastEventAt,
      formUrl: integration.formUrl,
      sheetUrl: integration.sheetUrl
    },
    scenario: scenarioId,
    scenarioConfiguredAt: integration.scenarioConfiguredAt,
    scenarioMeta: {
      id: scenarioMeta.id,
      title: scenarioMeta.title,
      shortDescription: scenarioMeta.shortDescription,
      workspaceTitle: scenarioMeta.workspaceTitle,
      primaryGoal: scenarioMeta.primaryGoal,
      statusFlow: scenarioMeta.statusFlow,
      suggestedQuestions: scenarioMeta.suggestedQuestions
    },
    stats: {
      total: requests.length,
      today: todayCount,
      week: weekCount,
      new: newCount
    }
  });
}

// ─── Scenario ─────────────────────────────────────────────────────────────────

export async function updateScenario(req, res) {
  const { formId } = req.params;
  const { scenario } = req.body;
  const userId = req.user?.id;

  if (!scenario || !SCENARIO_IDS.includes(scenario)) {
    return res.status(400).json({ error: `scenario must be one of: ${SCENARIO_IDS.join(", ")}` });
  }

  const integration = await FormIntegration.findOne({ where: { formId, userId } });
  if (!integration) {
    return res.status(404).json({ error: "Form integration not found or access denied" });
  }

  integration.scenario = scenario;
  integration.scenarioConfiguredAt = new Date();
  await integration.save();

  return res.json({ scenario: integration.scenario, scenarioConfiguredAt: integration.scenarioConfiguredAt });
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export async function getFeedback(req, res) {
  const { formId } = req.params;
  const userId = req.user?.id;

  const integration = await FormIntegration.findOne({ where: { formId, userId } });
  if (!integration) {
    return res.status(404).json({ error: "Form integration not found or access denied" });
  }

  const items = await FormFeedback.findAll({
    where: { formId, userId },
    order: [["createdAt", "DESC"]],
    limit: 50,
    attributes: ["id", "message", "status", "createdAt"]
  });

  return res.json(items);
}

export async function createFeedback(req, res) {
  const { formId } = req.params;
  const { message } = req.body;
  const userId = req.user?.id;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const integration = await FormIntegration.findOne({ where: { formId, userId } });
  if (!integration) {
    return res.status(404).json({ error: "Form integration not found or access denied" });
  }

  const record = await FormFeedback.create({
    userId,
    formId,
    scenario: integration.scenario || "universal",
    message: String(message).trim().slice(0, 2000),
    status: "new"
  });

  return res.status(201).json({ ok: true, id: record.id });
}

// ─── Allowed statuses (all scenarios) ─────────────────────────────────────────

export const ALL_ALLOWED_STATUSES = [
  "new", "in_progress", "done", "test",
  "contacted", "documents_needed", "accepted", "rejected",
  "shortlisted", "interview", "hired",
  "urgent", "waiting_client",
  "confirmed", "waiting_payment", "cancelled", "attended"
];
