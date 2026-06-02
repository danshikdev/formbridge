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
  "https://www.googleapis.com/auth/spreadsheets"
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

export async function revokeGoogleToken(token) {
  if (!token) return false;

  try {
    await googleFetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token })
    });
    return true;
  } catch (err) {
    console.warn("[Google] token revoke failed:", err.message);
    return false;
  }
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

export async function listGoogleFormResponses(account, formId) {
  const token = await getValidAccessToken(account);
  const responses = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await googleFetch(`https://forms.googleapis.com/v1/forms/${formId}/responses?${params.toString()}`, {
      headers: { authorization: `Bearer ${token}` }
    });

    responses.push(...(data.responses || []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return responses;
}

