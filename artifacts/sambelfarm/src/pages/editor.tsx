import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { useNotionCreatePage, useNotionQuery, useNotionUpdatePage, useNotionDeletePage, useClaudeProxy } from "@workspace/api-client-react";
import { getConfig } from "@/lib/config";
import { useDraft, type Draft } from "@/lib/draft";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SwipeableItem } from "@/components/swipeable-item";
import { downloadScriptPDF } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";
import {
  Edit3, Sparkles, RefreshCw, Save, Copy, Check, BarChart2,
  BookOpen, ChevronDown, ChevronUp, RotateCcw, FileDown, Palette, Trash2, CalendarDays
} from "lucide-react";

const PLATFORMS = ["TikTok", "Instagram Reels", "Instagram Stories", "Instagram Feed", "YouTube Shorts", "YouTube"];
const JENIS_KONTEN = ["Reels", "Stories", "Feed Post", "Carousel", "Tutorial", "Behind the Scenes"];
const TONES = ["Storytelling", "Edukatif", "Promosi", "Nyeleneh", "Roasting"];

interface NotionPage {
  id: string;
  properties: Record<string, {
    title?: Array<{ plain_text: string }>;
    rich_text?: Array<{ plain_text: string }>;
    select?: { name: string };
    number?: number;
    date?: { start: string };
  }>;
}

function getTitle(page: NotionPage): string { return page.properties?.Topik?.title?.[0]?.plain_text ?? ""; }
function getRichText(page: NotionPage, prop: string): string { return page.properties?.[prop]?.rich_text?.[0]?.plain_text ?? ""; }
function getSelect(page: NotionPage, prop: string): string { return page.properties?.[prop]?.select?.name ?? ""; }
function getNumber(page: NotionPage, prop: string): number | null {
  const v = page.properties?.[prop]?.number; return v !== undefined ? v : null;
}
function getDate(page: NotionPage, prop: string): string { return page.properties?.[prop]?.date?.start ?? ""; }

