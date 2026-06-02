import { Op } from "sequelize";
import { env } from "../config/env.js";
import { NotificationSettings } from "../models/notificationSettings.js";
import { Request } from "../models/request.js";
import { sendMessage } from "./whatsappService.js";

function formRequestsUrl(formId, formTitle) {
  const baseUrl = env.publicBaseUrl.replace(/\/$/, "");
  if (!formId) return `${baseUrl}/forms`;

  const params = formTitle ? `?formTitle=${encodeURIComponent(formTitle)}` : "";
  return `${baseUrl}/forms/${encodeURIComponent(formId)}/requests${params}`;
}

async function sendEverySubmission(setting, record) {
  const title = record.formTitle || record.formId || setting.formId;
  const email = record.respondentEmail ? `\nОт: ${record.respondentEmail}` : "";
  const text = [
    "FormBridge: новая заявка",
    `Форма: «${title}»${email}`,
    "",
    `Открыть заявки: ${formRequestsUrl(setting.formId, title)}`
  ].join("\n");

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

  const title = newestRecord?.formTitle || newestRecord?.formId || setting.formId;
  const text = [
    `FormBridge: «${title}» формасында ${pendingCount} жаңа өтініш жиналды.`,
    `Шек: ${threshold}`,
    "",
    `Ашу: ${formRequestsUrl(setting.formId, title)}`
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
