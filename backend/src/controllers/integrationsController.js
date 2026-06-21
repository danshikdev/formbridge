import { Op } from "sequelize";
import { FormIntegration } from "../models/formIntegration.js";
import { FormMember } from "../models/formMember.js";
import { GoogleAccount } from "../models/googleAccount.js";
import { IntegrationEvent } from "../models/integrationEvent.js";
import { Request } from "../models/request.js";
import { syncFormIntegration } from "../services/googleFormsSyncService.js";
import {
  getGoogleAccount,
  getGoogleForm
} from "../services/googleService.js";

function extractFormId(url) {
  if (!url) return null;
  const match = String(url).match(/\/forms\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function formUrlFromId(formId) {
  return `https://docs.google.com/forms/d/${formId}/edit`;
}


function publicIntegration(item) {
  return {
    id: item.id,
    userId: item.userId,
    googleAccountId: item.googleAccountId,
    formUrl: item.formUrl,
    formId: item.formId,
    formTitle: item.formTitle,
    setupMode: item.setupMode,
    status: item.status,
    healthStatus: item.healthStatus,
    lastEventAt: item.lastEventAt,
    lastErrorAt: item.lastErrorAt,
    lastErrorReason: item.lastErrorReason,
    lastVerifiedAt: item.lastVerifiedAt,
    setupChecklist: item.setupChecklist,
    formSchema: item.formSchema || null,
    syncEnabled: Boolean(item.syncEnabled),
    syncStatus: item.syncStatus || "idle",
    lastSyncedAt: item.lastSyncedAt || null,
    lastSyncError: item.lastSyncError || null,
    scenario: item.scenario || "universal",
    scenarioConfiguredAt: item.scenarioConfiguredAt || null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function findOwnedIntegration(id, userId) {
  const item = await FormIntegration.findByPk(id);
  if (!item) return null;
  if (userId && item.userId && item.userId !== userId) {
    const error = new Error("Forbidden");
    error.status = 403;
    error.code = "ownership_forbidden";
    throw error;
  }
  return item;
}

async function logIntegrationEvent(fields) {
  return IntegrationEvent.create(fields).catch((err) => {
    console.error("Failed to write integration event", err.message);
  });
}

async function verifyIntegrationRecord(item) {
  const checklist = {
    googleAccount: Boolean(item.googleAccountId),
    form: Boolean(item.formId),
    formSchema: Boolean(item.formSchema),
    polling: Boolean(item.syncEnabled),
    lastSync: Boolean(item.lastSyncedAt),
    syncHealthy: item.syncStatus !== "error"
  };

  const required = {
    googleAccount: checklist.googleAccount,
    form: checklist.form,
    formSchema: checklist.formSchema,
    polling: checklist.polling,
    syncHealthy: checklist.syncHealthy
  };

  const broken = Object.entries(required)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  item.setupChecklist = checklist;
  item.lastVerifiedAt = new Date();
  item.healthStatus = broken.length ? "broken" : "connected";
  item.status = broken.length ? item.status : "ready";
  item.lastErrorReason = broken.length ? `Missing: ${broken.join(", ")}` : null;
  item.lastErrorAt = broken.length ? new Date() : item.lastErrorAt;
  await item.save();

  return { checklist, broken };
}


export async function listIntegrations(req, res) {
  const userId = req.userId || null;

  // Own forms
  const ownItems = await FormIntegration.findAll({
    where: userId ? { userId } : {},
    order: [["createdAt", "DESC"]]
  });

  // Shared forms (only configured ones — scenarioConfiguredAt is not null)
  const memberships = userId
    ? await FormMember.findAll({ where: { memberId: userId } })
    : [];

  const sharedFormIds = memberships.map((m) => m.formId);
  const sharedItems = sharedFormIds.length
    ? await FormIntegration.findAll({
        where: { formId: sharedFormIds, scenarioConfiguredAt: { [Op.ne]: null } },
        order: [["createdAt", "DESC"]]
      })
    : [];

  const ownSet = new Set(ownItems.map((i) => i.formId));
  const combined = [
    ...ownItems.map((i) => ({ ...publicIntegration(i), isShared: false })),
    ...sharedItems
      .filter((i) => !ownSet.has(i.formId))
      .map((i) => ({ ...publicIntegration(i), isShared: true }))
  ];

  return res.json({ items: combined });
}

export async function createIntegration(req, res) {
  const { formUrl, formTitle } = req.body;
  const formId = extractFormId(formUrl);

  if (!formUrl || !formId) {
    return res.status(400).json({ error: "Valid Google Form URL is required" });
  }

  const [record] = await FormIntegration.findOrCreate({
    where: { formId },
    defaults: {
      userId: req.user?.id || null,
      formUrl,
      formId,
      formTitle: formTitle || "Untitled form",
      setupMode: "manual",
      status: "connected",
      healthStatus: "unknown"
    }
  });

  await logIntegrationEvent({ integrationId: record.id, type: "manual_create", status: "ok", message: "Manual integration created" });
  return res.status(201).json({ item: publicIntegration(record) });
}

export async function setupGoogleIntegration(req, res) {
  const { formId, formTitle } = req.body;
  if (!formId) return res.status(400).json({ error: "formId is required" });

  const account = await getGoogleAccount(req.user.id);
  if (!account) return res.status(409).json({ error: "Connect Google account first" });

  let resolvedTitle = formTitle || "Untitled form";
  try {
    const googleForm = await getGoogleForm(account, formId);
    resolvedTitle = googleForm.info?.title || resolvedTitle;
  } catch (err) {
    await logIntegrationEvent({ type: "google_form_read", status: "error", message: err.message, payload: { formId } });
  }

  const [record] = await FormIntegration.findOrCreate({
    where: { formId },
    defaults: {
      userId: req.user.id,
      googleAccountId: account.id,
      formUrl: formUrlFromId(formId),
      formId,
      formTitle: resolvedTitle,
      setupMode: "oauth",
      status: "draft",
      healthStatus: "needs_sync"
    }
  });

  if (!record.isNewRecord) {
    await record.update({
      userId: req.user.id,
      googleAccountId: account.id,
      formUrl: formUrlFromId(formId),
      formTitle: resolvedTitle,
      setupMode: "oauth"
    });
  }

  await logIntegrationEvent({
    integrationId: record.id,
    type: "oauth_setup",
    status: "ok",
    message: "Integration record created. Ready for Forms API polling.",
    payload: { formId }
  });

  return res.status(201).json({ item: publicIntegration(record) });
}

export async function enablePolling(req, res) {
  try {
    const item = await findOwnedIntegration(req.params.id, req.user?.id);
    if (!item) return res.status(404).json({ error: "Integration not found" });

    if (!item.userId) item.userId = req.user.id;
    item.setupMode = "forms_api_polling";
    item.syncEnabled = true;
    item.syncStatus = "syncing";
    item.lastSyncError = null;
    await item.save();

    const result = await syncFormIntegration(item.id);

    await logIntegrationEvent({
      integrationId: item.id,
      type: "enable_polling",
      status: "ok",
      message: "Google Forms API polling enabled.",
      payload: {
        created: result.created,
        skipped: result.skipped,
        total: result.total,
        lastSyncedAt: result.lastSyncedAt
      }
    });

    return res.json({
      ok: true,
      integration: publicIntegration(result.integration),
      created: result.created,
      skipped: result.skipped,
      total: result.total,
      lastSyncedAt: result.lastSyncedAt
    });
  } catch (err) {
    const isOwnForbidden = err.code === "ownership_forbidden";
    const status = err.status || 502;
    if (!isOwnForbidden) {
      await logIntegrationEvent({
        integrationId: req.params.id,
        type: "enable_polling",
        status: "error",
        message: err.message
      });
    }
    return res.status(status).json({ error: isOwnForbidden ? "Forbidden" : err.message });
  }
}

export async function syncNow(req, res) {
  try {
    const item = await findOwnedIntegration(req.params.id, req.user?.id);
    if (!item) return res.status(404).json({ error: "Integration not found" });

    const result = await syncFormIntegration(item.id);

    await logIntegrationEvent({
      integrationId: item.id,
      type: "sync_now",
      status: "ok",
      message: "Google Forms API sync completed.",
      payload: {
        created: result.created,
        skipped: result.skipped,
        total: result.total,
        lastSyncedAt: result.lastSyncedAt
      }
    });

    return res.json({
      ok: true,
      integration: publicIntegration(result.integration),
      created: result.created,
      skipped: result.skipped,
      total: result.total,
      lastSyncedAt: result.lastSyncedAt
    });
  } catch (err) {
    const isOwnForbidden = err.code === "ownership_forbidden";
    const status = err.status || 502;
    if (!isOwnForbidden) {
      await logIntegrationEvent({
        integrationId: req.params.id,
        type: "sync_now",
        status: "error",
        message: err.message
      });
    }
    return res.status(status).json({ error: isOwnForbidden ? "Forbidden" : err.message });
  }
}


export async function deleteIntegration(req, res) {
  const item = await FormIntegration.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Integration not found" });

  if (req.user?.id && item.userId && item.userId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await logIntegrationEvent({ integrationId: item.id, type: "integration_delete", status: "ok", message: "Integration removed from FormBridge" });
  await item.destroy();

  return res.json({ ok: true });
}


export async function verifyIntegration(req, res) {
  const item = await FormIntegration.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Integration not found" });

  const result = await verifyIntegrationRecord(item);
  await logIntegrationEvent({
    integrationId: item.id,
    type: "verify",
    status: result.broken.length ? "warning" : "ok",
    message: result.broken.length ? `Broken checks: ${result.broken.join(", ")}` : "All checks passed",
    payload: result
  });

  return res.json({ item: publicIntegration(item), ...result });
}


export async function integrationHealth(req, res) {
  const userId = req.user?.id || null;
  const items = await FormIntegration.findAll({
    where: userId ? { userId } : {},
    order: [["updatedAt", "DESC"]]
  });

  const integrationIds = items.map((item) => item.id);
  const events = integrationIds.length
    ? await IntegrationEvent.findAll({
        where: { integrationId: integrationIds },
        order: [["createdAt", "DESC"]],
        limit: 50
      })
    : [];

  return res.json({
    items: items.map(publicIntegration),
    events
  });
}

export async function integrationEvents(req, res) {
  const events = await IntegrationEvent.findAll({
    where: { integrationId: req.params.id },
    order: [["createdAt", "DESC"]],
    limit: 100
  });

  return res.json({ items: events });
}

export async function updateStatuses(req, res) {
  const { id } = req.params;
  const userId = req.userId;
  const { statuses } = req.body;

  if (!Array.isArray(statuses)) {
    return res.status(400).json({ error: "statuses must be an array" });
  }
  for (const s of statuses) {
    if (!s || typeof s.key !== "string" || !s.key.trim() || typeof s.label !== "string" || !s.label.trim()) {
      return res.status(400).json({ error: "Each status must have non-empty key and label strings" });
    }
  }

  const integration = await FormIntegration.findOne({ where: { id, userId } });
  if (!integration) {
    return res.status(404).json({ error: "Integration not found" });
  }

  // null = reset to scenario defaults
  const customStatuses = statuses.length > 0 ? statuses : null;
  await integration.update({ customStatuses });

  return res.json({ ok: true, customStatuses });
}
