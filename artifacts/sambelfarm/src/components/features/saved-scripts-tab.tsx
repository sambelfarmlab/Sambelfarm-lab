import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SavedScriptCard } from "@/components/features/saved-script-card";
import { type NotionPage, getRichText, getTitle, getSelect } from "@/lib/notion-helpers";
import { PLATFORMS, JENIS_KONTEN, TONES } from "@/components/features/content-detail-form";
import { useClaudeProxy } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useDraft } from "@/lib/draft";

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

interface Props {
  pages: NotionPage[];
  loaded: boolean;
  onRefresh: () => void;
  onEdit: (page: NotionPage) => void;
  onDelete: (page: NotionPage) => void;
  onDateChange: (page: NotionPage, date: string) => void;
  onToneChange: (pageId: string, tone: string) => void;
  onDownload: (page: NotionPage) => void;
  onAIUpdate: (pageId: string, patch: Partial<import("@/lib/draft").Draft>) => void;
}

export function SavedScriptsTab({ pages, loaded, onRefresh, onEdit, onDelete, onDateChange, onToneChange, onDownload, onAIUpdate }: Props) {
  const [filterTone, setFilterTone] = useState("all");
  const swipeableRefs = useRef<Array<{ reset: () => void } | null>>([]);
  const claudeProxy = useClaudeProxy();
  const { toast } = useToast();
  const { setDraft } = useDraft();

  const [adaptOpen, setAdaptOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<NotionPage | null>(null);
  const [adaptPlatform, setAdaptPlatform] = useState("TikTok");
  const [adaptJenis, setAdaptJenis] = useState("Reels");
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewriteTone, setRewriteTone] = useState("Edukatif");
  const [changeToneOpen, setChangeToneOpen] = useState(false);
  const [pageForTone, setPageForTone] = useState<NotionPage | null>(null);
  const [aiWorking, setAiWorking] = useState(false);

  const filteredPages = useMemo(() => {
    if (filterTone === "all") return pages;
    return pages.filter((p) => getSelect(p, "Tone") === filterTone);
  }, [pages, filterTone]);

  const handleAdapt = async () => {
    if (!selectedPage) return;
    setAiWorking(true);
    try {
      const script = getRichText(selectedPage, "Script");
      const res = await claudeProxy.mutateAsync({
        data: {
          prompt: `Adaptasi script ini ke platform ${adaptPlatform} dan jenis konten ${adaptJenis}: ${script}`,
          system: "Kamu adalah ahli adaptasi konten short-form.",
        },
      });
      const result = JSON.parse(res as string) as { script?: string; analisis_ai?: string; rekomendasi?: string; skor_viralitas?: number; trigger?: number; resonance?: number; impact?: number; behavior?: number; engagement?: number; caption_tiktok?: string; caption_instagram?: string; caption_yt_shorts?: string };
      const patch = {
        script: result.script ?? script,
        analisisAI: result.analisis_ai ?? "",
        rekomendasi: result.rekomendasi ?? "",
        skorViralitas: result.skor_viralitas ?? null,
        tribeTrigger: result.trigger ?? 0,
        tribeResonance: result.resonance ?? 0,
        tribeImpact: result.impact ?? 0,
        tribeBehavior: result.behavior ?? 0,
        tribeEngagement: result.engagement ?? 0,
        captionTikTok: result.caption_tiktok ?? "",
        captionInstagram: result.caption_instagram ?? "",
        captionYTShorts: result.caption_yt_shorts ?? "",
      };
      onAIUpdate(selectedPage.id, patch);
      setDraft(patch);
      setAdaptOpen(false);
      toast({ title: "Script berhasil diadaptasi" });
    } catch {
      toast({ title: "Gagal mengadaptasi script", variant: "destructive" });
    } finally {
      setAiWorking(false);
    }
  };

  const handleRewrite = async () => {
    if (!selectedPage) return;
    setAiWorking(true);
    try {
      const script = getRichText(selectedPage, "Script");
      const res = await claudeProxy.mutateAsync({
        data: {
          prompt: `Tulis ulang script ini dengan tone ${rewriteTone}: ${script}`,
          system: "Kamu adalah copywriter konten pendek.",
        },
      });
      const result = JSON.parse(res as string) as { script?: string };
      const patch = { script: result.script ?? script };
      onAIUpdate(selectedPage.id, patch);
      setDraft(patch);
      setRewriteOpen(false);
      toast({ title: "Script berhasil ditulis ulang" });
    } catch {
      toast({ title: "Gagal menulis ulang script", variant: "destructive" });
    } finally {
      setAiWorking(false);
    }
  };

  return (
    <div className="space-y-3 pb-4">
      <div className="flex gap-2">
        <Select value={filterTone} onValueChange={setFilterTone}>
          <SelectTrigger className="flex-1 h-9 text-sm" data-testid="select-filter-tone">
            <SelectValue placeholder="Filter Tone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tone</SelectItem>
            {TONES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" data-testid="button-refresh-notion" onClick={onRefresh}>
          <RotateCcw size={14} />
        </Button>
      </div>

      {!loaded ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
      ) : filteredPages.length === 0 ? (
        <div className="bg-muted/50 rounded-2xl p-8 text-center">
          <BookOpen size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">{filterTone === "all" ? "Belum ada script tersimpan" : `Tidak ada script dengan tone ${filterTone}`}</p>
          <p className="text-xs text-muted-foreground mt-1">{filterTone === "all" ? "Buat dan simpan script pertamamu dari halaman Editor." : "Coba ubah filter tone."}</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div className="space-y-3" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={listVariants}>
            {filteredPages.map((page, index) => (
              <SavedScriptCard
                key={page.id}
                page={page}
                swipeRef={(el) => { swipeableRefs.current[index] = el; }}
                onEdit={onEdit}
                onAdapt={(p) => { setSelectedPage(p); setAdaptPlatform(getSelect(p, "Platform") || "TikTok"); setAdaptOpen(true); }}
                onRewrite={(p) => { setSelectedPage(p); setRewriteOpen(true); }}
                onDelete={onDelete}
                onChangeTone={(p) => { setPageForTone(p); setChangeToneOpen(true); }}
                onDownload={onDownload}
                onDateChange={onDateChange}
              />
            ))}
            <p className="text-[10px] text-muted-foreground text-center mt-1">Geser kartu ke Kiri (Hapus) &amp; Kanan (Ganti Tone/Download)</p>
          </motion.div>
        </AnimatePresence>
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
            <Button className="w-full" data-testid="button-confirm-adapt" onClick={handleAdapt} disabled={aiWorking}>{aiWorking ? "Mengadaptasi..." : "Adaptasi Script"}</Button>
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
            <Button className="w-full" data-testid="button-confirm-rewrite" onClick={handleRewrite} disabled={aiWorking}>{aiWorking ? "Menulis ulang..." : "Tulis Ulang Script"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={changeToneOpen} onOpenChange={setChangeToneOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ganti Tone</DialogTitle></DialogHeader>
          {pageForTone && <p className="text-xs text-muted-foreground -mt-2 truncate">{getRichText(pageForTone, "Judul") || getTitle(pageForTone) || "Script"}</p>}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {TONES.map((t) => (
              <Button key={t} variant={pageForTone && getSelect(pageForTone, "Tone") === t ? "default" : "outline"} className="h-11" onClick={() => { if (!pageForTone) return; onToneChange(pageForTone.id, t); setChangeToneOpen(false); }}>
                {t}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
