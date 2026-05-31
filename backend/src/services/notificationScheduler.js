import { Op } from "sequelize";
import { env } from "../config/env.js";
import { FormIntegration } from "../models/formIntegration.js";
import { NotificationSettings } from "../models/notificationSettings.js";
import { Request } from "../models/request.js";
import { sendMessage } from "./whatsappService.js";

let schedulerStarted = false;

function almatyParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    time: `${map.hour}:${map.minute}`
  };
}

function todayRangeInAlmaty(now = new Date()) {
  const { date } = almatyParts(now);
  const start = new Date(`${date}T00:00:00+05:00`);
  const end = new Date(`${date}T23:59:59.999+05:00`);
  return { date, start, end };
}

function formRequestsUrl(formId, formTitle) {
  const baseUrl = env.publicBaseUrl.replace(/\/$/, "");
  const params = formTitle ? `?formTitle=${encodeURIComponent(formTitle)}` : "";
  return `${baseUrl}/forms/${encodeURIComponent(formId)}/requests${params}`;
}

async function buildDailySummaryMessage(setting, today) {
  const integration = await FormIntegration.findOne({ where: { formId: setting.formId } });
  const title = integration?.formTitle || setting.formId;
  const where = {
    formId: setting.formId,
    createdAt: { [Op.between]: [today.start, today.end] }
  };

  const [total, fresh, inProgress, done] = await Promise.all([
    Request.count({ where }),
    Request.count({ where: { ...where, status: "new" } }),
    Request.count({ where: { ...where, status: "in_progress" } }),
    Request.count({ where: { ...where, status: "done" } })
  ]);

  return [
    `FormBridge: бүгін «${title}» формасына ${total} өтініш түсті.`,
    `Жаңа: ${fresh}`,
    `Өңделуде: ${inProgress}`,
    `Аяқталды: ${done}`,
    "",
    `Ашу: ${formRequestsUrl(setting.formId, title)}`
  ].join("\n");
}

async function runDailySummaryTick() {
  const now = almatyParts();
  const today = todayRangeInAlmaty();

  const settings = await NotificationSettings.findAll({
    where: {
      channel: "whatsapp",
      enabled: true,
      mode: "daily_summary",
      dailyTime: now.time,
      phoneNumber: { [Op.ne]: null },
      [Op.or]: [
        { lastDailySummaryDate: null },
        { lastDailySummaryDate: { [Op.ne]: today.date } }
      ]
    }
  });

  for (const setting of settings) {
    try {
      const message = await buildDailySummaryMessage(setting, today);
      await sendMessage(setting.phoneNumber, message);
      setting.lastDailySummaryDate = today.date;
      await setting.save();
      console.log(`[WhatsApp] Daily summary sent to ${setting.phoneNumber}`);
    } catch (err) {
      console.warn(`[WhatsApp] Daily summary failed for ${setting.formId}:`, err.message);
    }
  }
}

export function startNotificationScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  setInterval(() => {
    runDailySummaryTick().catch((err) => {
      console.error("[Notifications] daily summary scheduler error:", err.message);
    });
  }, 60 * 1000);
}
