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
import { sendMessage } from "./services/whatsappService.js";

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

app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "name, email and message are required" });
  }
  const text = `📬 FormBridge — новое сообщение\n\nИмя: ${name}\nEmail: ${email}\n\nСообщение:\n${message}`;
  try {
    await sendMessage("87085381689", text);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[contact]", err.message);
    return res.status(503).json({ error: "WhatsApp недоступен. Попробуйте позже." });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/forms", googleFormsRoutes);
app.use("/api/google", googleOAuthRoutes);
app.use("/api/integrations", integrationsRoutes);
app.use("/api/notifications/whatsapp", whatsappRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
