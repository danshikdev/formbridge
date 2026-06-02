import crypto from "crypto";
import { FormIntegration } from "../models/formIntegration.js";
import { GoogleAccount } from "../models/googleAccount.js";
import { IntegrationEvent } from "../models/integrationEvent.js";
import { Request } from "../models/request.js";
import {
  buildWebhookUrl,
  checkAppsScriptApi,
  createAppsScriptProject,
  createSpreadsheet,
  getGoogleAccount,
  getGoogleForm,
  updateAppsScriptContent
} from "../services/googleService.js";

function extractFormId(url) {
  if (!url) return null;
  const match = String(url).match(/\/forms\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function extractSheetId(value) {
  if (!value) return null;
  const text = String(value).trim();
  const urlMatch = text.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];
  const idMatch = text.match(/^[-_a-zA-Z0-9]{20,}$/);
  return idMatch ? idMatch[0] : null;
}

function formUrlFromId(formId) {
  return `https://docs.google.com/forms/d/${formId}/edit`;
}

function sheetUrlFromId(sheetId) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
}

function scriptEditorUrl(scriptProjectId, account) {
  const preferredEmail = process.env.DEMO_GOOGLE_ACCOUNT_EMAIL || account?.email || "";
  const authUser = preferredEmail ? `?authuser=${encodeURIComponent(preferredEmail)}` : "";
  return `https://script.google.com/home/projects/${scriptProjectId}/edit${authUser}`;
}

function generateSecret() {
  return crypto.randomBytes(32).toString("hex");
}


