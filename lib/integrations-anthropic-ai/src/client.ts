import Anthropic from "@anthropic-ai/sdk";

const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

if (!baseURL) {
  throw new Error(
    "AI_INTEGRATIONS_ANTHROPIC_BASE_URL must be set. Did you forget to provision the Anthropic AI integration?",
  );
}

if (!apiKey) {
  throw new Error(
    "AI_INTEGRATIONS_ANTHROPIC_API_KEY must be set. Did you forget to provision the Anthropic AI integration?",
  );
}

const normalizedBaseURL = baseURL.replace(/\/+$/, "");
const apiBaseURL = normalizedBaseURL.includes("/v1")
  ? normalizedBaseURL
  : `${normalizedBaseURL}/v1`;

export const anthropic = new Anthropic({
  apiKey,
  baseURL: apiBaseURL,
});
