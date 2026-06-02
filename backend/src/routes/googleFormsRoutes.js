import { Router } from "express";
import {
  debugLastRequests,
  getRequest,
  googleFormsWebhook,
  listRequests,
  updateRequestStatus,
  getWorkspace,
  updateScenario,
  createFeedback,
  getFeedback
} from "../controllers/googleFormsController.js";
import {
  getNotificationSettings,
  upsertNotificationSettings
} from "../controllers/notificationSettingsController.js";
import { requireAuth } from "../middleware/auth.js";

export const googleFormsRoutes = Router();

googleFormsRoutes.post("/webhook/google", googleFormsWebhook);
googleFormsRoutes.get("/requests", requireAuth, listRequests);
googleFormsRoutes.get("/requests/:id", requireAuth, getRequest);
googleFormsRoutes.patch("/requests/:id/status", requireAuth, updateRequestStatus);
googleFormsRoutes.get("/debug-last", debugLastRequests);

googleFormsRoutes.get("/:formId/workspace", requireAuth, getWorkspace);
googleFormsRoutes.patch("/:formId/scenario", requireAuth, updateScenario);
googleFormsRoutes.get("/:formId/feedback", requireAuth, getFeedback);
googleFormsRoutes.post("/:formId/feedback", requireAuth, createFeedback);

googleFormsRoutes.get("/:formId/notification-settings", requireAuth, getNotificationSettings);
googleFormsRoutes.put("/:formId/notification-settings", requireAuth, upsertNotificationSettings);
