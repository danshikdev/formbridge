import { Router } from "express";
import {
  googleFormsList,
  googleOAuthCallback,
  googleOAuthStart,
  googleOAuthStatus
} from "../controllers/googleOAuthController.js";
import { requireAuth } from "../middleware/auth.js";

export const googleOAuthRoutes = Router();

googleOAuthRoutes.get("/oauth/callback", googleOAuthCallback);
googleOAuthRoutes.get("/oauth/status", requireAuth, googleOAuthStatus);
googleOAuthRoutes.post("/oauth/start", requireAuth, googleOAuthStart);
googleOAuthRoutes.get("/forms", requireAuth, googleFormsList);
