import { Router, type IRouter } from "express";
import { validateToken } from "./auth";

const router: IRouter = Router();

router.get("/config", (req, res): void => {
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

  res.json({
    notion_database_id: process.env.NOTION_DATABASE_ID ?? null,
  });
});

export default router;
