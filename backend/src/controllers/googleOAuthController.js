import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { GoogleAccount } from "../models/googleAccount.js";
import {
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  fetchGoogleProfile,
  getGoogleAccount,
  isGoogleConfigured,
  listGoogleForms
} from "../services/googleService.js";

function encodeState(userId) {
  return jwt.sign({ sub: userId, purpose: "google_oauth" }, env.jwtSecret, { expiresIn: "10m" });
}

function decodeState(state) {
  const payload = jwt.verify(state, env.jwtSecret);
  if (payload.purpose !== "google_oauth") throw new Error("Invalid OAuth state");
  return payload.sub;
}

function publicAccount(account) {
  if (!account) return null;
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
    status: account.status,
    scope: account.scope,
    expiresAt: account.expiresAt,
    lastError: account.lastError,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
}

export async function googleOAuthStatus(req, res) {
  const account = await getGoogleAccount(req.user.id);
  return res.json({
    configured: isGoogleConfigured(),
    demoGoogleAccountEmail: env.demoGoogleAccountEmail,
    account: publicAccount(account)
  });
}

export async function googleOAuthStart(req, res) {
  if (!isGoogleConfigured()) {
    return res.status(400).json({
      error: "Google OAuth is not configured",
      requiredEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"]
    });
  }

  return res.json({ url: buildGoogleAuthUrl(encodeState(req.user.id), env.demoGoogleAccountEmail || req.user.email) });
}

export async function googleOAuthCallback(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${env.google.oauthErrorUrl}&reason=${encodeURIComponent(error)}`);
  }

  try {
    const userId = decodeState(state);
    const tokens = await exchangeCodeForTokens(code);
    const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;
    const profile = await fetchGoogleProfile(tokens.access_token);
    const expectedEmail = env.demoGoogleAccountEmail.toLowerCase();
    const actualEmail = String(profile.email || "").toLowerCase();

    if (expectedEmail && actualEmail !== expectedEmail) {
      return res.redirect(`${env.google.oauthErrorUrl}&reason=${encodeURIComponent(`Use demo Google account: ${env.demoGoogleAccountEmail}`)}`);
    }

    const existing = await GoogleAccount.findOne({ where: { userId } });
    const payload = {
      userId,
      googleUserId: profile.id || null,
      email: profile.email || null,
      displayName: profile.name || profile.email || null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || existing?.refreshToken || null,
      scope: tokens.scope || null,
      tokenType: tokens.token_type || null,
      expiresAt,
      status: "connected",
      lastError: null
    };

    if (existing) {
      await existing.update(payload);
    } else {
      await GoogleAccount.create(payload);
    }

    return res.redirect(env.google.oauthSuccessUrl);
  } catch (err) {
    return res.redirect(`${env.google.oauthErrorUrl}&reason=${encodeURIComponent(err.message)}`);
  }
}

export async function googleFormsList(req, res) {
  const account = await getGoogleAccount(req.user.id);
  if (!account) return res.status(409).json({ error: "Google account is not connected" });

  try {
    const files = await listGoogleForms(account);
    return res.json({
      items: files.map((file) => ({
        id: file.id,
        name: file.name,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink
      }))
    });
  } catch (err) {
    account.status = "broken";
    account.lastError = err.message;
    await account.save();
    const isTokenError = /expired|revoked|invalid_grant/i.test(err.message);
    if (isTokenError) {
      return res.status(401).json({ error: `Google Forms list failed: ${err.message}`, code: "google_token_expired" });
    }
    return res.status(502).json({ error: `Google Forms list failed: ${err.message}` });
  }
}
