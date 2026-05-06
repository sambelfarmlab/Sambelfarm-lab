import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { ClaudeProxyBody } from "@workspace/api-zod";
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

router.post("/claude", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const parsed = ClaudeProxyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { system, prompt, model = "claude-sonnet-4-6" } = parsed.data;

  const allowedModels = [
    "claude-opus-4-7",
    "claude-opus-4-6",
    "claude-sonnet-4-6",
    "claude-haiku-4-5",
  ];
  const selectedModel = allowedModels.includes(model) ? model : "claude-sonnet-4-6";

  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: prompt },
  ];

  const response = await anthropic.messages.create({
    model: selectedModel,
    max_tokens: 8192,
    ...(system ? { system } : {}),
    messages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const result = textBlock && textBlock.type === "text" ? textBlock.text : "";

  res.json({ result });
});

export default router;
