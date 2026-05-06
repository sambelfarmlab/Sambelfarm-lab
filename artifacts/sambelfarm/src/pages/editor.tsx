import { useState, useEffect } from "react";
import { useNotionQuery, useClaudeProxy } from "@workspace/api-client-react";
import { getConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Edit3, Search, RefreshCw, Sparkles, BarChart2 } from "lucide-react";

interface NotionPage {
  id: string;
  properties: Record<string, {
    title?: Array<{ plain_text: string }>;
    select?: { name: string };
    rich_text?: Array<{ plain_text: string }>;
    number?: number;
    date?: { start: string };
  }>;
}

interface TribeScore {
  trigger: number;
  resonance: number;
  impact: number;
  behavior: number;
  engagement: number;
  total: number;
  summary: string;
}

const TONES = ["Storytelling", "Edukatif", "Promosi", "Nyeleneh", "Roasting"];
const PLATFORMS = ["Reels", "TikTok", "Stories", "Feed Post", "Carousel", "YouTube Shorts"];

function TribeAnalysis({ script, model }: { script: string; model: string }) {
  const [tribe, setTribe] = useState<TribeScore | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const claudeProxy = useClaudeProxy();
  const { toast } = useToast();

  const analyze = () => {
    if (!script.trim()) return;
    setAnalyzing(true);

    const prompt = `Analisis script konten berikut menggunakan framework TRIBE v2 (Trigger, Resonance, Impact, Behavior, Engagement). Berikan skor 0-100 untuk masing-masing dimensi.

SCRIPT:
${script}

Format respons sebagai JSON:
{
  "trigger": <skor 0-100>,
  "resonance": <skor 0-100>,
  "impact": <skor 0-100>,
  "behavior": <skor 0-100>,
  "engagement": <skor 0-100>,
  "total": <rata-rata keseluruhan>,
  "summary": "<ringkasan analisis 2-3 kalimat>"
}

Penjelasan dimensi:
- Trigger: seberapa kuat hook/pembuka memicu rasa ingin tahu
- Resonance: seberapa dalam konten beresonansi dengan audiens
- Impact: seberapa besar dampak/nilai yang diberikan
- Behavior: seberapa kuat dorongan untuk bertindak (like/share/save)
- Engagement: prediksi tingkat interaksi keseluruhan`;

    claudeProxy.mutate(
      { data: { system: "Kamu adalah analis konten digital yang ahli mengevaluasi viralitas konten Indonesia.", prompt, model } },
      {
        onSuccess: (data) => {
          try {
            const match = data.result.match(/\{[\s\S]*\}/);
            if (match) {
              setTribe(JSON.parse(match[0]) as TribeScore);
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

  const scoreColor = (s: number) => s >= 75 ? "text-primary" : s >= 50 ? "text-secondary" : "text-accent";
  const barColor = (s: number) => s >= 75 ? "bg-primary" : s >= 50 ? "bg-secondary" : "bg-accent";

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-primary" />
          <span className="font-semibold text-sm">Analisis TRIBE v2</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          data-testid="button-analyze-tribe"
          onClick={analyze}
          disabled={analyzing || !script.trim()}
          className="h-7 text-xs"
        >
          {analyzing ? <><RefreshCw size={12} className="mr-1 animate-spin" />Menganalisis...</> : <><Sparkles size={12} className="mr-1" />Analisis</>}
        </Button>
      </div>

      {tribe && (
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className={`text-3xl font-bold ${scoreColor(tribe.total)}`}>{tribe.total}</div>
              <div className="text-xs text-muted-foreground">Skor Viralitas</div>
            </div>
          </div>

          <div className="space-y-2">
            {([
              { key: "trigger", label: "Trigger" },
              { key: "resonance", label: "Resonance" },
              { key: "impact", label: "Impact" },
              { key: "behavior", label: "Behavior" },
              { key: "engagement", label: "Engagement" },
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor(tribe[key])}`}
                    style={{ width: `${tribe[key]}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold w-8 text-right ${scoreColor(tribe[key])}`}>{tribe[key]}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">{tribe.summary}</p>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  const [tab, setTab] = useState<"new" | "saved">("new");
  const [editScript, setEditScript] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTone, setFilterTone] = useState("all");
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loadedPages, setLoadedPages] = useState(false);
  const [repurposeOpen, setRepurposeOpen] = useState(false);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<NotionPage | null>(null);
  const [repurposePlatform, setRepurposePlatform] = useState("TikTok");
  const [rewriteTone, setRewriteTone] = useState("Edukatif");

  const notionQuery = useNotionQuery();
  const claudeProxy = useClaudeProxy();
  const { toast } = useToast();
  const config = getConfig();

  useEffect(() => {
    if (tab === "saved" && !loadedPages) {
      notionQuery.mutate(
        { data: { database_id: "", page_size: 20, sorts: [{ timestamp: "last_edited_time", direction: "descending" } as unknown as Record<string, string>] } },
        {
          onSuccess: (data) => {
            setPages((data as unknown as { results: NotionPage[] }).results ?? []);
            setLoadedPages(true);
          },
          onError: () => setLoadedPages(true),
        }
      );
    }
  }, [tab]);

  const filteredPages = pages.filter((p) => {
    const title = (p.properties?.Judul?.title?.[0]?.plain_text ?? p.properties?.Name?.title?.[0]?.plain_text ?? "").toLowerCase();
    const tone = p.properties?.Tone?.select?.name ?? "";
    const matchSearch = !searchQuery || title.includes(searchQuery.toLowerCase());
    const matchTone = filterTone === "all" || tone === filterTone;
    return matchSearch && matchTone;
  });

  const loadIntoEditor = (page: NotionPage) => {
    const script = page.properties?.Script?.rich_text?.[0]?.plain_text ?? "";
    setEditScript(script);
    setTab("new");
  };

  const repurpose = () => {
    if (!selectedPage) return;
    const script = selectedPage.properties?.Script?.rich_text?.[0]?.plain_text ?? "";
    claudeProxy.mutate(
      {
        data: {
          system: "Kamu adalah content writer ahli repurposing konten Indonesia.",
          prompt: `Ubah script berikut menjadi format ${repurposePlatform}. Sesuaikan panjang, struktur, dan gaya dengan platform tersebut.\n\nSCRIPT ASLI:\n${script}`,
          model: config.aiModel,
        }
      },
      {
        onSuccess: (data) => {
          setEditScript(data.result);
          setRepurposeOpen(false);
          setTab("new");
          toast({ title: "Script siap diedit" });
        },
        onError: () => toast({ title: "Gagal repurpose", variant: "destructive" }),
      }
    );
  };

  const rewrite = () => {
    if (!selectedPage) return;
    const script = selectedPage.properties?.Script?.rich_text?.[0]?.plain_text ?? "";
    claudeProxy.mutate(
      {
        data: {
          system: "Kamu adalah penulis naskah konten Indonesia yang versatile.",
          prompt: `Tulis ulang script berikut dengan tone "${rewriteTone}". Pertahankan inti pesan, tapi ubah gaya dan pendekatan.\n\nSCRIPT ASLI:\n${script}`,
          model: config.aiModel,
        }
      },
      {
        onSuccess: (data) => {
          setEditScript(data.result);
          setRewriteOpen(false);
          setTab("new");
          toast({ title: "Script siap diedit" });
        },
        onError: () => toast({ title: "Gagal rewrite", variant: "destructive" }),
      }
    );
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
        {(["new", "saved"] as const).map((t) => (
          <button
            key={t}
            data-testid={`tab-${t}`}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "new" ? "Generate Baru" : "Script Tersimpan"}
          </button>
        ))}
      </div>

      {tab === "new" ? (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <Textarea
              data-testid="editor-textarea"
              value={editScript}
              onChange={(e) => setEditScript(e.target.value)}
              placeholder="Paste atau ketik script di sini untuk diedit dan dianalisis..."
              className="min-h-52 text-sm resize-none"
            />
          </div>
          <TribeAnalysis script={editScript} model={config.aiModel} />
        </div>
      ) : (
        <div className="space-y-4">
          <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                  <Input
                    data-testid="input-search-scripts"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari script..."
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={filterTone} onValueChange={setFilterTone}>
                  <SelectTrigger className="w-32 h-9" data-testid="select-filter-tone">
                    <SelectValue placeholder="Tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tone</SelectItem>
                    {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {!loadedPages ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
              ) : filteredPages.length === 0 ? (
                <div className="bg-muted/50 rounded-2xl p-5 text-center">
                  <p className="text-sm text-muted-foreground">Tidak ada script ditemukan.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPages.map((page) => {
                    const title = page.properties?.Judul?.title?.[0]?.plain_text ?? page.properties?.Name?.title?.[0]?.plain_text ?? "Tanpa Judul";
                    const tone = page.properties?.Tone?.select?.name ?? "";
                    const platform = page.properties?.Platform?.select?.name ?? "";
                    return (
                      <div
                        key={page.id}
                        data-testid={`saved-script-${page.id}`}
                        className="bg-card border border-border rounded-xl p-3.5 space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{title}</div>
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              {tone && <Badge variant="outline" className="text-[10px] px-1.5 h-5">{tone}</Badge>}
                              {platform && <Badge variant="outline" className="text-[10px] px-1.5 h-5">{platform}</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" data-testid={`button-edit-${page.id}`} onClick={() => loadIntoEditor(page)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" data-testid={`button-repurpose-${page.id}`} onClick={() => { setSelectedPage(page); setRepurposeOpen(true); }}>
                            Repurpose
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" data-testid={`button-rewrite-${page.id}`} onClick={() => { setSelectedPage(page); setRewriteOpen(true); }}>
                            Rewrite
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
        </div>
      )}

      <Dialog open={repurposeOpen} onOpenChange={setRepurposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Repurpose Format</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={repurposePlatform} onValueChange={setRepurposePlatform}>
              <SelectTrigger data-testid="select-repurpose-platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="w-full" data-testid="button-confirm-repurpose" onClick={repurpose} disabled={claudeProxy.isPending}>
              {claudeProxy.isPending ? <><RefreshCw size={14} className="mr-2 animate-spin" />Mengubah...</> : "Ubah Format"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rewriteOpen} onOpenChange={setRewriteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bangkitkan Naskah Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={rewriteTone} onValueChange={setRewriteTone}>
              <SelectTrigger data-testid="select-rewrite-tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="w-full" data-testid="button-confirm-rewrite" onClick={rewrite} disabled={claudeProxy.isPending}>
              {claudeProxy.isPending ? <><RefreshCw size={14} className="mr-2 animate-spin" />Menulis ulang...</> : "Tulis Ulang"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
