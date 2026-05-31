import OpenAI from "openai";
import { getScenario } from "../config/formScenarios.js";

const LANG_LABELS = { kk: "казахском", ru: "русском", en: "английском" };

function buildSystemPrompt(formTitle, scenario, requests, lang) {
  const langLabel = LANG_LABELS[lang] || "русском";
  const scenarioMeta = getScenario(scenario);
  const rolePrompt = scenarioMeta.aiRolePrompt;

  const requestsContext = requests.slice(0, 50).map((r, i) => {
    const answers = (r.answers || [])
      .map((a) => `    ${String(a.question || "").trim()}: ${String(a.answer || "").trim()}`)
      .join("\n");
    return [
      `[${i + 1}] ID: ${r.id} | Status: ${r.status} | Submitted: ${r.submittedAt || r.createdAt || "—"} | Email: ${r.respondentEmail || "—"}`,
      answers ? `  Answers:\n${answers}` : "  Answers: —"
    ].join("\n");
  }).join("\n\n");

  return `${rolePrompt}

Form: ${formTitle || "—"}
Scenario: ${scenario}
Total responses in context: ${requests.length}
Respond in ${langLabel} language.

Form responses data:
${requestsContext || "No responses available yet."}

Instructions:
- Answer based only on the provided form data above.
- If there is not enough data, say so honestly.
- Be concise but helpful.
- Do not make up facts or data.
- Format your response clearly (use line breaks, lists if helpful).`;
}

export async function formChat(formTitle, scenario, requests, message, history = [], lang) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("OPENAI_API_KEY not configured");
    err.statusCode = 503;
    throw err;
  }

  const model = process.env.OPENAI_MODEL || "gpt-5-nano";
  const client = new OpenAI({ apiKey });

  // Limit conversation history to the last 10 messages (5 full turns) to maintain efficiency and stay within token context limits
  const historyLimit = 10;
  const slicedHistory = history.slice(-historyLimit).map((msg) => ({
    role: msg.role === "assistant" || msg.role === "system" ? msg.role : "user",
    content: String(msg.content || "").trim()
  }));

  const systemPrompt = buildSystemPrompt(formTitle, scenario, requests, lang);

  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...slicedHistory,
    { role: "user", content: message }
  ];

  let content;
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: apiMessages
    });
    content = (completion.choices?.[0]?.message?.content || "").trim();
  } catch (err) {
    console.error("[formChat] OpenAI error:", err.message);
    const apiErr = new Error("OpenAI API error");
    apiErr.statusCode = 502;
    apiErr.detail = err.message;
    throw apiErr;
  }

  if (!content) {
    console.error("[formChat] OpenAI returned empty chat completion");
    const emptyErr = new Error("OpenAI returned an empty response");
    emptyErr.statusCode = 502;
    throw emptyErr;
  }

  return content;
}
