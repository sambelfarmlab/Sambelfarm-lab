export interface Config {
  dbId: string;
  dnaStyle: string;
  customPrompt: string;
  aiModel: string;
}

const DEFAULT_CONFIG: Config = {
  dbId: "",
  dnaStyle: "Gaya penulisan natural, informatif, dan dekat dengan pembaca.",
  customPrompt: "",
  aiModel: "claude-sonnet-4-6"
};

export function getConfig(): Config {
  try {
    const stored = localStorage.getItem("sf_config");
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to parse config", e);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: Partial<Config>) {
  const current = getConfig();
  const updated = { ...current, ...config };
  localStorage.setItem("sf_config", JSON.stringify(updated));
  return updated;
}

/**
 * Fetches server-side config (e.g. NOTION_DATABASE_ID secret) from the backend
 * and merges it into localStorage. The server value always wins for dbId so that
 * the Replit Secret is the single source of truth.
 */
export async function fetchRemoteConfig(token: string): Promise<void> {
  try {
    const res = await fetch("/api/config", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as { notion_database_id: string | null };
    if (data.notion_database_id) {
      saveConfig({ dbId: data.notion_database_id });
    }
  } catch {
    // silently ignore — app still works with manually-entered dbId
  }
}
