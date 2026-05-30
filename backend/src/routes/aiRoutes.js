import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { analyzeRequest } from "../services/openaiService.js";

export const aiRoutes = Router();

aiRoutes.post("/analyze-request", requireAuth, async (req, res) => {
  const { formTitle, request, lang } = req.body;

  if (!request || !Array.isArray(request.answers)) {
    return res.status(400).json({ error: "request.answers array is required" });
  }

  try {
    const result = await analyzeRequest(formTitle, request, lang || "ru");
    return res.json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    if (status === 503) {
      return res.status(503).json({ error: "AI analysis unavailable: OPENAI_API_KEY is not configured on the server." });
    }
    if (status === 502) {
      return res.status(502).json({ error: "OpenAI API returned an error. Try again later." });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});
