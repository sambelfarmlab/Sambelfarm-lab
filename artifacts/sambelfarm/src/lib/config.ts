export interface Config {
  dnaStyle: string;
  customPrompt: string;
  aiModel: string;
}

const DEFAULT_CONFIG: Config = {
  dnaStyle: "Gaya penulisan natural, informatif, dan dekat dengan pembaca.",
  customPrompt: "",
  aiModel: "claude-sonnet-4-6",
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