function escapeForScript(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildInstallerCode(item, webhookUrl = item.webhookUrl || buildWebhookUrl()) {
  const formTitle = escapeForScript(item.formTitle || "Untitled form");
  const setupConfirmUrl = webhookUrl.replace(/\/api\/forms\/webhook\/google$/, `/api/integrations/forms/${item.id}/setup-confirm`);
  return `const FORMBRIDGE_FORM_ID = "${item.formId}";
const FORMBRIDGE_SHEET_ID = "${item.sheetId || ""}";
const FORMBRIDGE_WEBHOOK_URL = "${webhookUrl}";
const FORMBRIDGE_WEBHOOK_SECRET = "${item.webhookSecret || process.env.FORMBRIDGE_WEBHOOK_SECRET || ""}";
const FORMBRIDGE_FORM_TITLE = "${formTitle}";
const FORMBRIDGE_SETUP_CONFIRM_URL = "${setupConfirmUrl}";

function installFormBridge() {
  if (!FORMBRIDGE_FORM_ID) throw new Error("FORMBRIDGE_FORM_ID is missing");
  if (!FORMBRIDGE_SHEET_ID) throw new Error("FORMBRIDGE_SHEET_ID is missing");

  const form = FormApp.openById(FORMBRIDGE_FORM_ID);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, FORMBRIDGE_SHEET_ID);

  ScriptApp.getProjectTriggers()
    .filter(function(trigger) { return trigger.getHandlerFunction() === "onSheetFormSubmit"; })
    .forEach(function(trigger) { ScriptApp.deleteTrigger(trigger); });

  ScriptApp.newTrigger("onSheetFormSubmit")
    .forSpreadsheet(FORMBRIDGE_SHEET_ID)
    .onFormSubmit()
    .create();

  UrlFetchApp.fetch(FORMBRIDGE_SETUP_CONFIRM_URL, {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-formbridge-secret": FORMBRIDGE_WEBHOOK_SECRET
    },
    payload: JSON.stringify({
      formId: FORMBRIDGE_FORM_ID,
      sheetId: FORMBRIDGE_SHEET_ID,
      installedAt: new Date().toISOString()
    }),
    muteHttpExceptions: true
  });

  return "FormBridge installed: Sheet linked and trigger created.";
}

function formBridgeResponseId(e) {
  if (e && e.range && typeof e.range.getRow === "function") {
    return FORMBRIDGE_FORM_ID + ":" + e.range.getRow();
  }
  return FORMBRIDGE_FORM_ID + ":" + Utilities.getUuid();
}

function onSheetFormSubmit(e) {
  const namedValues = e.namedValues || {};
  const answers = Object.keys(namedValues).map(function(question) {
    return {
      question: question,
      answer: Array.isArray(namedValues[question]) ? namedValues[question].join(", ") : String(namedValues[question] || "")
    };
  });

  const payload = {
    source: "google_forms",
    submittedAt: new Date().toISOString(),
    form: {
      id: FORMBRIDGE_FORM_ID,
      title: FORMBRIDGE_FORM_TITLE
    },
    responseId: formBridgeResponseId(e),
    rowNumber: e && e.range && typeof e.range.getRow === "function" ? e.range.getRow() : null,
    respondentEmail: namedValues["Email Address"] ? String(namedValues["Email Address"][0]) : null,
    answers: answers
  };

  const response = UrlFetchApp.fetch(FORMBRIDGE_WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-formbridge-secret": FORMBRIDGE_WEBHOOK_SECRET
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  console.log("FormBridge webhook", response.getResponseCode(), response.getContentText());
}
`;
}

function buildDisabledAppsScriptFiles() {
  return [
    {
      name: "Code",
      type: "SERVER_JS",
      source: `function installFormBridge() {
  return "FormBridge integration was removed. This project no longer sends webhooks.";
}

function onSheetFormSubmit(e) {
  console.log("FormBridge integration removed; webhook skipped.");
}
`
    },
    {
      name: "appsscript",
      type: "JSON",
      source: JSON.stringify({
        timeZone: "Asia/Almaty",
        exceptionLogging: "STACKDRIVER",
        runtimeVersion: "V8",
        oauthScopes: [
          "https://www.googleapis.com/auth/script.scriptapp"
        ]
      }, null, 2)
    }
  ];
}

function buildAppsScriptFiles(item, webhookUrl) {
  return [
    {
      name: "Code",
      type: "SERVER_JS",
      source: buildInstallerCode(item, webhookUrl)
    },
    {
      name: "appsscript",
      type: "JSON",
      source: JSON.stringify({
        timeZone: "Asia/Almaty",
        exceptionLogging: "STACKDRIVER",
        runtimeVersion: "V8",
        oauthScopes: [
          "https://www.googleapis.com/auth/forms",
          "https://www.googleapis.com/auth/spreadsheets",
          "https://www.googleapis.com/auth/script.external_request",
          "https://www.googleapis.com/auth/script.scriptapp"
        ]
      }, null, 2)
    }
  ];
}

function buildAppsScriptTemplate(item, webhookUrl = item.webhookUrl || buildWebhookUrl()) {
  return `const FORMBRIDGE_WEBHOOK_URL = "${webhookUrl}";
const FORMBRIDGE_WEBHOOK_SECRET = "${item.webhookSecret || process.env.FORMBRIDGE_WEBHOOK_SECRET || ""}";

function formBridgeResponseId(e) {
  if (e && e.range && typeof e.range.getRow === "function") {
    return "${item.formId}" + ":" + e.range.getRow();
  }
  return "${item.formId}" + ":" + Utilities.getUuid();
}

function onSheetFormSubmit(e) {
  const namedValues = e.namedValues || {};
  const answers = Object.keys(namedValues).map(function(question) {
    return {
      question: question,
      answer: Array.isArray(namedValues[question]) ? namedValues[question].join(", ") : String(namedValues[question] || "")
    };
  });

  const payload = {
    source: "google_forms",
    submittedAt: new Date().toISOString(),
    form: {
      id: "${item.formId}",
      title: "${String(item.formTitle || "Untitled form").replace(/"/g, '\\"')}"
    },
    responseId: formBridgeResponseId(e),
    rowNumber: e && e.range && typeof e.range.getRow === "function" ? e.range.getRow() : null,
    respondentEmail: namedValues["Email Address"] ? String(namedValues["Email Address"][0]) : null,
    answers: answers
  };

  UrlFetchApp.fetch(FORMBRIDGE_WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-formbridge-secret": FORMBRIDGE_WEBHOOK_SECRET
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}
`;
}

function publicIntegration(item) {
  return {
    id: item.id,
    userId: item.userId,
    googleAccountId: item.googleAccountId,
    formUrl: item.formUrl,
    formId: item.formId,
    formTitle: item.formTitle,
    sheetId: item.sheetId,
    sheetUrl: item.sheetUrl,
    scriptProjectId: item.scriptProjectId,
    triggerId: item.triggerId,
    webhookUrl: item.webhookUrl,
    setupMode: item.setupMode,
    status: item.status,
    healthStatus: item.healthStatus,
    lastEventAt: item.lastEventAt,
    lastErrorAt: item.lastErrorAt,
    lastErrorReason: item.lastErrorReason,
    lastVerifiedAt: item.lastVerifiedAt,
    lastTestAt: item.lastTestAt,
    lastTestResult: item.lastTestResult,
    setupChecklist: item.setupChecklist,
    scenario: item.scenario || "universal",
    scenarioConfiguredAt: item.scenarioConfiguredAt || null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    webhookSecretMasked: item.webhookSecret ? `${item.webhookSecret.slice(0, 6)}...${item.webhookSecret.slice(-4)}` : null
  };
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
    sheet: Boolean(item.sheetId),
    webhookUrl: Boolean(item.webhookUrl),
    webhookSecret: Boolean(item.webhookSecret),
    trigger: Boolean(item.triggerId || item.setupChecklist?.trigger),
    lastTest: item.lastTestResult === "ok"
  };

  const requiredChecklist = {
    googleAccount: checklist.googleAccount,
    form: checklist.form,
    sheet: checklist.sheet,
    webhookUrl: checklist.webhookUrl,
    webhookSecret: checklist.webhookSecret,
    trigger: checklist.trigger
  };

  const broken = Object.entries(requiredChecklist)
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

export async function confirmSetupInstalled(req, res) {
  const item = await FormIntegration.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Integration not found" });

  const expectedSecret = item.webhookSecret || process.env.FORMBRIDGE_WEBHOOK_SECRET || "";
  const providedSecret = req.get("x-formbridge-secret") || "";
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return res.status(401).json({ error: "Invalid setup secret" });
  }

  item.triggerId = "apps_script_install_confirmed";
  item.status = "ready";
  item.healthStatus = "connected";
  item.setupChecklist = {
    ...(item.setupChecklist || {}),
    googleAccount: Boolean(item.googleAccountId),
    form: Boolean(item.formId),
    sheet: Boolean(item.sheetId),
    webhookUrl: Boolean(item.webhookUrl),
    webhookSecret: Boolean(item.webhookSecret),
    trigger: true,
    lastTest: item.lastTestResult === "ok"
  };
  item.lastVerifiedAt = new Date();
  item.lastErrorReason = null;
  await item.save();

  await logIntegrationEvent({
    integrationId: item.id,
    type: "setup_confirmed",
    status: "ok",
    message: "Apps Script installer confirmed trigger creation.",
    payload: {
      formId: req.body?.formId || null,
      sheetId: req.body?.sheetId || null,
      installedAt: req.body?.installedAt || null
    }
  });

  return res.json({ ok: true });
}

