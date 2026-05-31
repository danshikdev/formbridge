import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/authRoutes.js";
import { googleFormsRoutes } from "./routes/googleFormsRoutes.js";
import { googleOAuthRoutes } from "./routes/googleOAuthRoutes.js";
import { integrationsRoutes } from "./routes/integrationsRoutes.js";
import { whatsappRoutes } from "./routes/whatsappRoutes.js";
import { aiRoutes } from "./routes/aiRoutes.js";
import { adminRoutes } from "./routes/adminRoutes.js";

export const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  }
}));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/forms", googleFormsRoutes);
app.use("/api/google", googleOAuthRoutes);
app.use("/api/integrations", integrationsRoutes);
app.use("/api/notifications/whatsapp", whatsappRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
