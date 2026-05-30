import { Router } from "express";
import {
  whatsappConnect,
  whatsappDisconnect,
  whatsappStatus,
  whatsappTestSend
} from "../controllers/whatsappController.js";
import { requireAuth } from "../middleware/auth.js";

export const whatsappRoutes = Router();

whatsappRoutes.get("/status", requireAuth, whatsappStatus);
whatsappRoutes.post("/connect", requireAuth, whatsappConnect);
whatsappRoutes.post("/disconnect", requireAuth, whatsappDisconnect);
whatsappRoutes.post("/test-send", requireAuth, whatsappTestSend);
