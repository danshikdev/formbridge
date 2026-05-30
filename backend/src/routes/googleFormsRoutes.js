import { Router } from "express";
import {
  debugLastRequests,
  getRequest,
  googleFormsWebhook,
  listRequests,
  updateRequestStatus
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

googleFormsRoutes.get("/:formId/notification-settings", requireAuth, getNotificationSettings);
googleFormsRoutes.put("/:formId/notification-settings", requireAuth, upsertNotificationSettings);
