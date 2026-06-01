import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  autoSetupIntegration,
  attachExistingSheet,
  checkAppsScriptApiStatus,
  confirmSetupInstalled,
  createIntegration,
  deleteIntegration,
  getSetupScript,
  integrationEvents,
  integrationHealth,
  listIntegrations,
  prepareIntegrationSheet,
  saveWebhook,
  setupGoogleIntegration,
  testIntegration,
  verifyIntegration
} from "../controllers/integrationsController.js";

export const integrationsRoutes = Router();

integrationsRoutes.post("/forms/:id/setup-confirm", confirmSetupInstalled);

integrationsRoutes.use(requireAuth);
integrationsRoutes.get("/forms", listIntegrations);
integrationsRoutes.post("/forms", createIntegration);
integrationsRoutes.post("/forms/setup-google", setupGoogleIntegration);
integrationsRoutes.get("/health", integrationHealth);
integrationsRoutes.get("/forms/:id/events", integrationEvents);
integrationsRoutes.get("/forms/:id/setup-script", getSetupScript);
integrationsRoutes.post("/apps-script-api/check", checkAppsScriptApiStatus);
integrationsRoutes.post("/forms/:id/auto-setup", autoSetupIntegration);
integrationsRoutes.post("/forms/:id/prepare-sheet", prepareIntegrationSheet);
integrationsRoutes.patch("/forms/:id/sheet", attachExistingSheet);
integrationsRoutes.patch("/forms/:id/webhook", saveWebhook);
integrationsRoutes.delete("/forms/:id", deleteIntegration);
integrationsRoutes.post("/forms/:id/test", testIntegration);
integrationsRoutes.post("/forms/:id/verify", verifyIntegration);
