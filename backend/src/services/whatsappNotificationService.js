import { Op } from "sequelize";
import { env } from "../config/env.js";
import { FormIntegration } from "../models/formIntegration.js";
import { NotificationSettings } from "../models/notificationSettings.js";
import { Request } from "../models/request.js";
import { sendMessage } from "./whatsappService.js";

function formRequestsUrl(formId, formTitle) {
  const baseUrl = env.publicBaseUrl.replace(/\/$/, "");
  if (!formId) return `${baseUrl}/forms`;

  const params = formTitle ? `?formTitle=${encodeURIComponent(formTitle)}` : "";
  return `${baseUrl}/forms/${encodeURIComponent(formId)}/requests${params}`;
}

function statusLabel(status) {
  const labels = {
    new: "Новая",
    in_progress: "В работе",
    done: "Готово",
    test: "Тест",
    contacted: "Связались",
    documents_needed: "Нужны документы",
    accepted: "Принято",
    rejected: "Отклонено",
    shortlisted: "В shortlist",
    interview: "Интервью",
    hired: "Нанят",
    urgent: "Срочно",
    waiting_client: "Ждём клиента",
    confirmed: "Подтверждено",
    waiting_payment: "Ожидает оплату",
    cancelled: "Отменено",
    attended: "Участвовал"
  };
  return labels[status] || String(status || "Новая").replace(/_/g, " ");
}

function formatSubmittedAt(date) {
  if (!date) return null;
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return value.toLocaleString("ru-RU", { timeZone: "Asia/Almaty" });
}

function answerLabel(answer, index) {
  return answer?.label || answer?.question || answer?.title || `Ответ ${index + 1}`;
}

function answerValue(answer) {
  const value = answer?.value ?? answer?.answer ?? answer?.text ?? "";
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value || "").trim();
}

function buildAnswersPreview(record, limit = 4) {
  const answers = Array.isArray(record?.answers) ? record.answers : [];
  const lines = answers
    .map((answer, index) => {
      const value = answerValue(answer);
      if (!value) return null;
      const label = answerLabel(answer, index);
      const shortValue = value.length > 140 ? `${value.slice(0, 137)}...` : value;
      return `${label}: ${shortValue}`;
    })
    .filter(Boolean)
    .slice(0, limit);

  if (lines.length === 0) return [];
  if (answers.length > limit) lines.push(`Еще ответов: ${answers.length - limit}`);
  return ["Кратко по ответу:", ...lines];
}

async function resolveFormTitle(setting, record) {
  if (record?.formTitle) return record.formTitle;

  const integration = await FormIntegration.findOne({
    where: { formId: setting.formId },
    attributes: ["formTitle", "formId"]
  });

  return integration?.formTitle || record?.formId || setting.formId;
}

async function sendEverySubmission(setting, record) {
  const title = await resolveFormTitle(setting, record);
  const submittedAt = formatSubmittedAt(record.submittedAt || record.createdAt);
  const text = [
    "FormBridge уведомление",
    `Форма: «${title}»`,
    "Событие: новая заявка",
    record.respondentEmail ? `От: ${record.respondentEmail}` : null,
    submittedAt ? `Дата: ${submittedAt}` : null,
    `Статус: ${statusLabel(record.status)}`,
    "",
    ...buildAnswersPreview(record),
    "",
    `Открыть dashboard: ${formRequestsUrl(setting.formId, title)}`
  ].filter((line) => line !== null).join("\n");

  await sendMessage(setting.phoneNumber, text);
}

async function sendThresholdSummary(setting, newestRecord) {
  const threshold = Math.max(Number(setting.thresholdCount || 1), 1);
  const since = setting.lastThresholdNotifiedAt || setting.updatedAt || new Date(0);
  const pendingCount = await Request.count({
    where: {
      formId: setting.formId,
      createdAt: { [Op.gt]: since }
    }
  });

  if (pendingCount < threshold) return;

  const title = await resolveFormTitle(setting, newestRecord);
  const text = [
    "FormBridge уведомление",
    `Форма: «${title}»`,
    `Событие: накопилось ${pendingCount} новых заявок`,
    `Порог: ${threshold}`,
    "",
    `Открыть dashboard: ${formRequestsUrl(setting.formId, title)}`
  ].join("\n");

  await sendMessage(setting.phoneNumber, text);
  setting.lastThresholdNotifiedAt = new Date();
  await setting.save();
}

export async function notifyForNewRequests(formId, records) {
  const items = Array.isArray(records) ? records.filter(Boolean) : [records].filter(Boolean);
  if (!formId || items.length === 0) return;

  try {
    const settings = await NotificationSettings.findAll({
      where: { formId, channel: "whatsapp", enabled: true }
    });

    for (const setting of settings) {
      if (!setting.phoneNumber || setting.mode === "daily_summary") continue;

      try {
        if (setting.mode === "threshold") {
          await sendThresholdSummary(setting, items[items.length - 1]);
          continue;
        }

        for (const record of items) {
          await sendEverySubmission(setting, record);
        }
      } catch (err) {
        console.warn(`[WhatsApp] Failed to notify ${setting.phoneNumber}:`, err.message);
      }
    }
  } catch (err) {
    console.error("[WhatsApp] notifyForNewRequests error:", err.message);
  }
}
