import { Router, type IRouter } from "express";
import {
  NotionQueryBody,
  NotionCreatePageBody,
  NotionUpdatePageBody,
  NotionUpdatePageParams,
} from "@workspace/api-zod";
import { validateToken } from "./auth";

const router: IRouter = Router();

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

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

function getNotionHeaders() {
  const notionKey = process.env.NOTION_API_KEY;
  if (!notionKey) throw new Error("NOTION_API_KEY not set");
  return {
    Authorization: `Bearer ${notionKey}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  };
}

/** Always reads from the NOTION_DB_ID secret; falls back to client-supplied id. */
function resolveDbId(clientSupplied: string): string | null {
  return process.env.NOTION_DB_ID || clientSupplied || null;
}

router.post("/notion/query", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const parsed = NotionQueryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const dbId = resolveDbId(parsed.data.database_id);
  if (!dbId) {
    res.status(500).json({ error: "NOTION_DB_ID tidak dikonfigurasi di server" });
    return;
  }

  const { filter, sorts, page_size } = parsed.data;
  const body: Record<string, unknown> = {};
  if (filter) body.filter = filter;
  if (sorts) body.sorts = sorts;
  if (page_size) body.page_size = page_size;

  let headers: ReturnType<typeof getNotionHeaders>;
  try {
    headers = getNotionHeaders();
  } catch (err) {
    req.log.error({ err }, "Notion API key not configured");
    res.status(500).json({ error: "Notion API key not configured" });
    return;
  }

  const response = await fetch(`${NOTION_API_BASE}/databases/${dbId}/query`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    req.log.warn({ status: response.status, data }, "Notion query failed");
    res.status(response.status).json({ error: (data as { message?: string }).message ?? "Notion error" });
    return;
  }

  res.json(data);
});

router.post("/notion/pages", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const parsed = NotionCreatePageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const dbId = resolveDbId(parsed.data.database_id);
  if (!dbId) {
    res.status(500).json({ error: "NOTION_DB_ID tidak dikonfigurasi di server" });
    return;
  }

  const { properties, children } = parsed.data;

  let headers: ReturnType<typeof getNotionHeaders>;
  try {
    headers = getNotionHeaders();
  } catch (err) {
    req.log.error({ err }, "Notion API key not configured");
    res.status(500).json({ error: "Notion API key not configured" });
    return;
  }

  const body: Record<string, unknown> = {
    parent: { database_id: dbId },
    properties,
  };
  if (children) body.children = children;

  const response = await fetch(`${NOTION_API_BASE}/pages`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    req.log.warn({ status: response.status, data }, "Notion create page failed");
    res.status(response.status).json({ error: (data as { message?: string }).message ?? "Notion error" });
    return;
  }

  res.json(data);
});

router.patch("/notion/pages/:pageId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const rawId = Array.isArray(req.params.pageId) ? req.params.pageId[0] : req.params.pageId;
  const params = NotionUpdatePageParams.safeParse({ pageId: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid page ID" });
    return;
  }

  const parsed = NotionUpdatePageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { properties, children } = parsed.data;

  let headers: ReturnType<typeof getNotionHeaders>;
  try {
    headers = getNotionHeaders();
  } catch (err) {
    req.log.error({ err }, "Notion API key not configured");
    res.status(500).json({ error: "Notion API key not configured" });
    return;
  }

  const body: Record<string, unknown> = { properties };
  if (children) body.children = children;

  const response = await fetch(`${NOTION_API_BASE}/pages/${params.data.pageId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    req.log.warn({ status: response.status, data }, "Notion update page failed");
    res.status(response.status).json({ error: (data as { message?: string }).message ?? "Notion error" });
    return;
  }

  res.json(data);
});

router.delete("/notion/pages/:pageId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const pageId = Array.isArray(req.params.pageId) ? req.params.pageId[0] : req.params.pageId;
  if (!pageId) {
    res.status(400).json({ error: "Invalid page ID" });
    return;
  }

  let headers: ReturnType<typeof getNotionHeaders>;
  try {
    headers = getNotionHeaders();
  } catch (err) {
    req.log.error({ err }, "Notion API key not configured");
    res.status(500).json({ error: "Notion API key not configured" });
    return;
  }

  const response = await fetch(`${NOTION_API_BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ archived: true }),
  });

  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    req.log.warn({ status: response.status, data }, "Notion archive page failed");
    res.status(response.status).json({ error: (data as { message?: string }).message ?? "Notion error" });
    return;
  }

  res.json(data);
});

export default router;