export async function listIntegrations(req, res) {
  const userId = req.user?.id || null;
  const items = await FormIntegration.findAll({
    where: userId ? { userId } : {},
    order: [["createdAt", "DESC"]]
  });

  return res.json({ items: items.map(publicIntegration) });
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
      webhookUrl: buildWebhookUrl(),
      webhookSecret: process.env.FORMBRIDGE_WEBHOOK_SECRET || generateSecret(),
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
  const shouldCreateSheet = req.body.createSheet !== false;
  if (!formId) return res.status(400).json({ error: "formId is required" });

  const account = await getGoogleAccount(req.user.id);
  if (!account) return res.status(409).json({ error: "Connect Google account first" });

  const webhookUrl = buildWebhookUrl();
  const webhookSecret = process.env.FORMBRIDGE_WEBHOOK_SECRET || generateSecret();
  const checklist = {
    googleAccount: true,
    form: true,
    sheet: false,
    webhookUrl: true,
    webhookSecret: true,
    trigger: false,
    lastTest: false
  };

  let resolvedTitle = formTitle || "Untitled form";
  let sheetId = null;
  let sheetUrl = null;
  let setupNote = shouldCreateSheet
    ? "OAuth setup prepared. Sheet created; Apps Script trigger installation is ready for the next Google Cloud step."
    : "OAuth setup draft created. Choose an existing linked Sheet or create a FormBridge Sheet.";

  try {
    const googleForm = await getGoogleForm(account, formId);
    resolvedTitle = googleForm.info?.title || resolvedTitle;
    if (googleForm.linkedSheetId) {
      sheetId = googleForm.linkedSheetId;
      sheetUrl = sheetUrlFromId(sheetId);
      checklist.sheet = true;
      setupNote = "Existing Google Forms response Sheet found. Apps Script trigger installation is ready.";
    }
  } catch (err) {
    await logIntegrationEvent({ type: "google_form_read", status: "error", message: err.message, payload: { formId } });
  }

  if (shouldCreateSheet && !sheetId) {
    try {
      const spreadsheet = await createSpreadsheet(account, `FormBridge - ${resolvedTitle}`);
      sheetId = spreadsheet.spreadsheetId;
      sheetUrl = spreadsheet.spreadsheetUrl;
      checklist.sheet = Boolean(sheetId);
    } catch (err) {
      setupNote = `OAuth connected, but Sheet creation failed: ${err.message}`;
      await logIntegrationEvent({ type: "sheet_create", status: "error", message: err.message, payload: { formId } });
    }
  }

  const [record] = await FormIntegration.findOrCreate({
    where: { formId },
    defaults: {
      userId: req.user.id,
      googleAccountId: account.id,
      formUrl: formUrlFromId(formId),
      formId,
      formTitle: resolvedTitle,
      sheetId,
      sheetUrl,
      webhookUrl,
      webhookSecret,
      setupMode: "oauth",
      status: checklist.sheet ? "configured" : "draft",
      healthStatus: checklist.sheet ? "needs_trigger" : "needs_sheet",
      setupChecklist: checklist,
      lastErrorReason: checklist.sheet ? null : setupNote,
      lastErrorAt: checklist.sheet ? null : new Date()
    }
  });

  if (!record.isNewRecord) {
    await record.update({
      userId: req.user.id,
      googleAccountId: account.id,
      formUrl: formUrlFromId(formId),
      formTitle: resolvedTitle,
      sheetId: record.sheetId || sheetId,
      sheetUrl: record.sheetUrl || sheetUrl,
      webhookUrl,
      webhookSecret: record.webhookSecret || webhookSecret,
      setupMode: "oauth",
      status: checklist.sheet || record.sheetId ? "configured" : "draft",
      healthStatus: checklist.sheet || record.sheetId ? "needs_trigger" : "needs_sheet",
      setupChecklist: { ...checklist, sheet: Boolean(record.sheetId || sheetId) }
    });
  }

  await logIntegrationEvent({
    integrationId: record.id,
    type: "oauth_setup",
    status: checklist.sheet ? "ok" : "warning",
    message: setupNote,
    payload: { formId, sheetId: record.sheetId || sheetId }
  });

  return res.status(201).json({ item: publicIntegration(record), message: setupNote });
}

