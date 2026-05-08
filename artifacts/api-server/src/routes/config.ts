import { Router, type IRouter } from "express";
import { validateToken } from "./auth";

const router: IRouter = Router();

function requireAuth(req: import("express").Request, res: import("express").Response): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  const token = authHeader.slice(7);
  if (!validateToken(token)) {
    res.status(401).json({ error: "Invalid token" });
    return false;
  }
  return true;
}

router.get("/config", (req, res): void => {
  if (!requireAuth(req, res)) return;
  res.json({
    notion_database_id: process.env.NOTION_DB_ID ?? null,
  });
});

router.get("/status", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const claudeConnected = !!process.env.ANTHROPIC_API_KEY;

  let notionConnected = false;
  let notionWorkspace: string | null = null;
  const notionKey = process.env.NOTION_API_KEY;
  if (notionKey) {
    try {
      const r = await fetch("https://api.notion.com/v1/users/me", {
        headers: {
          Authorization: `Bearer ${notionKey}`,
          "Notion-Version": "2022-06-28",
        },
      });
      if (r.ok) {
        const data = await r.json() as { name?: string; bot?: { workspace_name?: string } };
        notionConnected = true;
        notionWorkspace = data?.bot?.workspace_name ?? null;
      }
    } catch {
      notionConnected = false;
    }
  }

  res.json({
    claude: { connected: claudeConnected },
    notion: { connected: notionConnected, workspace: notionWorkspace },
  });
});

export default router;
