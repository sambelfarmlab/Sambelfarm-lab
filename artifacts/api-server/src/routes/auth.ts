import { Router, type IRouter } from "express";
import crypto from "crypto";
import { LoginBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function generateToken(): string {
  const secret = process.env.SESSION_SECRET;
  const password = process.env.ADMIN_PASSWORD;

  if (!secret || !password) {
    throw new Error("SESSION_SECRET and ADMIN_PASSWORD must be set");
  }

  return crypto.createHmac("sha256", secret).update(password).digest("hex");
}

export function validateToken(token: string): boolean {
  try {
    const expected = generateToken();
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing password" });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    req.log.error("ADMIN_PASSWORD not set");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  if (parsed.data.password !== adminPassword) {
    req.log.warn("Invalid login attempt");
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  try {
    const token = generateToken();
    res.json({ token });
  } catch (err) {
    req.log.error({ err }, "Failed to generate token");
    res.status(500).json({ error: "Failed to generate token" });
  }
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  if (!validateToken(token)) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  res.json({ ok: true });
});

export default router;
