import { FormIntegration } from "../models/formIntegration.js";
import { syncFormIntegration } from "./googleFormsSyncService.js";

let schedulerStarted = false;
let tickRunning = false;

const DEFAULT_POLL_INTERVAL_MS = 30_000;
const MIN_POLL_INTERVAL_MS = 30_000;

async function runPollingTick() {
  if (tickRunning) return;
  tickRunning = true;

  try {
    const integrations = await FormIntegration.findAll({
      where: {
        syncEnabled: true,
        setupMode: "forms_api_polling"
      },
      order: [["updatedAt", "ASC"]],
      limit: 50
    });

    for (const integration of integrations) {
      if (integration.syncStatus === "syncing") continue;
      try {
        await syncFormIntegration(integration.id);
      } catch (err) {
        console.warn(`[Google Forms Polling] Sync failed for ${integration.formId}:`, err.message);
      }
    }
  } finally {
    tickRunning = false;
  }
}

export function startGoogleFormsPollingScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  const intervalMs = Number(process.env.GOOGLE_FORMS_POLL_INTERVAL_MS || DEFAULT_POLL_INTERVAL_MS);
  setInterval(() => {
    runPollingTick().catch((err) => {
      console.error("[Google Forms Polling] scheduler error:", err.message);
    });
  }, Number.isFinite(intervalMs) && intervalMs >= MIN_POLL_INTERVAL_MS ? intervalMs : DEFAULT_POLL_INTERVAL_MS);
}
