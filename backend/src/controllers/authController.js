import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/user.js";
import { buildGoogleLoginUrl, exchangeLoginCodeForTokens, fetchLoginProfile } from "../services/authGoogleService.js";
import { signAccessToken } from "../services/tokenService.js";

function sanitizeUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}


function encodeGoogleLoginState() {
  return jwt.sign({ purpose: "google_login" }, env.jwtSecret, { expiresIn: "10m" });
}

function decodeGoogleLoginState(state) {
  const payload = jwt.verify(state, env.jwtSecret);
  if (payload.purpose !== "google_login") throw new Error("Invalid Google login state");
  return payload;
}

export async function googleLoginStart(req, res) {
  if (!env.google.clientId || !env.google.clientSecret) {
    return res.status(400).json({ error: "Google login is not configured" });
  }

  return res.json({ url: buildGoogleLoginUrl(encodeGoogleLoginState(), env.demoGoogleAccountEmail) });
}

export async function googleLoginCallback(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${env.google.loginErrorUrl}&reason=${encodeURIComponent(error)}`);
  }

  try {
    decodeGoogleLoginState(state);
    const tokens = await exchangeLoginCodeForTokens(code);
    const profile = await fetchLoginProfile(tokens.access_token);

    if (!profile.email) throw new Error("Google account email is missing");

    const expectedEmail = env.demoGoogleAccountEmail.toLowerCase();
    const actualEmail = String(profile.email).toLowerCase();

    if (expectedEmail && actualEmail !== expectedEmail) {
      return res.redirect(`${env.google.loginErrorUrl}&reason=${encodeURIComponent(`Use demo Google account: ${env.demoGoogleAccountEmail}`)}`);
    }

    const [user] = await User.findOrCreate({
      where: { email: profile.email },
      defaults: {
        fullName: profile.name || profile.email,
        email: profile.email,
        passwordHash: await bcrypt.hash(`google:${profile.id || profile.email}:${env.jwtSecret}`, 10),
        role: "user"
      }
    });

    const token = signAccessToken(user);
    const redirectUrl = new URL(env.google.loginSuccessUrl);
    redirectUrl.searchParams.set("token", token);
    return res.redirect(redirectUrl.toString());
  } catch (err) {
    return res.redirect(`${env.google.loginErrorUrl}&reason=${encodeURIComponent(err.message)}`);
  }
}

export async function register(req, res) {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "fullName, email, password are required" });
  }

  const exists = await User.findOne({ where: { email } });
  if (exists) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, passwordHash });
  const token = signAccessToken(user);

  return res.status(201).json({ token, user: sanitizeUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signAccessToken(user);
  return res.json({ token, user: sanitizeUser(user) });
}

export async function me(req, res) {
  return res.json({ user: sanitizeUser(req.user) });
}
