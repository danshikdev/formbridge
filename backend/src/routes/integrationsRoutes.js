import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  autoSetupIntegration,
  createIntegration,
  deleteIntegration,
  getSetupScript,
  integrationEvents,
  integrationHealth,
  listIntegrations,
  saveWebhook,
  setupGoogleIntegration,
  testIntegration,
  verifyIntegration
} from "../controllers/integrationsController.js";

export const integrationsRoutes = Router();

integrationsRoutes.use(requireAuth);
integrationsRoutes.get("/forms", listIntegrations);
integrationsRoutes.post("/forms", createIntegration);
integrationsRoutes.post("/forms/setup-google", setupGoogleIntegration);
integrationsRoutes.get("/health", integrationHealth);
integrationsRoutes.get("/forms/:id/events", integrationEvents);
integrationsRoutes.get("/forms/:id/setup-script", getSetupScript);
integrationsRoutes.post("/forms/:id/auto-setup", autoSetupIntegration);
integrationsRoutes.patch("/forms/:id/webhook", saveWebhook);
integrationsRoutes.delete("/forms/:id", deleteIntegration);
integrationsRoutes.post("/forms/:id/test", testIntegration);
integrationsRoutes.post("/forms/:id/verify", verifyIntegration);
