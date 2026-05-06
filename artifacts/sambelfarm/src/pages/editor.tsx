import { useState } from "react";
import { useNotionCreatePage, useClaudeProxy } from "@workspace/api-client-react";
import { getConfig } from "@/lib/config";
import { useDraft, type SavedScript } from "@/lib/draft";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Edit3, Sparkles, RefreshCw, Save, Copy, Check, BarChart2,
  BookOpen, ChevronDown, ChevronUp
} from "lucide-react";

const PLATFORMS = ["TikTok", "Instagram Reels", "Instagram Stories", "Instagram Feed", "YouTube Shorts", "YouTube"];
const JENIS_KONTEN = ["Reels", "Stories", "Feed Post", "Carousel", "Tutorial", "Behind the Scenes"];
const TONES = ["Storytelling", "Edukatif", "Promosi", "Nyeleneh", "Roasting"];

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={copy} className="h-6 text-[10px] gap-1 px-2">
      {copied ? <><Check size={10} />{label} disalin</> : <><Copy size={10} />Salin {label}</>}
    </Button>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "bg-primary" : value >= 50 ? "bg-secondary" : "bg-accent";
  const textColor = value >= 75 ? "text-primary" : value >= 50 ? "text-secondary" : "text-accent";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-semibold w-7 text-right ${textColor}`}>{value}</span>
    </div>
  );
}

interface TribeResult {
  trigger: number;
  resonance: number;
  impact: number;
  behavior: number;
  engagement: number;
  skor_viralitas: number;
  analisis_ai: string;
  rekomendasi: string;
  caption_tiktok: string;
  caption_instagram: string;
  caption_yt_shorts: string;
}

export default function EditorPage() {
  const { draft, setDraft, resetDraft, savedScripts, addSaved } = useDraft();
  const [tab, setTab] = useState<"editor" | "saved">("editor");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [adaptOpen, setAdaptOpen] = useState(false);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [selectedSaved, setSelectedSaved] = useState<SavedScript | null>(null);
  const [adaptPlatform, setAdaptPlatform] = useState("TikTok");
  const [adaptJenis, setAdaptJenis] = useState("Reels");
  const [rewriteTone, setRewriteTone] = useState("Edukatif");
  const [aiWorking, setAiWorking] = useState(false);

  const notionCreate = useNotionCreatePage();
  const claudeProxy = useClaudeProxy();
  const { toast } = useToast();
  const config = getConfig();

  const analyzeTribe = () => {
    if (!draft.script.trim()) return;
    setAnalyzing(true);

    const prompt = `Analisis script konten berikut menggunakan framework TRIBE v2 (Trigger, Resonance, Impact, Behavior, Engagement). Lalu buat caption siap posting untuk 3 platform.

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
}

