import { useState } from "react";
import { useClaudeProxy } from "@workspace/api-client-react";
import { getConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Sparkles, RefreshCw, Copy, Check } from "lucide-react";

const JENIS_KONTEN = [
  { value: "Reels", label: "Reels / TikTok" },
  { value: "Stories", label: "Stories" },
  { value: "Feed Post", label: "Feed Post" },
  { value: "Carousel", label: "Carousel" },
];

const TONES = [
  { value: "Storytelling", label: "Storytelling — cerita yang mengalir" },
  { value: "Edukatif", label: "Edukatif — informatif dan jelas" },
  { value: "Promosi", label: "Promosi — persuasif dan menarik" },
  { value: "Nyeleneh", label: "Nyeleneh — unik dan mengejutkan" },
  { value: "Roasting", label: "Roasting — kritis dan humoris" },
];

export default function GeneratorPage() {
  const [topik, setTopik] = useState("");
  const [jenisKonten, setJenisKonten] = useState("Reels");
  const [tone, setTone] = useState("Storytelling");
  const [script, setScript] = useState("");
  const [copied, setCopied] = useState(false);
  const claudeProxy = useClaudeProxy();
  const { toast } = useToast();
  const config = getConfig();

  const generate = () => {
    if (!topik.trim()) return;

    const systemPrompt = `Kamu adalah penulis naskah konten pertanian dan kuliner Indonesia kelas dunia. Kamu ahli membuat script viral yang autentik dan engaging untuk brand Sambelfarm.

${config.dnaStyle ? `DNA Brand: ${config.dnaStyle}` : ""}

Gaya penulisan:
- Natural, seperti berbicara langsung ke kamera
- Kata-kata yang mudah diucapkan
- Ritme yang enak diikuti
- Bahasa Indonesia yang dekat dengan keseharian`;

    const prompt = `Buat script ${jenisKonten} dengan tone "${tone}" untuk topik: "${topik}"

Struktur script:
1. HOOK (3-5 detik pertama — wajib bikin penonton berhenti scroll)
2. BODY (konten utama — informatif, mengalir)
3. CTA (ajakan yang natural, tidak memaksa)

${jenisKonten === "Carousel" ? "Format sebagai slide 1, slide 2, dst." : "Format sebagai narasi yang mengalir."}
${jenisKonten === "Stories" ? "Setiap bagian untuk 1 stories (max 15 detik). Gunakan format: STORIES 1:, STORIES 2: dst." : ""}

Tambahkan:
- Estimasi durasi/jumlah slide
- 3-5 hashtag rekomendasi
- Saran visual/B-roll

${config.customPrompt ? `Instruksi khusus: ${config.customPrompt}` : ""}`;

    claudeProxy.mutate(
      { data: { system: systemPrompt, prompt, model: config.aiModel } },
      {
        onSuccess: (data) => {
          setScript(data.result);
        },
        onError: () => {
          toast({ title: "Gagal generate script", description: "Coba lagi beberapa saat.", variant: "destructive" });
        },
      }
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 space-y-5">
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-0.5">
          <FileText size={16} className="text-primary" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Generator</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Buat Script</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Generate naskah konten siap pakai</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="topik">Topik Konten</Label>
          <Input
            id="topik"
            data-testid="input-topik"
            value={topik}
            onChange={(e) => setTopik(e.target.value)}
            placeholder="Contoh: cara membuat sambal bawang goreng..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Jenis Konten</Label>
            <Select value={jenisKonten} onValueChange={setJenisKonten}>
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
            <Select value={tone} onValueChange={setTone}>
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

        <Button
          data-testid="button-generate-script"
          onClick={generate}
          disabled={claudeProxy.isPending || !topik.trim()}
          className="w-full"
        >
          {claudeProxy.isPending ? (
            <><RefreshCw size={16} className="mr-2 animate-spin" /> Sedang membuat...</>
          ) : (
            <><Sparkles size={16} className="mr-2" /> Generate Script</>
          )}
        </Button>
      </div>

      {claudeProxy.isPending && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-muted rounded" style={{ width: `${60 + i * 8}%` }} />
          ))}
        </div>
      )}

      {!claudeProxy.isPending && script && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Script Generated</span>
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-copy-script"
              onClick={handleCopy}
              className="h-7 text-xs gap-1.5"
            >
              {copied ? <><Check size={13} /> Disalin</> : <><Copy size={13} /> Salin</>}
            </Button>
          </div>
          <Textarea
            data-testid="textarea-script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="min-h-64 text-sm font-mono resize-none"
          />
        </div>
      )}
    </div>
  );
}
