import dotenv from "dotenv";

dotenv.config();

function list(value, fallback) {
  return String(value || fallback || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const corsOrigins = list(process.env.CORS_ORIGIN, "http://localhost:5173");
const primaryCorsOrigin = corsOrigins[0] || "http://localhost:5173";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  corsOrigin: primaryCorsOrigin,
  corsOrigins,
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`,
  db: {
    url: process.env.DATABASE_URL || "",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME || "formbridge",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: process.env.DB_SSL === "true" || process.env.NODE_ENV === "production",
    syncAlter: process.env.DB_SYNC_ALTER === "true"
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${process.env.PORT || 4000}/api/google/oauth/callback`,
    loginRedirectUri: process.env.GOOGLE_LOGIN_REDIRECT_URI || `http://localhost:${process.env.PORT || 4000}/api/auth/google/callback`,
    oauthSuccessUrl: process.env.GOOGLE_OAUTH_SUCCESS_URL || `${primaryCorsOrigin}/forms`,
    oauthErrorUrl: process.env.GOOGLE_OAUTH_ERROR_URL || `${primaryCorsOrigin}/forms?google=error`,
    loginSuccessUrl: process.env.GOOGLE_LOGIN_SUCCESS_URL || `${primaryCorsOrigin}/login`,
    loginErrorUrl: process.env.GOOGLE_LOGIN_ERROR_URL || `${primaryCorsOrigin}/login?google=error`
  },
  webhookSecret: process.env.FORMBRIDGE_WEBHOOK_SECRET || "",
  demoGoogleAccountEmail: process.env.DEMO_GOOGLE_ACCOUNT_EMAIL || ""
};
