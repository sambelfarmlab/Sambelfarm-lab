import { useEffect } from "react";
import { useLocation } from "wouter";
import { useClaudeProxy } from "@workspace/api-client-react";
import { addTokenUsage } from "@/lib/token-usage";
import { getConfig } from "@/lib/config";
import { useDraft } from "@/lib/draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Sparkles, RefreshCw } from "lucide-react";

const PLATFORMS = ["TikTok", "Instagram Reels", "Instagram Stories", "Instagram Feed", "YouTube Shorts", "YouTube"];

const JENIS_KONTEN = [
  { value: "Reels", label: "Reels / Short Video" },
  { value: "Stories", label: "Stories" },
  { value: "Feed Post", label: "Feed Post" },
  { value: "Carousel", label: "Carousel" },
  { value: "Tutorial", label: "Tutorial" },
  { value: "Behind the Scenes", label: "Behind the Scenes" },
];

const TONES = [
  { value: "Storytelling", label: "Storytelling — cerita yang mengalir" },
  { value: "Edukatif", label: "Edukatif — informatif dan jelas" },
  { value: "Promosi", label: "Promosi — persuasif dan menarik" },
  { value: "Nyeleneh", label: "Nyeleneh — unik dan mengejutkan" },
  { value: "Roasting", label: "Roasting — kritis dan humoris" },
];

export default function GeneratorPage() {
  const { draft, setDraft } = useDraft();
  const claudeProxy = useClaudeProxy();
  const { toast } = useToast();
  const config = getConfig();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const updates: Partial<typeof draft> = {};
    if (!draft.jenisKonten) updates.jenisKonten = "Reels";
    if (!draft.tone) updates.tone = "Storytelling";
    if (!draft.platform) updates.platform = "TikTok";
    
    if (Object.keys(updates).length > 0) {
      setDraft(updates);
    }
  }, [draft.jenisKonten, draft.tone, draft.platform, setDraft]);

  const generate = () => {
    if (!draft.topik.trim()) {
      toast({ title: "Topik wajib diisi", variant: "destructive" });
      return;
    }

    const systemPrompt = `Kamu adalah ahli strategi konten dan penulis naskah video pendek yang berfokus pada edukasi pertanian, khususnya budidaya cabai, untuk audiens 'Sambelers'. Kamu harus membuat skrip yang sangat informatif, praktis, dan menarik, dengan gaya bahasa yang autentik dan mudah dipahami oleh petani muda dan penggemar cabai.

${config.dnaStyle ? `DNA Brand: ${config.dnaStyle}` : ""}

Gaya penulisan:
- Natural, seperti berbicara langsung ke kamera
- Kata-kata yang mudah diucapkan
- Ritme yang enak diikuti
- Bahasa Indonesia yang dekat dengan keseharian`;

    const prompt = `Buat script ${draft.jenisKonten} untuk platform ${draft.platform} dengan tone "${draft.tone}" yang berfokus pada edukasi pertanian cabai. Pastikan kontennya memberikan nilai tambah bagi 'Sambelers' (petani atau penggemar cabai).

Topik: ${draft.topik}
${draft.judul ? `Judul: ${draft.judul}` : ""}
${draft.konsep ? `Konsep/POV: ${draft.konsep}` : ""}
${draft.inputTambahan ? `Catatan tambahan: ${draft.inputTambahan}` : ""}

Struktur script:
1. HOOK (3-5 detik pertama — wajib bikin penonton berhenti scroll dengan fakta menarik atau pertanyaan relevan seputar cabai)
2. BODY (konten utama — informatif, mengalir, sertakan tips praktis, data singkat, atau langkah-langkah budidaya cabai yang mudah diikuti)
3. CTA (ajakan yang natural, tidak memaksa, bisa berupa ajakan untuk mencoba tips, bertanya di kolom komentar, atau mengikuti akun untuk info lebih lanjut)

${draft.jenisKonten === "Carousel" ? "Format sebagai SLIDE 1:, SLIDE 2:, dst." : "Format sebagai narasi yang mengalir."}
${draft.jenisKonten === "Stories" ? "Setiap bagian untuk 1 stories (max 15 detik). Gunakan format: STORIES 1:, STORIES 2: dst." : ""}

Tambahkan di bagian bawah:
- Estimasi durasi / jumlah slide
- 3-5 hashtag rekomendasi
- Saran visual/B-roll singkat

${config.customPrompt ? `Instruksi khusus: ${config.customPrompt}` : ""}`;

    claudeProxy.mutate(
      { data: { system: systemPrompt, prompt, model: config.aiModel } },
      {
        onSuccess: (data) => {
          const d = data as typeof data & { usage?: { input_tokens: number; output_tokens: number } };
          if (d.usage) addTokenUsage(d.usage.input_tokens, d.usage.output_tokens);
          setDraft({ script: data.result });
          setLocation("/editor");
        },
        onError: () => {
          toast({ title: "Gagal generate script", description: "Coba lagi beberapa saat.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="p-4 space-y-5 pb-8">
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-0.5">
          <FileText size={16} className="text-primary" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Generator</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Buat Script</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Isi detail konten, lalu generate naskah</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="topik">
            Topik <span className="text-accent">*</span>
          </Label>
          <Input
            id="topik"
            data-testid="input-topik"
            value={draft.topik}
            onChange={(e) => setDraft({ topik: e.target.value })}
            placeholder="Contoh: cara membuat sambal bawang goreng..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="judul">Judul Konten</Label>
          <Input
            id="judul"
            data-testid="input-judul"
            value={draft.judul}
            onChange={(e) => setDraft({ judul: e.target.value })}
            placeholder="Judul yang catchy (opsional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="konsep">Konsep / POV</Label>
          <Textarea
            id="konsep"
            data-testid="textarea-konsep"
            value={draft.konsep}
            onChange={(e) => setDraft({ konsep: e.target.value })}
            placeholder="Sudut pandang atau konsep unik yang ingin disampaikan..."
            className="min-h-20 text-sm resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>Platform</Label>
          <Select value={draft.platform} onValueChange={(v) => setDraft({ platform: v })}>
            <SelectTrigger data-testid="select-platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Jenis Konten</Label>
            <Select value={draft.jenisKonten} onValueChange={(v) => setDraft({ jenisKonten: v })}>
              <SelectTrigger data-testid="select-jenis-konten">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JENIS_KONTEN.map((j) => (
                  <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={draft.tone} onValueChange={(v) => setDraft({ tone: v })}>
              <SelectTrigger data-testid="select-tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inputTambahan">Input Tambahan</Label>
          <Textarea
            id="inputTambahan"
            data-testid="textarea-input-tambahan"
            value={draft.inputTambahan}
            onChange={(e) => setDraft({ inputTambahan: e.target.value })}
            placeholder="Info tambahan: lokasi, produk spesifik, poin utama yang harus disampaikan..."
            className="min-h-20 text-sm resize-none"
          />
        </div>

        <Button
          data-testid="button-generate-script"
          onClick={generate}
          disabled={claudeProxy.isPending || !draft.topik.trim()}
          className="w-full mt-2"
          size="lg"
        >
          {claudeProxy.isPending ? (
            <><RefreshCw size={16} className="mr-2 animate-spin" /> Sedang membuat script...</>
          ) : (
            <><Sparkles size={16} className="mr-2" /> Generate Script</>
          )}
        </Button>

        {claudeProxy.isPending && (
          <div className="space-y-2 pt-1 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 bg-muted rounded" style={{ width: `${55 + i * 10}%` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
