import OpenAI from "openai";
import { getScenario } from "../config/formScenarios.js";

const LANG_LABELS = { kk: "казахском", ru: "русском", en: "английском" };

function buildFormChatPrompt(formTitle, scenario, requests, userMessage, lang) {
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

User question: ${userMessage}

Instructions:
- Answer based only on the provided form data above.
- If there is not enough data, say so honestly.
- Be concise but helpful.
- Do not make up facts or data.
- Format your response clearly (use line breaks, lists if helpful).`;
}

function extractResponseText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const chunks = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("").trim();
}

export async function formChat(formTitle, scenario, requests, message, lang) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("OPENAI_API_KEY not configured");
    err.statusCode = 503;
    throw err;
  }

  const model = process.env.OPENAI_MODEL || "gpt-5-nano-2025-08-07";
  const client = new OpenAI({ apiKey });

  let content;
  try {
    const response = await client.responses.create({
      model,
      input: buildFormChatPrompt(formTitle, scenario, requests, message, lang),
      reasoning: { effort: "minimal" },
      max_output_tokens: 1200
    });
    content = extractResponseText(response);
    if (!content) {
      console.error("[formChat] Empty OpenAI response:", {
        status: response.status,
        incompleteReason: response.incomplete_details?.reason || null,
        outputTypes: (response.output || []).map((item) => item.type).join(",") || "none"
      });
    }
  } catch (err) {
    console.error("[formChat] OpenAI error:", err.message);
    const apiErr = new Error("OpenAI API error");
    apiErr.statusCode = 502;
    apiErr.detail = err.message;
    throw apiErr;
  }

  if (!content) {
    const emptyErr = new Error("OpenAI returned an empty response");
    emptyErr.statusCode = 502;
    throw emptyErr;
  }

  return content;
}
