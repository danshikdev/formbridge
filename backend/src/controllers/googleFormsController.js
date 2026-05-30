import { FormIntegration } from "../models/formIntegration.js";
import { IntegrationEvent } from "../models/integrationEvent.js";
import { NotificationSettings } from "../models/notificationSettings.js";
import { Request } from "../models/request.js";
import { sendMessage } from "../services/whatsappService.js";

async function dispatchWhatsappNotifications(formId, record) {
  try {
    const settings = await NotificationSettings.findAll({
      where: { formId, channel: "whatsapp", enabled: true }
    });

    for (const s of settings) {
      if (!s.phoneNumber) continue;
      const title = record.formTitle || formId;
      const email = record.respondentEmail ? ` От: ${record.respondentEmail}.` : "";
      const text = `FormBridge: новая заявка в форме «${title}».${email}`;
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

  const [record, created] = await Request.findOrCreate({
    where: { responseId },
    defaults: {
      source: payload.source || "google_forms",
      formId,
      formTitle: payload.form?.title || null,
      respondentEmail: payload.respondentEmail || null,
      submittedAt: payload.submittedAt ? new Date(payload.submittedAt) : null,
      answers: Array.isArray(payload.answers) ? payload.answers : [],
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
  const allowed = ["new", "in_progress", "done", "test"];
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