export async function prepareIntegrationSheet(req, res) {
  const item = await FormIntegration.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Integration not found" });

  if (req.user?.id && item.userId && item.userId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const account = await getGoogleAccount(req.user.id);
  if (!account) return res.status(409).json({ error: "Connect Google account first" });

  try {
    const spreadsheet = await createSpreadsheet(account, `FormBridge - ${item.formTitle || item.formId}`);
    item.googleAccountId = account.id;
    item.sheetId = spreadsheet.spreadsheetId;
    item.sheetUrl = spreadsheet.spreadsheetUrl;
    item.setupMode = "oauth";
    item.status = "configured";
    item.healthStatus = "needs_trigger";
    item.setupChecklist = {
      ...(item.setupChecklist || {}),
      googleAccount: true,
      form: Boolean(item.formId),
      sheet: true,
      webhookUrl: Boolean(item.webhookUrl),
      webhookSecret: Boolean(item.webhookSecret),
      trigger: false,
      lastTest: item.lastTestResult === "ok"
    };
    item.lastErrorReason = null;
    await item.save();

    await logIntegrationEvent({
      integrationId: item.id,
      type: "sheet_create",
      status: "ok",
      message: "Prepared a new FormBridge Sheet for this form.",
      payload: { sheetId: item.sheetId }
    });

    return res.json({ item: publicIntegration(item) });
  } catch (err) {
    item.healthStatus = "broken";
    item.lastErrorReason = `Sheet creation failed: ${err.message}`;
    item.lastErrorAt = new Date();
    await item.save();
    await logIntegrationEvent({ integrationId: item.id, type: "sheet_create", status: "error", message: err.message });
    return res.status(502).json({ error: `Sheet creation failed: ${err.message}` });
  }
}

export async function attachExistingSheet(req, res) {
  const item = await FormIntegration.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Integration not found" });

  if (req.user?.id && item.userId && item.userId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const sheetId = extractSheetId(req.body.sheetUrl || req.body.sheetId);
  if (!sheetId) {
    return res.status(400).json({ error: "Valid Google Sheet URL is required" });
  }

  item.sheetId = sheetId;
  item.sheetUrl = sheetUrlFromId(sheetId);
  item.setupMode = "oauth_existing_sheet";
  item.status = "configured";
  item.healthStatus = "needs_trigger";
  item.setupChecklist = {
    ...(item.setupChecklist || {}),
    googleAccount: Boolean(item.googleAccountId),
    form: Boolean(item.formId),
    sheet: true,
    webhookUrl: Boolean(item.webhookUrl),
    webhookSecret: Boolean(item.webhookSecret),
    trigger: false,
    lastTest: item.lastTestResult === "ok"
  };
  item.lastErrorReason = null;
  await item.save();

  await logIntegrationEvent({
    integrationId: item.id,
    type: "sheet_attach",
    status: "ok",
    message: "Existing linked Sheet attached to FormBridge setup.",
    payload: { sheetId }
  });

  return res.json({ item: publicIntegration(item) });
}

export async function deleteIntegration(req, res) {
  const item = await FormIntegration.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Integration not found" });

  if (req.user?.id && item.userId && item.userId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  let cleanupMessage = "Integration removed from FormBridge";
  if (item.scriptProjectId) {
    try {
      const account = await getGoogleAccount(req.user.id);
      if (account) {
        await updateAppsScriptContent(account, item.scriptProjectId, buildDisabledAppsScriptFiles());
        cleanupMessage = "Integration removed from FormBridge and Apps Script webhook disabled";
      }
    } catch (err) {
      cleanupMessage = `Integration removed from FormBridge, but Apps Script cleanup failed: ${err.message}`;
      console.warn("[deleteIntegration] Apps Script cleanup failed:", err.message);
    }
  }

  await logIntegrationEvent({ integrationId: item.id, type: "integration_delete", status: "ok", message: cleanupMessage });
  await item.destroy();

  return res.json({ ok: true, message: cleanupMessage });
}

export async function saveWebhook(req, res) {
  const { id } = req.params;
  const { webhookUrl, webhookSecret } = req.body;

  const item = await FormIntegration.findByPk(id);
  if (!item) return res.status(404).json({ error: "Integration not found" });

  item.webhookUrl = webhookUrl || null;
  item.webhookSecret = webhookSecret || null;
  item.status = webhookUrl && webhookSecret ? "configured" : item.status;
  await item.save();

  await logIntegrationEvent({ integrationId: item.id, type: "webhook_update", status: "ok", message: "Webhook settings saved" });
  return res.json({ item: publicIntegration(item) });
}

export async function testIntegration(req, res) {
  const { id } = req.params;
  const item = await FormIntegration.findByPk(id);
  if (!item) return res.status(404).json({ error: "Integration not found" });

  if (!item.webhookUrl || !item.webhookSecret) {
    item.lastTestAt = new Date();
    item.lastTestResult = "missing_webhook";
    item.healthStatus = "broken";
    item.lastErrorAt = new Date();
    item.lastErrorReason = "Webhook URL/secret missing";
    await item.save();
    await logIntegrationEvent({ integrationId: item.id, type: "test", status: "error", message: item.lastErrorReason });
    return res.status(400).json({ ok: false, message: "Webhook URL/secret missing", item: publicIntegration(item) });
  }

  const payload = {
    source: "google_forms",
    isTest: true,
    submittedAt: new Date().toISOString(),
    form: {
      id: item.formId,
      title: item.formTitle || "Untitled form"
    },
    responseId: `integration-test-${Date.now()}`,
    respondentEmail: null,
    answers: [{ question: "test", answer: "ok" }]
  };

  let responseCode = 0;
  let responseText = "";

  try {
    const upstream = await fetch(item.webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-formbridge-secret": item.webhookSecret
      },
      body: JSON.stringify(payload)
    });

    responseCode = upstream.status;
    responseText = await upstream.text();
  } catch (error) {
    item.lastTestAt = new Date();
    item.lastTestResult = "network_error";
    item.healthStatus = "broken";
    item.lastErrorAt = new Date();
    item.lastErrorReason = error.message;
    await item.save();
    await logIntegrationEvent({ integrationId: item.id, type: "test", status: "error", message: error.message, payload });
    return res.status(502).json({ ok: false, message: `Network error: ${error.message}`, item: publicIntegration(item) });
  }

  item.lastTestAt = new Date();
  item.lastTestResult = responseCode >= 200 && responseCode < 300 ? "ok" : `upstream_${responseCode}`;
  item.status = item.lastTestResult === "ok" ? "ready" : item.status;
  item.healthStatus = item.lastTestResult === "ok" ? "connected" : "broken";
  item.lastErrorReason = item.lastTestResult === "ok" ? null : `Webhook responded with HTTP ${responseCode}`;
  item.lastErrorAt = item.lastTestResult === "ok" ? item.lastErrorAt : new Date();
  await item.save();
  await verifyIntegrationRecord(item);

  await logIntegrationEvent({
    integrationId: item.id,
    type: "test",
    status: item.lastTestResult === "ok" ? "ok" : "error",
    message: item.lastTestResult === "ok" ? "Connection test passed" : `Webhook responded with HTTP ${responseCode}`,
    payload
  });

  return res.json({
    ok: item.lastTestResult === "ok",
    message: item.lastTestResult === "ok" ? "Connection looks good" : `Webhook responded with HTTP ${responseCode}`,
    responseCode,
    responseText,
    item: publicIntegration(item)
  });
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

export async function checkAppsScriptApiStatus(req, res) {
  const account = await getGoogleAccount(req.user.id);
  if (!account) return res.status(409).json({ error: "Connect Google account first" });

  try {
    const integrationId = req.body?.integrationId || null;
    if (integrationId) {
      const item = await FormIntegration.findByPk(integrationId);
      if (!item) return res.status(404).json({ error: "Integration not found" });
      if (req.user?.id && item.userId && item.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (!item.sheetId) {
        return res.status(409).json({ error: "Sheet is missing. Prepare Google Sheet first." });
      }

      const currentWebhookUrl = buildWebhookUrl();
      item.webhookUrl = currentWebhookUrl;
      item.googleAccountId = account.id;
      item.setupMode = "oauth_installer";

      if (!item.scriptProjectId) {
        const project = await createAppsScriptProject(account, `FormBridge - ${item.formTitle || item.formId}`, item.sheetId);
        item.scriptProjectId = project.scriptId;
      }

      await updateAppsScriptContent(account, item.scriptProjectId, buildAppsScriptFiles(item, currentWebhookUrl));

      item.status = "configured";
      item.healthStatus = "needs_trigger";
      item.setupChecklist = {
        ...(item.setupChecklist || {}),
        googleAccount: true,
        form: Boolean(item.formId),
        sheet: Boolean(item.sheetId),
        webhookUrl: true,
        webhookSecret: Boolean(item.webhookSecret),
        trigger: false,
        lastTest: item.lastTestResult === "ok"
      };
      item.lastErrorReason = "Open Apps Script and run installFormBridge once to authorize and create trigger.";
      item.lastErrorAt = new Date();
      await item.save();

      return res.json({
        ok: true,
        enabled: true,
        item: publicIntegration(item),
        scriptProjectId: item.scriptProjectId,
        scriptUrl: scriptEditorUrl(item.scriptProjectId, account),
        googleAccount: process.env.DEMO_GOOGLE_ACCOUNT_EMAIL || account.email,
        settingsUrl: "https://script.google.com/home/usersettings",
        code: "apps_script_api_enabled"
      });
    }

    const result = await checkAppsScriptApi(account);
    return res.json({
      ok: result.enabled,
      enabled: result.enabled,
      googleAccount: process.env.DEMO_GOOGLE_ACCOUNT_EMAIL || account.email,
      settingsUrl: "https://script.google.com/home/usersettings",
      code: result.enabled ? "apps_script_api_enabled" : "apps_script_api_missing"
    });
  } catch (err) {
    return res.json({
      ok: false,
      enabled: false,
      googleAccount: process.env.DEMO_GOOGLE_ACCOUNT_EMAIL || account.email,
      settingsUrl: "https://script.google.com/home/usersettings",
      code: "apps_script_api_missing"
    });
  }
}

export async function autoSetupIntegration(req, res) {
  const item = await FormIntegration.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Integration not found" });

  const account = await getGoogleAccount(req.user.id);
  if (!account) return res.status(409).json({ error: "Connect Google account first" });
  if (!item.sheetId) return res.status(409).json({ error: "Sheet is missing. Select the form again so FormBridge can create a Sheet." });

  const currentWebhookUrl = buildWebhookUrl();
  item.webhookUrl = currentWebhookUrl;
  item.googleAccountId = account.id;
  item.setupMode = "oauth_installer";

  try {
    let scriptProjectId = item.scriptProjectId;

    if (!scriptProjectId) {
      const project = await createAppsScriptProject(account, `FormBridge - ${item.formTitle || item.formId}`, item.sheetId);
      scriptProjectId = project.scriptId;
      item.scriptProjectId = scriptProjectId;
    }

    await updateAppsScriptContent(account, scriptProjectId, buildAppsScriptFiles(item, currentWebhookUrl));

    item.status = "configured";
    item.healthStatus = "needs_trigger";
    item.setupChecklist = {
      ...(item.setupChecklist || {}),
      googleAccount: true,
      form: Boolean(item.formId),
      sheet: Boolean(item.sheetId),
      webhookUrl: true,
      webhookSecret: Boolean(item.webhookSecret),
      trigger: false,
      lastTest: item.lastTestResult === "ok"
    };
    item.lastErrorReason = "Open Apps Script and run installFormBridge once to authorize and create trigger.";
    item.lastErrorAt = new Date();
    await item.save();

    await logIntegrationEvent({
      integrationId: item.id,
      type: "auto_setup_script",
      status: "ok",
      message: "Apps Script installer created/updated. User authorization is required once.",
      payload: { scriptProjectId, scriptUrl: scriptEditorUrl(scriptProjectId, account), googleAccount: process.env.DEMO_GOOGLE_ACCOUNT_EMAIL || account.email }
    });

    return res.json({
      item: publicIntegration(item),
      scriptProjectId,
      scriptUrl: scriptEditorUrl(scriptProjectId, account),
      googleAccount: process.env.DEMO_GOOGLE_ACCOUNT_EMAIL || account.email,
      functionName: "installFormBridge",
      message: "Installer created. Open Apps Script, run installFormBridge once, and approve Google permissions."
    });
  } catch (err) {
    item.healthStatus = "broken";
    item.lastErrorReason = err.message;
    item.lastErrorAt = new Date();
    await item.save();
    await logIntegrationEvent({ integrationId: item.id, type: "auto_setup_script", status: "error", message: err.message });
    return res.status(502).json({ error: `Auto setup failed: ${err.message}` });
  }
}

export async function getSetupScript(req, res) {
  const item = await FormIntegration.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Integration not found" });

  const currentWebhookUrl = buildWebhookUrl();
  if (item.webhookUrl !== currentWebhookUrl) {
    item.webhookUrl = currentWebhookUrl;
    await item.save();
    await logIntegrationEvent({
      integrationId: item.id,
      type: "webhook_sync",
      status: "ok",
      message: `Webhook URL synced from PUBLIC_BASE_URL: ${currentWebhookUrl}`
    });
  }

  return res.json({
    webhookUrl: currentWebhookUrl,
    webhookSecret: item.webhookSecret,
    sheetUrl: item.sheetUrl,
    code: buildAppsScriptTemplate(item, currentWebhookUrl),
    instructions: [
      "Open the linked Google Sheet",
      "Extensions -> Apps Script",
      "Paste this code into Code.gs",
      "Create trigger: onSheetFormSubmit, event source From spreadsheet, event type On form submit",
      "Submit a Google Form response and check FormBridge Health"
    ]
  });
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