function pageToPartialDraft(page: NotionPage): Partial<Draft> {
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
    inputTambahan: "", konsep: "",
  };
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try { return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function InlineDatePicker({ value, onSave }: { value: string; onSave: (d: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  if (editing) {
    return (
      <input
        type="date" value={val} autoFocus
        className="text-[10px] border border-primary/50 rounded px-1.5 bg-background h-5"
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { setEditing(false); if (val && val !== value) onSave(val); }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  return (
    <button
      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      onClick={(e) => { e.stopPropagation(); setEditing(true); setVal(value); }}
    >
      <CalendarDays size={9} />
      <span className={value ? "" : "italic"}>{value ? formatDate(value) : "Tambah tanggal"}</span>
    </button>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Button variant="ghost" size="sm" onClick={copy} className="h-6 text-[10px] gap-1 px-2">
      {copied ? <><Check size={10} />{label} disalin</> : <><Copy size={10} />Salin {label}</>}
    </Button>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "bg-primary" : value >= 50 ? "bg-secondary" : "bg-accent";
  const textColor = value >= 75 ? "text-primary" : value >= 50 ? "text-secondary" : "text-accent";
  
  // Animasi angka count-up
  const count = useSpring(0, { stiffness: 60, damping: 20 });
  const displayValue = useTransform(count, (latest) => Math.round(latest));
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    count.set(value);
  }, [value, count]);

  useEffect(() => {
    return displayValue.on("change", (latest) => {
      if (textRef.current) {
        textRef.current.textContent = latest.toString();
      }
    });
  }, [displayValue]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`} 
        />
      </div>
      <span className={`text-xs font-semibold w-7 text-right ${textColor}`}>
        <span ref={textRef}>0</span>
      </span>
    </div>
  );
}

interface TribeResult {
  trigger: number; resonance: number; impact: number; behavior: number; engagement: number;
  skor_viralitas: number; analisis_ai: string; rekomendasi: string;
  caption_tiktok: string; caption_instagram: string; caption_yt_shorts: string;
}

export default function EditorPage() {
  const { draft, setDraft, resetDraft } = useDraft();
  const [location, setLocation] = useLocation();
  
  // Ambil tab dari query param jika ada
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    return (t === "saved") ? "saved" : "editor";
  };

  const [tab, setTab] = useState<"editor" | "saved">(getInitialTab());

  // Update URL saat tab berubah tanpa reload penuh
  const handleTabChange = (newTab: "editor" | "saved") => {
    setTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", newTab);
    window.history.replaceState({}, "", url.toString());
  };
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [adaptOpen, setAdaptOpen] = useState(false);
  const [filterTone, setFilterTone] = useState("all");
  const [changeToneOpen, setChangeToneOpen] = useState(false);
  const [pageForTone, setPageForTone] = useState<NotionPage | null>(null);
  const [selectedPage, setSelectedPage] = useState<NotionPage | null>(null);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const swipeableRefs = useRef<Array<{ reset: () => void } | null>>([]);
  const [adaptPlatform, setAdaptPlatform] = useState("TikTok");
  const [adaptJenis, setAdaptJenis] = useState("Reels");
  const [rewriteTone, setRewriteTone] = useState("Edukatif");
  const [aiWorking, setAiWorking] = useState(false);
  const [notionPages, setNotionPages] = useState<NotionPage[]>([]);
  const [notionLoaded, setNotionLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // STATE BARU: Menyimpan ID Notion saat sedang edit data lama
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  const notionCreate = useNotionCreatePage();
  const notionQuery = useNotionQuery();
  const notionUpdate = useNotionUpdatePage();
  const notionDelete = useNotionDeletePage();
  const claudeProxy = useClaudeProxy();
  const { toast } = useToast();
  const config = getConfig();

  useEffect(() => {
    if (tab === "saved") {
      setNotionLoaded(false);
      notionQuery.mutate(
        {
          data: {
            database_id: "",
            page_size: 30,
            sorts: [{ timestamp: "last_edited_time", direction: "descending" } as unknown as Record<string, string>],
          }
        },
        {
          onSuccess: (data) => {
            setNotionPages((data as unknown as { results: NotionPage[] }).results ?? []);
            setNotionLoaded(true);
          },
          onError: () => setNotionLoaded(true),
        }
      );
    }
  }, [tab, refreshKey]);

  const updatePageLocal = (pageId: string, propKey: string, propValue: NotionPage["properties"][string]) => {
    setNotionPages((prev) => prev.map((p) => p.id === pageId
      ? { ...p, properties: { ...p.properties, [propKey]: propValue } }
      : p
    ));
  };

  const handleDateChange = (page: NotionPage, newDate: string) => {
    updatePageLocal(page.id, "Tanggal", { date: { start: newDate } });
    notionUpdate.mutate(
      { pageId: page.id, data: { properties: { Tanggal: { date: { start: newDate } } } as Record<string, string> } },
      {
        onSuccess: () => toast({ title: "Tanggal diperbarui" }),
        onError: () => toast({ title: "Gagal update tanggal", variant: "destructive" }),
      }
    );
  };

  const handleToneChange = (newTone: string) => {
    if (!pageForTone) return;
    const pageId = pageForTone.id;
    updatePageLocal(pageId, "Tone", { select: { name: newTone } });
    setChangeToneOpen(false);
    notionUpdate.mutate(
      { pageId, data: { properties: { Tone: { select: { name: newTone } } } as Record<string, string> } },
      {
        onSuccess: () => toast({ title: `Tone diubah ke "${newTone}"` }),
        onError: () => toast({ title: "Gagal update tone", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (page: NotionPage) => {
    setNotionPages((prev) => prev.filter((p) => p.id !== page.id));
    notionDelete.mutate(
      { pageId: page.id },
      {
        onSuccess: () => toast({ title: "Script dihapus" }),
        onError: () => {
          toast({ title: "Gagal menghapus", variant: "destructive" });
          setNotionPages((prev) => [page, ...prev]);
        },
      }
    );
  };

  const handleDownloadPDF = (page: NotionPage) => {
    downloadScriptPDF({
      topik: getTitle(page),
      judul: getRichText(page, "Judul"),
      platform: getSelect(page, "Platform"),
      jenisKonten: getSelect(page, "Jenis Konten"),
      tone: getSelect(page, "Tone"),
      tanggal: getDate(page, "Tanggal"),
      statusRevisi: getSelect(page, "Status Revisi"),
      script: getRichText(page, "Script"),
      skorViralitas: getNumber(page, "Skor Viralitas"),
    });
  };

  const analyzeTribe = () => {
    if (!draft.script.trim()) return;
    setAnalyzing(true);

    const prompt = `Analisis script konten edukasi pertanian cabai berikut menggunakan framework TRIBE v2 (Trigger, Resonance, Impact, Behavior, Engagement) dari sudut pandang audiens 'Sambelers' (petani atau penggemar cabai). Berikan skor 0-100 untuk setiap elemen TRIBE. Lalu, buat rekomendasi perbaikan yang spesifik dan actionable untuk meningkatkan viralitas dan engagement di kalangan 'Sambelers'. Terakhir, buat caption siap posting untuk 3 platform (TikTok, Instagram, YouTube Shorts) yang menarik dan relevan dengan topik cabai.

SCRIPT:
${draft.script}

CONTEXT:
- Platform utama: ${draft.platform}
- Jenis konten: ${draft.jenisKonten}
- Tone: ${draft.tone}
- Topik: ${draft.topik}

Format respons sebagai JSON (tanpa markdown code block):
{
  "trigger": <skor 0-100>,
  "resonance": <skor 0-100>,
  "impact": <skor 0-100>,
  "behavior": <skor 0-100>,
  "engagement": <skor 0-100>,
  "skor_viralitas": <rata-rata keseluruhan>,
  "analisis_ai": "<ringkasan analisis 2-3 kalimat, jujur dan to-the-point>",
  "rekomendasi": "<2-3 rekomendasi perbaikan konkret, pisahkan dengan | >",
  "caption_tiktok": "<caption TikTok dengan hashtag, max 150 kata>",
  "caption_instagram": "<caption Instagram yang engaging, max 200 kata>",
  "caption_yt_shorts": "<judul + deskripsi YouTube Shorts singkat>"
}`;

    claudeProxy.mutate(
      { data: { system: "Kamu adalah analis konten digital senior ahli mengevaluasi viralitas konten Indonesia dan menulis caption.", prompt, model: config.aiModel } },
      {
        onSuccess: (data) => {
          try {
            const match = data.result.match(/\{[\s\S]*\}/);
            if (match) {
              const tribe = JSON.parse(match[0]) as TribeResult;
              setDraft({
                skorViralitas: tribe.skor_viralitas,
                tribeTrigger: tribe.trigger, tribeResonance: tribe.resonance,
                tribeImpact: tribe.impact, tribeBehavior: tribe.behavior, tribeEngagement: tribe.engagement,
                analisisAI: tribe.analisis_ai, rekomendasi: tribe.rekomendasi,
                captionTikTok: tribe.caption_tiktok, captionInstagram: tribe.caption_instagram, captionYTShorts: tribe.caption_yt_shorts,
              });
              setShowAnalysis(true);
            } else { toast({ title: "Gagal parse analisis", variant: "destructive" }); }
          } catch { toast({ title: "Gagal parse analisis", variant: "destructive" }); }
          setAnalyzing(false);
        },
        onError: () => { toast({ title: "Gagal analisis TRIBE", variant: "destructive" }); setAnalyzing(false); },
      }
    );
  };

  const truncate = (text: string, max = 2000) => text.length > max ? text.slice(0, max) : text;

  // PERBAIKAN: Logika Simpan (Bisa Update atau Create)
  const saveToNotion = () => {
    if (!draft.script.trim()) {
      toast({ title: "Script kosong", description: "Tulis atau generate script dulu.", variant: "destructive" });
      return;
    }
    setSaving(true);

    const properties: Record<string, unknown> = {
      Topik: { title: [{ text: { content: draft.topik || draft.judul || "Tanpa Judul" } }] },
      Judul: { rich_text: [{ text: { content: truncate(draft.judul) } }] },
      Platform: { select: { name: draft.platform } },
      "Jenis Konten": { select: { name: draft.jenisKonten } },
      Tone: { select: { name: draft.tone } },
      Script: { rich_text: [{ text: { content: truncate(draft.script) } }] },
      "Status Revisi": { select: { name: "Draft" } },
    };

    if (draft.tanggal) properties["Tanggal"] = { date: { start: draft.tanggal } };
    if (draft.skorViralitas !== null) properties["Skor Viralitas"] = { number: draft.skorViralitas };
    if (draft.tribeTrigger !== undefined) properties["TRIBE_Trigger"] = { number: draft.tribeTrigger };
    if (draft.tribeResonance !== undefined) properties["TRIBE_Resonance"] = { number: draft.tribeResonance };
    if (draft.tribeImpact !== undefined) properties["TRIBE_Impact"] = { number: draft.tribeImpact };
    if (draft.tribeBehavior !== undefined) properties["TRIBE_Behavior"] = { number: draft.tribeBehavior };
    if (draft.tribeEngagement !== undefined) properties["TRIBE_Engagement"] = { number: draft.tribeEngagement };
    if (draft.analisisAI) properties["Analisis AI"] = { rich_text: [{ text: { content: truncate(draft.analisisAI) } }] };
    if (draft.rekomendasi) properties["Rekomendasi"] = { rich_text: [{ text: { content: truncate(draft.rekomendasi) } }] };
    if (draft.captionTikTok) properties["Caption TikTok"] = { rich_text: [{ text: { content: truncate(draft.captionTikTok) } }] };
    if (draft.captionInstagram) properties["Caption Instagram"] = { rich_text: [{ text: { content: truncate(draft.captionInstagram) } }] };
    if (draft.captionYTShorts) properties["Caption YT Shorts"] = { rich_text: [{ text: { content: truncate(draft.captionYTShorts) } }] };

    if (editingPageId) {
      // JIKA SEDANG EDIT: Lakukan UPDATE (Timpa data lama)
      notionUpdate.mutate(
        { pageId: editingPageId, data: { properties: properties as Record<string, string> } },
        {
          onSuccess: () => {
            resetDraft(); 
            setEditingPageId(null); // Bersihkan memori ID
            setShowAnalysis(false);
            setRefreshKey((k) => k + 1); 
            setTab("saved");
            toast({ title: "Script berhasil diperbarui!" }); 
            setSaving(false);
          },
          onError: (err) => {
            toast({ title: "Gagal update ke Notion", description: (err as Error).message ?? "Gagal update", variant: "destructive" });
            setSaving(false);
          },
        }
      );
    } else {
      // JIKA DATA BARU: Lakukan CREATE (Bikin baris baru)
      notionCreate.mutate(
        { data: { database_id: "", properties: properties as Record<string, string> } },
        {
          onSuccess: () => {
            resetDraft(); 
            setEditingPageId(null);
            setShowAnalysis(false);
            setRefreshKey((k) => k + 1); 
            setTab("saved");
            toast({ title: "Script baru tersimpan ke Notion!" }); 
            setSaving(false);
          },
          onError: (err) => {
            toast({ title: "Gagal menyimpan ke Notion", description: (err as Error).message ?? "Gagal simpan", variant: "destructive" });
            setSaving(false);
          },
        }
      );
    }
  };

  const adaptScript = () => {
    if (!selectedPage) return;
    const script = getRichText(selectedPage, "Script");
    setAiWorking(true);
    claudeProxy.mutate(
      { data: { system: "Kamu adalah content writer ahli adaptasi konten Indonesia.", prompt: `Sesuaikan script berikut untuk platform ${adaptPlatform} dengan format ${adaptJenis}. Pertahankan pesan utama, sesuaikan struktur, panjang, dan gaya dengan platform tujuan.\n\nSCRIPT ASLI:\n${script}`, model: config.aiModel } },
      {
        onSuccess: (data) => {
          setDraft({ ...pageToPartialDraft(selectedPage), script: data.result, platform: adaptPlatform, jenisKonten: adaptJenis });
          setEditingPageId(null); // Adaptasi dianggap bikin versi baru
          setAdaptOpen(false); setShowAnalysis(false); setTab("editor"); setAiWorking(false);
          toast({ title: "Script adaptasi siap diedit" });
        },
        onError: () => { toast({ title: "Gagal adaptasi", variant: "destructive" }); setAiWorking(false); },
      }
    );
  };

  const rewriteScript = () => {
    if (!selectedPage) return;
    const script = getRichText(selectedPage, "Script");
    setAiWorking(true);
    claudeProxy.mutate(
      { data: { system: "Kamu adalah penulis naskah konten Indonesia yang versatile.", prompt: `Tulis ulang script berikut dengan tone "${rewriteTone}". Pertahankan inti pesan dan esensi konten, tapi ubah total gaya, pendekatan, dan cara penyampaiannya.\n\nSCRIPT ASLI:\n${script}`, model: config.aiModel } },
      {
        onSuccess: (data) => {
          setDraft({ ...pageToPartialDraft(selectedPage), script: data.result, tone: rewriteTone });
          setEditingPageId(null); // Tulis ulang dianggap bikin versi baru
          setRewriteOpen(false); setShowAnalysis(false); setTab("editor"); setAiWorking(false);
          toast({ title: "Script tulis ulang siap diedit" });
        },
        onError: () => { toast({ title: "Gagal tulis ulang", variant: "destructive" }); setAiWorking(false); },
      }
    );
  };

  // FIXED: Use useMemo with raw source data (notionPages), not filtered result
  const filteredPages = useMemo(() => {
    // Start with immutable copy of raw source data
    let result = [...notionPages];

    // Filter by tone if not "all"
    if (filterTone && filterTone !== "all") {
      result = result.filter((p) => {
        const pageTone = getSelect(p, "Tone").toLowerCase().trim();
        const filterValue = filterTone.toLowerCase().trim();
        return pageTone === filterValue;
      });
    }

    return result;
  }, [notionPages, filterTone]);

  // Reset all swipe states when filter changes - FIXED: Clear ref array completely
  useEffect(() => {
    swipeableRefs.current = [];
    // DEBUG LOG: Track filter changes and list state
    console.log({
      filterTone,
      notionPagesLength: notionPages.length,
      filteredLength: filteredPages.length,
      timestamp: new Date().toISOString()
    });
  }, [filterTone]);

  return (
    <div className="p-4 space-y-5">
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-0.5">
          <Edit3 size={16} className="text-primary" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Editor</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Script Editor</h1>
      </div>

      <div className="flex gap-2 bg-muted rounded-xl p-1">
        {(["editor", "saved"] as const).map((t) => (
          <button
            key={t} data-testid={`tab-${t}`} onClick={() => handleTabChange(t)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            {t === "editor" ? "Editor" : `Script Tersimpan${notionLoaded && notionPages.length > 0 ? ` (${notionPages.length})` : ""}`}
          </button>
        ))}
      </div>

      {tab === "editor" && (
        <div className="space-y-4 pb-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detail Konten</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Topik</Label>
                <Input data-testid="input-topik-editor" value={draft.topik} onChange={(e) => setDraft({ topik: e.target.value })} placeholder="Topik konten" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tanggal Publish</Label>
                <Input type="date" data-testid="input-tanggal" value={draft.tanggal} onChange={(e) => setDraft({ tanggal: e.target.value })} className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Judul Konten</Label>
              <Input data-testid="input-judul-editor" value={draft.judul} onChange={(e) => setDraft({ judul: e.target.value })} placeholder="Judul konten" className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Platform</Label>
                <Select value={draft.platform} onValueChange={(v) => setDraft({ platform: v })}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-platform-editor"><SelectValue /></SelectTrigger>
                  <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jenis</Label>
                <Select value={draft.jenisKonten} onValueChange={(v) => setDraft({ jenisKonten: v })}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-jenis-editor"><SelectValue /></SelectTrigger>
                  <SelectContent>{JENIS_KONTEN.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tone</Label>
                <Select value={draft.tone} onValueChange={(v) => setDraft({ tone: v })}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-tone-editor"><SelectValue /></SelectTrigger>
                  <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Naskah Script</p>
              <CopyButton text={draft.script} label="Script" />
            </div>
            <Textarea data-testid="editor-textarea" value={draft.script} onChange={(e) => setDraft({ script: e.target.value })} placeholder="Script kamu akan muncul di sini setelah di-generate..." className="min-h-56 text-sm resize-none font-mono" />
          </div>

          <div className="flex gap-2">
            <Button data-testid="button-analyze-tribe" variant="outline" onClick={analyzeTribe} disabled={analyzing || !draft.script.trim()} className="flex-1">
              {analyzing ? <><RefreshCw size={14} className="mr-2 animate-spin" />Menganalisis...</> : <><BarChart2 size={14} className="mr-2" />Analisis TRIBE</>}
            </Button>
            <Button data-testid="button-save-script" onClick={saveToNotion} disabled={saving || !draft.script.trim()} className="flex-1">
              {saving ? <><RefreshCw size={14} className="mr-2 animate-spin" />Menyimpan...</> : <><Save size={14} className="mr-2" />Simpan ke Notion</>}
            </Button>
          </div>

          {showAnalysis && draft.skorViralitas !== null && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <button className="w-full flex items-center justify-between" onClick={() => setShowAnalysis((v) => !v)}>
                <div className="flex items-center gap-2"><Sparkles size={15} className="text-primary" /><span className="font-semibold text-sm">Analisis TRIBE v2</span></div>
                {showAnalysis ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </button>
              <div className="text-center py-1">
                <div className={`text-4xl font-bold ${draft.skorViralitas >= 75 ? "text-primary" : draft.skorViralitas >= 50 ? "text-secondary" : "text-accent"}`}>{Math.round(draft.skorViralitas)}</div>
                <div className="text-xs text-muted-foreground">Skor Viralitas</div>
              </div>
              <div className="space-y-2">
                <ScoreBar label="Trigger" value={draft.tribeTrigger} />
                <ScoreBar label="Resonance" value={draft.tribeResonance} />
                <ScoreBar label="Impact" value={draft.tribeImpact} />
                <ScoreBar label="Behavior" value={draft.tribeBehavior} />
                <ScoreBar label="Engagement" value={draft.tribeEngagement} />
              </div>
              {draft.analisisAI && (
                <div className="border-t border-border pt-3 space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Analisis AI</p>
                  <p className="text-sm text-foreground leading-relaxed">{draft.analisisAI}</p>
                </div>
              )}
              {draft.rekomendasi && (
                <div className="border-t border-border pt-3 space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rekomendasi Perbaikan</p>
                  <ul className="space-y-1">
                    {draft.rekomendasi.split("|").map((r, i) => (
                      <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-accent shrink-0">•</span><span>{r.trim()}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {(draft.captionTikTok || draft.captionInstagram || draft.captionYTShorts) && (
                <div className="border-t border-border pt-3 space-y-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Caption Siap Posting</p>
                  {draft.captionTikTok && (
                    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between"><span className="text-xs font-semibold">TikTok</span><CopyButton text={draft.captionTikTok} label="TikTok" /></div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{draft.captionTikTok}</p>
                    </div>
                  )}
                  {draft.captionInstagram && (
                    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between"><span className="text-xs font-semibold">Instagram</span><CopyButton text={draft.captionInstagram} label="Instagram" /></div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{draft.captionInstagram}</p>
                    </div>
                  )}
                  {draft.captionYTShorts && (
                    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between"><span className="text-xs font-semibold">YouTube Shorts</span><CopyButton text={draft.captionYTShorts} label="YT Shorts" /></div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{draft.captionYTShorts}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "saved" && (
        <div className="space-y-3 pb-4">
          <div className="flex gap-2">
            <Select value={filterTone} onValueChange={setFilterTone}>
              <SelectTrigger className="flex-1 h-9 text-sm" data-testid="select-filter-tone"><SelectValue placeholder="Filter Tone" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tone</SelectItem>
                {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" data-testid="button-refresh-notion" onClick={() => setRefreshKey((k) => k + 1)}>
              <RotateCcw size={14} />
            </Button>
          </div>

          {!notionLoaded ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
          ) : filteredPages.length === 0 ? (
            <div className="bg-muted/50 rounded-2xl p-8 text-center">
              <BookOpen size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">{filterTone === "all" ? "Belum ada script tersimpan" : `Tidak ada script dengan tone ${filterTone}`}</p>
              <p className="text-xs text-muted-foreground mt-1">{filterTone === "all" ? "Buat dan simpan script pertamamu dari halaman Editor." : "Coba ubah filter tone."}</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div 
                className="space-y-3"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.1 }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
              >
                {filteredPages.map((page, index) => {
                const topik = getTitle(page);
                const judul = getRichText(page, "Judul");
                const displayTitle = judul || topik || "Tanpa Judul";
                const platform = getSelect(page, "Platform");
                const jenisKonten = getSelect(page, "Jenis Konten");
                const tone = getSelect(page, "Tone");
                const tanggal = getDate(page, "Tanggal");
                const statusRevisi = getSelect(page, "Status Revisi");
                const skor = getNumber(page, "Skor Viralitas");
                const scriptPreview = getRichText(page, "Script");

                return (
                  <motion.div
                    key={page.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <SwipeableItem
                      ref={(el) => { swipeableRefs.current[index] = el; }}
                      rightActions={[
                        {
                          label: "Download",
                          icon: <FileDown size={18} />,
                          bgClass: "bg-sky-500",
                          direction: "right",
                          onClick: () => handleDownloadPDF(page),
                        },
                        {
                          label: "Tone",
                          icon: <Palette size={18} />,
                          bgClass: "bg-amber-500",
                          direction: "right",
                          onClick: () => { setPageForTone(page); setChangeToneOpen(true); },
                        },
                        {
                          label: "Hapus",
                          icon: <Trash2 size={18} />,
                          bgClass: "bg-red-500",
                          direction: "right",
                          onClick: () => handleDelete(page),
                        },
                      ]}
                    >
                      <div
                        data-testid={`saved-script-${page.id}`}
                        className="bg-card border border-border rounded-2xl p-4 space-y-3"
                      >
                        <div>
                          <div className="font-semibold text-sm text-foreground">{displayTitle}</div>
                          {topik && judul && <div className="text-xs text-muted-foreground mt-0.5 truncate">{topik}</div>}
                          <div className="mt-1.5">
                            <InlineDatePicker value={tanggal} onSave={(d) => handleDateChange(page, d)} />
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {platform && <Badge variant="outline" className="text-[10px] px-1.5 h-5">{platform}</Badge>}
                            {jenisKonten && <Badge variant="outline" className="text-[10px] px-1.5 h-5">{jenisKonten}</Badge>}
                            {tone && <Badge variant="outline" className="text-[10px] px-1.5 h-5">{tone}</Badge>}
                            {statusRevisi && (
                              <Badge variant="outline" className={`text-[10px] px-1.5 h-5 ${statusRevisi === "Final" || statusRevisi === "Dipublikasi" ? "bg-primary/10 text-primary border-primary/20" : statusRevisi === "Terjadwal" ? "bg-accent/10 text-accent border-accent/20" : ""}`}>
                                {statusRevisi}
                              </Badge>
                            )}
                            {skor !== null && (
                              <Badge className="text-[10px] px-1.5 h-5 bg-primary/10 text-primary border-primary/20">⚡ {Math.round(skor)}</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <Button size="sm" variant="outline" className="flex-1 min-w-[80px] h-8 px-2 text-[10px] sm:text-xs" data-testid={`button-edit-saved-${page.id}`}
                            onClick={() => { 
                              setEditingPageId(page.id);
                              setDraft(pageToPartialDraft(page)); 
                              setShowAnalysis(getNumber(page, "Skor Viralitas") !== null); 
                              setTab("editor"); 
                            }}>
                            <Edit3 size={10} className="mr-1 shrink-0" />Buka Editor
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 min-w-[80px] h-8 px-2 text-[10px] sm:text-xs" data-testid={`button-adapt-${page.id}`}
                            onClick={() => { setSelectedPage(page); setAdaptPlatform(platform || "TikTok"); setAdaptOpen(true); }}>
                            <RefreshCw size={10} className="mr-1 shrink-0" />Adaptasi
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 min-w-[80px] h-8 px-2 text-[10px] sm:text-xs" data-testid={`button-rewrite-${page.id}`}
                            onClick={() => { setSelectedPage(page); setRewriteOpen(true); }}>
                            <Sparkles size={10} className="mr-1 shrink-0" />Tulis Ulang
                          </Button>
                        </div>
                      </div>
                    </SwipeableItem>
                  </motion.div>
                );
              })}
              <p className="text-[10px] text-muted-foreground text-center mt-1">Geser kartu ke kiri untuk opsi tambahan</p>
            </motion.div>
          )}
        </div>
      )}

      <Dialog open={adaptOpen} onOpenChange={setAdaptOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adaptasi Script</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">Sesuaikan script untuk platform dan format baru.</p>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>Platform Tujuan</Label>
              <Select value={adaptPlatform} onValueChange={setAdaptPlatform}>
                <SelectTrigger data-testid="select-adapt-platform"><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jenis Konten Tujuan</Label>
              <Select value={adaptJenis} onValueChange={setAdaptJenis}>
                <SelectTrigger data-testid="select-adapt-jenis"><SelectValue /></SelectTrigger>
                <SelectContent>{JENIS_KONTEN.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="w-full" data-testid="button-confirm-adapt" onClick={adaptScript} disabled={aiWorking}>
              {aiWorking ? <><RefreshCw size={14} className="mr-2 animate-spin" />Mengadaptasi...</> : "Adaptasi Script"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rewriteOpen} onOpenChange={setRewriteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tulis Ulang Script</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">Gaya baru, esensi tetap sama.</p>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>Tone Baru</Label>
              <Select value={rewriteTone} onValueChange={setRewriteTone}>
                <SelectTrigger data-testid="select-rewrite-tone"><SelectValue /></SelectTrigger>
                <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="w-full" data-testid="button-confirm-rewrite" onClick={rewriteScript} disabled={aiWorking}>
              {aiWorking ? <><RefreshCw size={14} className="mr-2 animate-spin" />Menulis ulang...</> : "Tulis Ulang Script"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={changeToneOpen} onOpenChange={setChangeToneOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ganti Tone</DialogTitle></DialogHeader>
          {pageForTone && (
            <p className="text-xs text-muted-foreground -mt-2 truncate">
              {getRichText(pageForTone, "Judul") || getTitle(pageForTone) || "Script"}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {TONES.map((t) => (
              <Button
                key={t}
                variant={pageForTone && getSelect(pageForTone, "Tone") === t ? "default" : "outline"}
                className="h-11"
                onClick={() => handleToneChange(t)}
              >
                {t}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
