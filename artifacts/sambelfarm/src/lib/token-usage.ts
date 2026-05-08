const USAGE_KEY = "sf_token_usage";

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  requests: number;
}

export function loadUsage(): TokenUsage {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (raw) return JSON.parse(raw) as TokenUsage;
  } catch {}
  return { input_tokens: 0, output_tokens: 0, requests: 0 };
}

export function addTokenUsage(input: number, output: number): void {
  const current = loadUsage();
  const updated: TokenUsage = {
    input_tokens: current.input_tokens + input,
    output_tokens: current.output_tokens + output,
    requests: current.requests + 1,
  };
  localStorage.setItem(USAGE_KEY, JSON.stringify(updated));
}

export function resetUsage(): void {
  localStorage.removeItem(USAGE_KEY);
}

export function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