Penjelasan skor TRIBE:
- Trigger: kekuatan hook/pembuka memicu rasa ingin tahu
- Resonance: kedalaman resonansi dengan audiens target
- Impact: nilai/dampak yang diberikan
- Behavior: dorongan untuk bertindak (like/share/save/beli)
- Engagement: prediksi tingkat interaksi keseluruhan`;

    claudeProxy.mutate(
      { data: { system: "Kamu adalah analis konten digital senior yang ahli mengevaluasi viralitas konten Indonesia dan menulis caption.", prompt, model: config.aiModel } },
      {
        onSuccess: (data) => {
          try {
            const match = data.result.match(/\{[\s\S]*\}/);
            if (match) {
              const tribe = JSON.parse(match[0]) as TribeResult;
              setDraft({
                skorViralitas: tribe.skor_viralitas,
                tribeTrigger: tribe.trigger,
                tribeResonance: tribe.resonance,
                tribeImpact: tribe.impact,
                tribeBehavior: tribe.behavior,
                tribeEngagement: tribe.engagement,
                analisisAI: tribe.analisis_ai,
                rekomendasi: tribe.rekomendasi,
                captionTikTok: tribe.caption_tiktok,
                captionInstagram: tribe.caption_instagram,
                captionYTShorts: tribe.caption_yt_shorts,
              });
              setShowAnalysis(true);
            } else {
              toast({ title: "Gagal parse analisis", variant: "destructive" });
            }
          } catch {
            toast({ title: "Gagal parse analisis", variant: "destructive" });
          }
          setAnalyzing(false);
        },
        onError: () => {
          toast({ title: "Gagal analisis TRIBE", variant: "destructive" });
          setAnalyzing(false);
        },
      }
    );
  };

  const truncate = (text: string, max = 2000) => text.length > max ? text.slice(0, max) : text;

  const saveToNotion = () => {
    if (!draft.script.trim()) {
      toast({ title: "Script kosong", description: "Tulis atau generate script dulu.", variant: "destructive" });
      return;
    }
    setSaving(true);

    const properties: Record<string, unknown> = {
      Judul: { title: [{ text: { content: draft.judul || draft.topik || "Tanpa Judul" } }] },
      Topik: { rich_text: [{ text: { content: truncate(draft.topik) } }] },
      Platform: { select: { name: draft.platform } },
      "Jenis Konten": { select: { name: draft.jenisKonten } },
      Tone: { select: { name: draft.tone } },
      Script: { rich_text: [{ text: { content: truncate(draft.script) } }] },
      "Status Revisi": { select: { name: "Draft" } },
    };

    if (draft.tanggal) {
      properties["Tanggal"] = { date: { start: draft.tanggal } };
    }
    if (draft.konsep) {
      properties["Konsep"] = { rich_text: [{ text: { content: truncate(draft.konsep) } }] };
    }
    if (draft.skorViralitas !== null) {
      properties["Skor Viralitas"] = { number: draft.skorViralitas };
    }
    if (draft.analisisAI) {
      properties["Analisis AI"] = { rich_text: [{ text: { content: truncate(draft.analisisAI) } }] };
    }
    if (draft.rekomendasi) {
      properties["Rekomendasi"] = { rich_text: [{ text: { content: truncate(draft.rekomendasi) } }] };
    }
    if (draft.captionTikTok) {
      properties["Caption TikTok"] = { rich_text: [{ text: { content: truncate(draft.captionTikTok) } }] };
    }
    if (draft.captionInstagram) {
      properties["Caption Instagram"] = { rich_text: [{ text: { content: truncate(draft.captionInstagram) } }] };
    }
    if (draft.captionYTShorts) {
      properties["Caption YT Shorts"] = { rich_text: [{ text: { content: truncate(draft.captionYTShorts) } }] };
    }

    notionCreate.mutate(
      { data: { database_id: "", properties: properties as Record<string, string> } },
      {
        onSuccess: (data) => {
          const pageId = (data as unknown as { id: string }).id ?? "";
          const saved: SavedScript = {
            ...draft,
            notionPageId: pageId,
            savedAt: new Date().toISOString(),
          };
          addSaved(saved);
          resetDraft();
          setShowAnalysis(false);
          setTab("saved");
          toast({ title: "Script tersimpan ke Notion!" });
          setSaving(false);
        },
        onError: (err) => {
          const msg = (err as Error).message ?? "Gagal simpan";
          toast({ title: "Gagal menyimpan ke Notion", description: msg, variant: "destructive" });
          setSaving(false);
        },
      }
    );
  };

  const adaptScript = () => {
    if (!selectedSaved) return;
    setAiWorking(true);
    claudeProxy.mutate(
      {
        data: {
          system: "Kamu adalah content writer ahli adaptasi konten Indonesia.",
          prompt: `Sesuaikan script berikut untuk platform ${adaptPlatform} dengan format ${adaptJenis}. Pertahankan pesan utama, sesuaikan struktur, panjang, dan gaya dengan platform tujuan.\n\nSCRIPT ASLI:\n${selectedSaved.script}`,
          model: config.aiModel,
        }
      },
      {
        onSuccess: (data) => {
          setDraft({
            ...selectedSaved,
            script: data.result,
            platform: adaptPlatform,
            jenisKonten: adaptJenis,
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
          });
          setAdaptOpen(false);
          setShowAnalysis(false);
          setTab("editor");
          setAiWorking(false);
          toast({ title: "Script adaptasi siap diedit" });
        },
        onError: () => {
          toast({ title: "Gagal adaptasi", variant: "destructive" });
          setAiWorking(false);
        },
      }
    );
  };

  const rewriteScript = () => {
    if (!selectedSaved) return;
    setAiWorking(true);
    claudeProxy.mutate(
      {
        data: {
          system: "Kamu adalah penulis naskah konten Indonesia yang versatile.",
          prompt: `Tulis ulang script berikut dengan tone "${rewriteTone}". Pertahankan inti pesan dan esensi konten, tapi ubah total gaya, pendekatan, dan cara penyampaiannya.\n\nSCRIPT ASLI:\n${selectedSaved.script}`,
          model: config.aiModel,
        }
      },
      {
        onSuccess: (data) => {
          setDraft({
            ...selectedSaved,
            script: data.result,
            tone: rewriteTone,
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
          });
          setRewriteOpen(false);
          setShowAnalysis(false);
          setTab("editor");
          setAiWorking(false);
          toast({ title: "Script tulis ulang siap diedit" });
        },
        onError: () => {
          toast({ title: "Gagal tulis ulang", variant: "destructive" });
          setAiWorking(false);
        },
      }
    );
  };

  const openSavedForEdit = (s: SavedScript) => {
    setDraft({ ...s });
    setShowAnalysis(!!s.skorViralitas);
    setTab("editor");
  };

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
            key={t}
            data-testid={`tab-${t}`}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            {t === "editor" ? "Editor" : `Script Tersimpan${savedScripts.length > 0 ? ` (${savedScripts.length})` : ""}`}
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
                <Input
                  data-testid="input-topik-editor"
                  value={draft.topik}
                  onChange={(e) => setDraft({ topik: e.target.value })}
                  placeholder="Topik konten"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tanggal Publish</Label>
                <Input
                  type="date"
                  data-testid="input-tanggal"
                  value={draft.tanggal}
                  onChange={(e) => setDraft({ tanggal: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Judul Konten</Label>
              <Input
                data-testid="input-judul-editor"
                value={draft.judul}
                onChange={(e) => setDraft({ judul: e.target.value })}
                placeholder="Judul konten"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Platform</Label>
                <Select value={draft.platform} onValueChange={(v) => setDraft({ platform: v })}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-platform-editor">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jenis</Label>
                <Select value={draft.jenisKonten} onValueChange={(v) => setDraft({ jenisKonten: v })}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-jenis-editor">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JENIS_KONTEN.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tone</Label>
                <Select value={draft.tone} onValueChange={(v) => setDraft({ tone: v })}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-tone-editor">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Naskah Script</p>
              <CopyButton text={draft.script} label="Script" />
            </div>
            <Textarea
              data-testid="editor-textarea"
              value={draft.script}
              onChange={(e) => setDraft({ script: e.target.value })}
              placeholder="Script kamu akan muncul di sini setelah di-generate. Kamu juga bisa langsung mengetik atau menempel script..."
              className="min-h-56 text-sm resize-none font-mono"
            />
          </div>

          <div className="flex gap-2">
            <Button
              data-testid="button-analyze-tribe"
              variant="outline"
              onClick={analyzeTribe}
              disabled={analyzing || !draft.script.trim()}
              className="flex-1"
            >
              {analyzing
                ? <><RefreshCw size={14} className="mr-2 animate-spin" />Menganalisis...</>
                : <><BarChart2 size={14} className="mr-2" />Analisis TRIBE</>
              }
            </Button>
            <Button
              data-testid="button-save-script"
              onClick={saveToNotion}
              disabled={saving || !draft.script.trim()}
              className="flex-1"
            >
              {saving
                ? <><RefreshCw size={14} className="mr-2 animate-spin" />Menyimpan...</>
                : <><Save size={14} className="mr-2" />Simpan ke Notion</>
              }
            </Button>
          </div>

          {(showAnalysis && draft.skorViralitas !== null) && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <button
                className="w-full flex items-center justify-between"
                onClick={() => setShowAnalysis((v) => !v)}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-primary" />
                  <span className="font-semibold text-sm">Analisis TRIBE v2</span>
                </div>
                {showAnalysis ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </button>

              <div className="text-center py-1">
                <div className={`text-4xl font-bold ${draft.skorViralitas >= 75 ? "text-primary" : draft.skorViralitas >= 50 ? "text-secondary" : "text-accent"}`}>
                  {Math.round(draft.skorViralitas)}
                </div>
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
                      <li key={i} className="text-sm text-foreground flex gap-2">
                        <span className="text-accent shrink-0">•</span>
                        <span>{r.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(draft.captionTikTok || draft.captionInstagram || draft.captionYTShorts) && (
                <div className="border-t border-border pt-3 space-y-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Caption Siap Posting</p>

                  {draft.captionTikTok && (
                    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">TikTok</span>
                        <CopyButton text={draft.captionTikTok} label="TikTok" />
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{draft.captionTikTok}</p>
                    </div>
                  )}

                  {draft.captionInstagram && (
                    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Instagram</span>
                        <CopyButton text={draft.captionInstagram} label="Instagram" />
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{draft.captionInstagram}</p>
                    </div>
                  )}

                  {draft.captionYTShorts && (
                    <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">YouTube Shorts</span>
                        <CopyButton text={draft.captionYTShorts} label="YT Shorts" />
                      </div>
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
          {savedScripts.length === 0 ? (
            <div className="bg-muted/50 rounded-2xl p-8 text-center">
              <BookOpen size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Belum ada script tersimpan</p>
              <p className="text-xs text-muted-foreground mt-1">Buat dan simpan script pertamamu dari halaman Editor.</p>
            </div>
          ) : (
            savedScripts.map((s) => (
              <div
                key={s.notionPageId}
                data-testid={`saved-script-${s.notionPageId}`}
                className="bg-card border border-border rounded-2xl p-4 space-y-3"
              >
                <div>
                  <div className="font-semibold text-sm text-foreground">{s.judul || s.topik || "Tanpa Judul"}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {s.platform && <Badge variant="outline" className="text-[10px] px-1.5 h-5">{s.platform}</Badge>}
                    {s.jenisKonten && <Badge variant="outline" className="text-[10px] px-1.5 h-5">{s.jenisKonten}</Badge>}
                    {s.tone && <Badge variant="outline" className="text-[10px] px-1.5 h-5">{s.tone}</Badge>}
                    {s.tanggal && <Badge variant="outline" className="text-[10px] px-1.5 h-5">{s.tanggal}</Badge>}
                    {s.skorViralitas !== null && (
                      <Badge className="text-[10px] px-1.5 h-5 bg-primary/10 text-primary border-primary/20">
                        ⚡ {Math.round(s.skorViralitas)}
                      </Badge>
                    )}
                  </div>
                </div>

                {s.script && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{s.script}</p>
                )}

                <div className="flex gap-1.5 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    data-testid={`button-edit-saved-${s.notionPageId}`}
                    onClick={() => openSavedForEdit(s)}
                  >
                    <Edit3 size={12} className="mr-1" />Buka Editor
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    data-testid={`button-adapt-${s.notionPageId}`}
                    onClick={() => { setSelectedSaved(s); setAdaptPlatform(s.platform); setAdaptOpen(true); }}
                  >
                    <RefreshCw size={12} className="mr-1" />Adaptasi
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    data-testid={`button-rewrite-${s.notionPageId}`}
                    onClick={() => { setSelectedSaved(s); setRewriteOpen(true); }}
                  >
                    <Sparkles size={12} className="mr-1" />Tulis Ulang
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog open={adaptOpen} onOpenChange={setAdaptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adaptasi Script</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">Sesuaikan script untuk platform dan format baru.</p>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>Platform Tujuan</Label>
              <Select value={adaptPlatform} onValueChange={setAdaptPlatform}>
                <SelectTrigger data-testid="select-adapt-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jenis Konten Tujuan</Label>
              <Select value={adaptJenis} onValueChange={setAdaptJenis}>
                <SelectTrigger data-testid="select-adapt-jenis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_KONTEN.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                </SelectContent>
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
          <DialogHeader>
            <DialogTitle>Tulis Ulang Script</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">Gaya baru, esensi tetap sama.</p>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>Tone Baru</Label>
              <Select value={rewriteTone} onValueChange={setRewriteTone}>
                <SelectTrigger data-testid="select-rewrite-tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" data-testid="button-confirm-rewrite" onClick={rewriteScript} disabled={aiWorking}>
              {aiWorking ? <><RefreshCw size={14} className="mr-2 animate-spin" />Menulis ulang...</> : "Tulis Ulang Script"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
