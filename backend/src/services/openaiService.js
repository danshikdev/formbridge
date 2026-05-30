import OpenAI from "openai";

const LANG_LABELS = { kk: "казахском", ru: "русском", en: "английском" };

function buildPrompt(formTitle, request, lang) {
  const langLabel = LANG_LABELS[lang] || "русском";
  const answers = (request.answers || [])
    .map((a) => `- ${String(a.question || "?").trim()}: ${String(a.answer || "-").trim()}`)
    .join("\n");

  return `Ты CRM-ассистент. Проанализируй заявку и ответь строго в JSON-формате на ${langLabel} языке.

Форма: ${formTitle || "—"}
Дата подачи: ${request.submittedAt || "—"}
Email: ${request.respondentEmail || "—"}
Ответы:
${answers || "—"}

Ответь ТОЛЬКО валидным JSON без markdown и комментариев:
{
  "summary": "...",
  "category": "admissions | support | payment | general",
  "priority": "low | medium | high",
  "recommendedAction": "..."
}

Правила:
- summary: 1-2 предложения
- category: одно из: admissions, support, payment, general
- priority: одно из: low, medium, high
- recommendedAction: краткое практичное действие (1 предложение)
- Не придумывай факты. Если данных мало — напиши об этом в summary.`;
}

export async function analyzeRequest(formTitle, request, lang) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("OPENAI_API_KEY not configured");
    err.statusCode = 503;
    throw err;
  }

  const model = process.env.OPENAI_MODEL || "gpt-5-nano";
  const client = new OpenAI({ apiKey });

  let raw;
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: buildPrompt(formTitle, request, lang) }],
      temperature: 0.2,
      max_tokens: 300,
    });
    raw = completion.choices[0]?.message?.content || "";
  } catch (err) {
    const apiErr = new Error("OpenAI API error");
    apiErr.statusCode = 502;
    apiErr.detail = err.message;
    throw apiErr;
  }

  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: String(parsed.summary || ""),
      category: String(parsed.category || "general"),
      priority: String(parsed.priority || "medium"),
      recommendedAction: String(parsed.recommendedAction || ""),
    };
  } catch {
    const parseErr = new Error("Failed to parse AI response as JSON");
    parseErr.statusCode = 502;
    throw parseErr;
  }
}
