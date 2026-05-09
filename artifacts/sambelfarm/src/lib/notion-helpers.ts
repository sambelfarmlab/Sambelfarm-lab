import type { Draft } from "@/lib/draft";

export interface NotionPage {
  id: string;
  properties: Record<
    string,
    {
      title?: Array<{ plain_text: string }>;
      rich_text?: Array<{ plain_text: string }>;
      select?: { name: string };
      number?: number;
      date?: { start: string };
    }
  >;
}

export function getTitle(page: NotionPage): string {
  return page.properties?.Topik?.title?.[0]?.plain_text ?? "";
}

export function getRichText(page: NotionPage, prop: string): string {
  return page.properties?.[prop]?.rich_text?.[0]?.plain_text ?? "";
}

export function getSelect(page: NotionPage, prop: string): string {
  return page.properties?.[prop]?.select?.name ?? "";
}

export function getNumber(page: NotionPage, prop: string): number | null {
  const v = page.properties?.[prop]?.number;
  return v !== undefined ? v : null;
}

export function getDate(page: NotionPage, prop: string): string {
  return page.properties?.[prop]?.date?.start ?? "";
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function pageToPartialDraft(page: NotionPage): Partial<Draft> {
  return {
    topik: getTitle(page),
    judul: getRichText(page, "Judul"),
    platform: getSelect(page, "Platform") || "TikTok",
    jenisKonten: getSelect(page, "Jenis Konten") || "Reels",
    tone: getSelect(page, "Tone") || "Storytelling",
    tanggal: getDate(page, "Tanggal"),
    script: getRichText(page, "Script"),
    skorViralitas: getNumber(page, "Skor Viralitas"),
    analisisAI: getRichText(page, "Analisis AI"),
    rekomendasi: getRichText(page, "Rekomendasi"),
    captionTikTok: getRichText(page, "Caption TikTok"),
    captionInstagram: getRichText(page, "Caption Instagram"),
    captionYTShorts: getRichText(page, "Caption YT Shorts"),
    tribeTrigger: getNumber(page, "TRIBE_Trigger") || 0,
    tribeResonance: getNumber(page, "TRIBE_Resonance") || 0,
    tribeImpact: getNumber(page, "TRIBE_Impact") || 0,
    tribeBehavior: getNumber(page, "TRIBE_Behavior") || 0,
    tribeEngagement: getNumber(page, "TRIBE_Engagement") || 0,
    inputTambahan: "",
    konsep: "",
  };
}

export function buildNotionProperties(draft: Draft) {
  // Notion rejects null for number fields — omit them when value is null/0
  const tribeScore = (v: number | null | undefined) =>
    v != null && v !== 0 ? { number: v } : undefined;

  const props: Record<string, unknown> = {
    Topik: { title: [{ text: { content: draft.topik || "Tanpa Judul" } }] },
    Judul: { rich_text: [{ text: { content: draft.judul || "" } }] },
    Platform: { select: { name: draft.platform || "TikTok" } },
    "Jenis Konten": { select: { name: draft.jenisKonten || "Reels" } },
    Tone: { select: { name: draft.tone || "Storytelling" } },
    Tanggal: {
      date: { start: draft.tanggal || new Date().toISOString().split("T")[0] },
    },
    Script: { rich_text: [{ text: { content: draft.script || "" } }] },
    "Analisis AI": { rich_text: [{ text: { content: draft.analisisAI || "" } }] },
    Rekomendasi: { rich_text: [{ text: { content: draft.rekomendasi || "" } }] },
    "Caption TikTok": { rich_text: [{ text: { content: draft.captionTikTok || "" } }] },
    "Caption Instagram": { rich_text: [{ text: { content: draft.captionInstagram || "" } }] },
    "Caption YT Shorts": { rich_text: [{ text: { content: draft.captionYTShorts || "" } }] },
  };

  // Only include number fields when they have a real value
  if (draft.skorViralitas != null) props["Skor Viralitas"] = { number: draft.skorViralitas };
  const t = tribeScore(draft.tribeTrigger);   if (t) props["TRIBE_Trigger"]   = t;
  const r = tribeScore(draft.tribeResonance); if (r) props["TRIBE_Resonance"] = r;
  const i = tribeScore(draft.tribeImpact);    if (i) props["TRIBE_Impact"]    = i;
  const b = tribeScore(draft.tribeBehavior);  if (b) props["TRIBE_Behavior"]  = b;
  const e = tribeScore(draft.tribeEngagement);if (e) props["TRIBE_Engagement"]= e;

  return props;
}
