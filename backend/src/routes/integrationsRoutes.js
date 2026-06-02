import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createIntegration,
  deleteIntegration,
  enablePolling,
  integrationEvents,
  integrationHealth,
  listIntegrations,
  setupGoogleIntegration,
  syncNow,
  verifyIntegration
} from "../controllers/integrationsController.js";

export const integrationsRoutes = Router();

integrationsRoutes.use(requireAuth);
integrationsRoutes.get("/forms", listIntegrations);
integrationsRoutes.post("/forms", createIntegration);
integrationsRoutes.post("/forms/setup-google", setupGoogleIntegration);
integrationsRoutes.get("/health", integrationHealth);
integrationsRoutes.get("/forms/:id/events", integrationEvents);
integrationsRoutes.post("/forms/:id/enable-polling", enablePolling);
integrationsRoutes.post("/forms/:id/sync-now", syncNow);
integrationsRoutes.delete("/forms/:id", deleteIntegration);
integrationsRoutes.post("/forms/:id/verify", verifyIntegration);
