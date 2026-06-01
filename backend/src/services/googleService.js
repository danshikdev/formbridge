import dotenv from "dotenv";
import { env } from "../config/env.js";
import { GoogleAccount } from "../models/googleAccount.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/forms.body.readonly",
  "https://www.googleapis.com/auth/forms.responses.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/script.projects",
  "https://www.googleapis.com/auth/script.scriptapp"
];

export function isGoogleConfigured() {
  return Boolean(env.google.clientId && env.google.clientSecret && env.google.redirectUri);
}

export function buildGoogleAuthUrl(state, loginHint = "") {
  const params = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: env.google.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent select_account",
    include_granted_scopes: "true",
    scope: GOOGLE_SCOPES.join(" "),
    state
  });

  if (loginHint) params.set("login_hint", loginHint);

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function googleFetch(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (_err) {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data?.error_description || data?.error?.message || data?.error || `Google API HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function exchangeCodeForTokens(code) {
  return googleFetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      redirect_uri: env.google.redirectUri,
      grant_type: "authorization_code"
    })
  });
}

export async function refreshAccessToken(account) {
  if (!account.refreshToken) {
    throw new Error("Google refresh token is missing. Reconnect Google account.");
  }

  const data = await googleFetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      refresh_token: account.refreshToken,
      grant_type: "refresh_token"
    })
  });

  account.accessToken = data.access_token;
  account.expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null;
  account.status = "connected";
  account.lastError = null;
  await account.save();

  return account.accessToken;
}

export async function getValidAccessToken(account) {
  const expiresAt = account.expiresAt ? new Date(account.expiresAt).getTime() : 0;
  const hasTime = expiresAt && expiresAt > Date.now() + 60_000;
  return hasTime ? account.accessToken : refreshAccessToken(account);
}

export async function fetchGoogleProfile(accessToken) {
  return googleFetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` }
  });
}

export async function getGoogleAccount(userId) {
  return GoogleAccount.findOne({ where: { userId } });
}

export async function listGoogleForms(account) {
  const token = await getValidAccessToken(account);
  const query = "mimeType='application/vnd.google-apps.form' and trashed=false";
  const params = new URLSearchParams({
    q: query,
    pageSize: "50",
    fields: "files(id,name,modifiedTime,webViewLink)"
  });

  const data = await googleFetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { authorization: `Bearer ${token}` }
  });

  return data.files || [];
}

export async function getGoogleForm(account, formId) {
  const token = await getValidAccessToken(account);
  return googleFetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: { authorization: `Bearer ${token}` }
  });
}

export async function createSpreadsheet(account, title) {
  const token = await getValidAccessToken(account);
  return googleFetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ properties: { title } })
  });
}

export function buildWebhookUrl() {
  dotenv.config({ override: true });
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || env.publicBaseUrl;
  return `${publicBaseUrl.replace(/\/$/, "")}/api/forms/webhook/google`;
}

export async function createAppsScriptProject(account, title, parentId) {
  const token = await getValidAccessToken(account);
  return googleFetch("https://script.googleapis.com/v1/projects", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ title, parentId })
  });
}

export async function updateAppsScriptContent(account, scriptId, files) {
  const token = await getValidAccessToken(account);
  return googleFetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ files })
  });
}

export async function checkAppsScriptApi(account) {
  const token = await getValidAccessToken(account);
  try {
    await googleFetch("https://script.googleapis.com/v1/projects/formbridge-api-check/content", {
      headers: { authorization: `Bearer ${token}` }
    });
    return { enabled: true };
  } catch (error) {
    const message = error.message || "";
    if (/not found|requested entity was not found|permission denied|not have permission/i.test(message)) {
      return { enabled: true };
    }
    if (/has not enabled|access not configured|api has not been used|disabled/i.test(message)) {
      return { enabled: false, message };
    }
    throw error;
  }
}
