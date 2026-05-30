import { Router } from "express";
import { googleLoginCallback, googleLoginStart, login, me, register } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/google/start", googleLoginStart);
authRoutes.get("/google/callback", googleLoginCallback);
authRoutes.get("/me", requireAuth, me);
