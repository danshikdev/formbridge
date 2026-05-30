import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, fullName: user.fullName },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}
