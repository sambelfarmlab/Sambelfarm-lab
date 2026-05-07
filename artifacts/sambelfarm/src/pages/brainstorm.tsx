import { useState } from "react";
import { useLocation } from "wouter";
import { useClaudeProxy } from "@workspace/api-client-react";
import { getConfig } from "@/lib/config";
import { useDraft } from "@/lib/draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface Idea {
  judul: string;
  hook: string;
  angle: string;
}

export default function BrainstormPage() {
  const [keyword, setKeyword] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [rawResult, setRawResult] = useState("");
  const claudeProxy = useClaudeProxy();
  const { toast } = useToast();
  const config = getConfig();
  const { setDraft } = useDraft();
  const [, setLocation] = useLocation();

  const generate = () => {
    if (!keyword.trim()) return;

    const systemPrompt = `Kamu adalah kreator konten pertanian dan kuliner Indonesia yang berpengalaman membuat konten viral di TikTok dan Instagram Reels. ${config.dnaStyle ? `Gaya: ${config.dnaStyle}` : ""}`;

    const prompt = `Berikan 5 ide konten menarik dan berpotensi viral untuk keyword: "${keyword}"

Untuk setiap ide, berikan:
1. Judul yang catchy (max 60 karakter)
2. Hook pembuka (kalimat pertama yang bikin orang berhenti scroll)
3. Angle/sudut pandang unik

Format respons sebagai JSON array:
[
  {
    "judul": "...",
    "hook": "...",
    "angle": "..."
  }
]

Pastikan semua dalam Bahasa Indonesia yang natural dan engaging.${config.customPrompt ? `\n\nInstruksi tambahan: ${config.customPrompt}` : ""}`;

    claudeProxy.mutate(
      { data: { system: systemPrompt, prompt, model: config.aiModel } },
      {
        onSuccess: (data) => {
          setRawResult(data.result);
          try {
            const match = data.result.match(/\[[\s\S]*\]/);
            if (match) {
              const parsed = JSON.parse(match[0]) as Idea[];
              setIdeas(parsed);
            } else {
              setIdeas([]);
            }
          } catch {
            setIdeas([]);
          }
        },
        onError: () => {
          toast({ title: "Gagal generate ide", description: "Coba lagi beberapa saat.", variant: "destructive" });
        },
      }
    );
  };

  const selectIdea = (idea: Idea) => {
    setDraft({
      topik: keyword,
      judul: idea.judul,
      konsep: idea.angle,
      inputTambahan: `Hook: ${idea.hook}`,
    });
    setLocation("/generator");
  };

  return (
    <div className="p-4 space-y-5">
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-0.5">
          <Lightbulb size={16} className="text-primary" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Brainstorm</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Ide Konten</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Masukkan keyword, dapatkan 5 ide konten</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="keyword">Keyword / Topik</Label>
          <Input
            id="keyword"
            data-testid="input-keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Contoh: sambal bawang, panen cabai, tips berkebun..."
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
        </div>

        <Button
          data-testid="button-generate-ideas"
          onClick={generate}
          disabled={claudeProxy.isPending || !keyword.trim()}
          className="w-full"
        >
          {claudeProxy.isPending ? (
            <><RefreshCw size={16} className="mr-2 animate-spin" /> Sedang membuat...</>
          ) : (
            <><Sparkles size={16} className="mr-2" /> Generate 5 Ide</>
          )}
        </Button>
      </div>

      {claudeProxy.isPending && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full mb-1.5" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {!claudeProxy.isPending && ideas.length > 0 && (
        <motion.div 
          className="space-y-3"
          initial="hidden"
          animate="show"
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
          <p className="text-xs text-muted-foreground">Klik ide untuk langsung buat script →</p>
          {ideas.map((idea, i) => (
            <motion.button
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              data-testid={`idea-card-${i}`}
              onClick={() => selectIdea(idea)}
              className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/50 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-2 mb-2">
                <Badge className="shrink-0 bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 h-5">
                  Ide {i + 1}
                </Badge>
                <h3 className="font-semibold text-sm text-foreground leading-snug flex-1">{idea.judul}</h3>
                <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">Hook</span>
                  <p className="text-sm text-foreground mt-0.5">&ldquo;{idea.hook}&rdquo;</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Angle</span>
                  <p className="text-sm text-muted-foreground mt-0.5">{idea.angle}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      {!claudeProxy.isPending && ideas.length === 0 && rawResult && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{rawResult}</pre>
        </div>
      )}
    </div>
  );
}
