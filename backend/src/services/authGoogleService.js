import { env } from "../config/env.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

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
    throw new Error(message);
  }

  return data;
}

export function buildGoogleLoginUrl(state, loginHint = "") {
  const redirectUri = env.google.loginRedirectUri || env.google.redirectUri;
  const params = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state
  });

  if (loginHint) params.set("login_hint", loginHint);

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeLoginCodeForTokens(code) {
  const redirectUri = env.google.loginRedirectUri || env.google.redirectUri;
  return googleFetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });
}

export async function fetchLoginProfile(accessToken) {
  return googleFetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` }
  });
}
