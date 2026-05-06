import { createContext, useContext, useState, type ReactNode } from "react";

export interface Draft {
  topik: string;
  judul: string;
  konsep: string;
  platform: string;
  jenisKonten: string;
  tone: string;
  inputTambahan: string;
  tanggal: string;
  script: string;
  skorViralitas: number | null;
  tribeTrigger: number;
  tribeResonance: number;
  tribeImpact: number;
  tribeBehavior: number;
  tribeEngagement: number;
  analisisAI: string;
  rekomendasi: string;
  captionTikTok: string;
  captionInstagram: string;
  captionYTShorts: string;
}

export interface SavedScript extends Draft {
  notionPageId: string;
  savedAt: string;
}

export const EMPTY_DRAFT: Draft = {
  topik: "",
  judul: "",
  konsep: "",
  platform: "TikTok",
  jenisKonten: "Reels",
  tone: "Storytelling",
  inputTambahan: "",
  tanggal: new Date().toISOString().slice(0, 10),
  script: "",
  skorViralitas: null,
  tribeTrigger: 0,
  tribeResonance: 0,
  tribeImpact: 0,
  tribeBehavior: 0,
  tribeEngagement: 0,
  analisisAI: "",
  rekomendasi: "",
  captionTikTok: "",
  captionInstagram: "",
  captionYTShorts: "",
};

interface DraftContextValue {
  draft: Draft;
  setDraft: (d: Partial<Draft>) => void;
  resetDraft: () => void;
  savedScripts: SavedScript[];
  addSaved: (s: SavedScript) => void;
  removeSaved: (id: string) => void;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<Draft>(EMPTY_DRAFT);
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);

  const setDraft = (partial: Partial<Draft>) =>
    setDraftState((prev) => ({ ...prev, ...partial }));

  const resetDraft = () => setDraftState({ ...EMPTY_DRAFT, tanggal: new Date().toISOString().slice(0, 10) });

  const addSaved = (s: SavedScript) =>
    setSavedScripts((prev) => [s, ...prev]);

  const removeSaved = (id: string) =>
    setSavedScripts((prev) => prev.filter((s) => s.notionPageId !== id));

  return (
    <DraftContext.Provider value={{ draft, setDraft, resetDraft, savedScripts, addSaved, removeSaved }}>
      {children}
    </DraftContext.Provider>
  );
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used within DraftProvider");
  return ctx;
}
