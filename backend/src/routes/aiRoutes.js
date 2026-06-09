import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { formChat } from "../services/openaiService.js";
import { FormIntegration } from "../models/formIntegration.js";
import { Request } from "../models/request.js";
import { FormChatHistory } from "../models/formChatHistory.js";

export const aiRoutes = Router();

// GET /api/ai/chat-history/:formId — load saved chat (last 100 messages)
aiRoutes.get("/chat-history/:formId", requireAuth, async (req, res) => {
  const { formId } = req.params;
  const userId = req.user?.id;

  const integration = await FormIntegration.findOne({ where: { formId, userId } });
  if (!integration) return res.status(404).json({ error: "Form not found or access denied" });

  const rows = await FormChatHistory.findAll({
    where: { formId, userId },
    order: [["createdAt", "ASC"]],
    limit: 100,
    attributes: ["id", "role", "text", "createdAt"]
  });

  return res.json({ messages: rows.map((r) => ({ role: r.role, text: r.text })) });
});

// POST /api/ai/chat-history — save messages (array of {role, text})
aiRoutes.post("/chat-history", requireAuth, async (req, res) => {
  const { formId, messages } = req.body;
  const userId = req.user?.id;

  if (!formId || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "formId and messages[] are required" });
  }

  const integration = await FormIntegration.findOne({ where: { formId, userId } });
  if (!integration) return res.status(404).json({ error: "Form not found or access denied" });

  const rows = messages
    .filter((m) => m.role && m.text)
    .map((m) => ({ userId, formId, role: m.role, text: String(m.text) }));

  await FormChatHistory.bulkCreate(rows);
  return res.json({ ok: true });
});

// DELETE /api/ai/chat-history/:formId — clear chat history
aiRoutes.delete("/chat-history/:formId", requireAuth, async (req, res) => {
  const { formId } = req.params;
  const userId = req.user?.id;

  const integration = await FormIntegration.findOne({ where: { formId, userId } });
  if (!integration) return res.status(404).json({ error: "Form not found or access denied" });

  await FormChatHistory.destroy({ where: { formId, userId } });
  return res.json({ ok: true });
});

aiRoutes.post("/form-chat", requireAuth, async (req, res) => {
  const { formId, formTitle, scenario, message, history, lang } = req.body;
  const userId = req.user?.id;

  if (!formId || !message || !String(message).trim()) {
    return res.status(400).json({ error: "formId and message are required" });
  }

  const integration = await FormIntegration.findOne({ where: { formId, userId } });
  if (!integration) {
    return res.status(404).json({ error: "Form not found or access denied" });
  }

  const requests = await Request.findAll({
    where: { formId },
    order: [["createdAt", "DESC"]],
    limit: 50,
    attributes: ["id", "status", "submittedAt", "createdAt", "respondentEmail", "answers"]
  });

  try {
    const nextHistory = Array.isArray(history) ? history : [];
    const reply = await formChat(
      formTitle || integration.formTitle || "",
      scenario || integration.scenario || "universal",
      requests.map((r) => r.toJSON()),
      String(message).trim(),
      nextHistory,
      lang || "ru"
    );
    return res.json({ reply });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 503) {
      return res.status(503).json({ error: "AI unavailable: OPENAI_API_KEY is not configured." });
    }
    if (status === 502) {
      return res.status(502).json({ error: "OpenAI API returned an error. Try again later." });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});
