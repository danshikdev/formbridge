import { Op } from "sequelize";
import { env } from "../config/env.js";
import { FormIntegration } from "../models/formIntegration.js";
import { NotificationSettings } from "../models/notificationSettings.js";
import { Request } from "../models/request.js";
import { sendMessage } from "./whatsappService.js";
import { getScenario } from "../config/formScenarios.js";

let schedulerStarted = false;

const STATUS_LABELS_KK = {
  new: "Жаңа",
  in_progress: "Өңделуде",
  done: "Аяқталды",
  test: "Тест",
  contacted: "Байланысылды",
  documents_needed: "Құжат керек",
  accepted: "Қабылданды",
  rejected: "Қабылданбады",
  shortlisted: "Іріктелді",
  interview: "Сұхбат",
  hired: "Жұмысқа алынды",
  urgent: "Шұғыл",
  waiting_client: "Клиент күтілуде",
  confirmed: "Расталды",
  waiting_payment: "Төлем күтілуде",
  cancelled: "Бас тартылды",
  attended: "Қатысты"
};

function getStatusLabelKK(status) {
  return STATUS_LABELS_KK[status] || (String(status).charAt(0).toUpperCase() + String(status).slice(1).replace(/_/g, " "));
}

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
  const scenarioId = integration?.scenario || "universal";
  const scenario = getScenario(scenarioId);
  const statusFlow = scenario?.statusFlow || ["new", "in_progress", "done"];

  const where = {
    formId: setting.formId,
    createdAt: { [Op.between]: [today.start, today.end] }
  };

  const requests = await Request.findAll({
    where,
    attributes: ["status"]
  });

  const total = requests.length;

  const statusCounts = {};
  for (const r of requests) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  const lines = [
    `FormBridge: бүгін «${title}» формасына ${total} өтініш түсті.`
  ];

  // Order statuses by scenario flow first, then append any remaining active statuses
  const displayStatuses = [...statusFlow];
  for (const status of Object.keys(statusCounts)) {
    if (!displayStatuses.includes(status)) {
      displayStatuses.push(status);
    }
  }

  for (const status of displayStatuses) {
    const count = statusCounts[status] || 0;
    if (count > 0) {
      lines.push(`${getStatusLabelKK(status)}: ${count}`);
    }
  }

  lines.push("");
  lines.push(`Ашу: ${formRequestsUrl(setting.formId, title)}`);

  return lines.join("\n");
}

async function runDailySummaryTick() {
  const now = almatyParts();
  const today = todayRangeInAlmaty();

  const settings = await NotificationSettings.findAll({
    where: {
      channel: "whatsapp",
      enabled: true,
      mode: "daily_summary",
      dailyTime: { [Op.lte]: now.time },
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
