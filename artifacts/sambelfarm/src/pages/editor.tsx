import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useNotionCreatePage, useNotionUpdatePage, useClaudeProxy } from "@workspace/api-client-react";
import { addTokenUsage } from "@/lib/token-usage";
import { useDraft } from "@/lib/draft";
import { Button } from "@/components/ui/button";
import { Edit3, BookOpen, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContentDetailForm } from "@/components/features/content-detail-form";
import { TribeAnalysisPanel } from "@/components/features/tribe-analysis-panel";
import { SavedScriptsTab } from "@/components/features/saved-scripts-tab";
import { useSavedPages } from "@/hooks/use-saved-pages";
import { buildNotionProperties, pageToPartialDraft, getNumber } from "@/lib/notion-helpers";
import type { NotionPage } from "@/lib/notion-helpers";

function getInitialTab(): "editor" | "saved" {
  const params = new URLSearchParams(window.location.search);
  return params.get("tab") === "saved" ? "saved" : "editor";
}

function syncTabToUrl(tab: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  window.history.replaceState({}, "", url.toString());
}

export default function EditorPage() {
  const { draft, setDraft, resetDraft } = useDraft();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [tab, setTab] = useState<"editor" | "saved">(getInitialTab);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  const notionCreate = useNotionCreatePage();
  const notionUpdate = useNotionUpdatePage();
  const claudeProxy = useClaudeProxy();

  const { pages, loaded, fetchPages, handleDateChange, handleToneChange, handleDelete, handleDownloadPDF } = useSavedPages();

  useEffect(() => {
    if (tab === "saved") fetchPages(30);
  }, [tab, refreshKey, fetchPages]);

  const handleTabChange = useCallback((newTab: "editor" | "saved") => {
    setTab(newTab);
    syncTabToUrl(newTab);
  }, []);

  const analyzeTribe = async () => {
    if (!draft.script.trim()) return;
    setAnalyzing(true);
    try {
      const res = await claudeProxy.mutateAsync({
        data: {
          prompt: `Analisis script ini dengan framework TRIBE v2: ${draft.script}`,
          system: "Kamu adalah pakar viralitas konten.",
        },
      });
      const resData = res as typeof res & { usage?: { input_tokens: number; output_tokens: number } };
      if (resData.usage) addTokenUsage(resData.usage.input_tokens, resData.usage.output_tokens);
      const result = JSON.parse(res.result);
      setDraft({
        skorViralitas: result.skor_viralitas,
        analisisAI: result.analisis_ai,
        rekomendasi: result.rekomendasi,
        tribeTrigger: result.trigger,
        tribeResonance: result.resonance,
        tribeImpact: result.impact,
        tribeBehavior: result.behavior,
        tribeEngagement: result.engagement,
        captionTikTok: result.caption_tiktok,
        captionInstagram: result.caption_instagram,
        captionYTShorts: result.caption_yt_shorts,
      });
      setShowAnalysis(true);
      toast({ title: "Analisis selesai" });
    } catch {
      toast({ title: "Gagal menganalisis", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const saveToNotion = () => {
    if (!draft.script.trim()) return;
    setSaving(true);
    const properties = buildNotionProperties(draft);
    const onSuccess = () => {
      setSaving(false);
      toast({ title: editingPageId ? "Pembaruan berhasil" : "Berhasil disimpan" });
      if (!editingPageId) resetDraft();
      setEditingPageId(null);
      handleTabChange("saved");
      setRefreshKey((k) => k + 1);
    };
    const onError = () => {
      setSaving(false);
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    };

    if (editingPageId) {
      notionUpdate.mutate({ pageId: editingPageId, data: { properties } as Record<string, string> }, { onSuccess, onError });
    } else {
      notionCreate.mutate({ data: { parent: { database_id: "" }, properties } as Record<string, string> }, { onSuccess, onError });
    }
  };

  const handleEdit = (page: NotionPage) => {
    setEditingPageId(page.id);
    setDraft(pageToPartialDraft(page));
    setShowAnalysis(getNumber(page, "Skor Viralitas") !== null);
    handleTabChange("editor");
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sambelfarm Lab</h1>
          <p className="text-sm text-muted-foreground">AI Content Strategist &amp; Script Editor</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => setLocation("/")} className="rounded-full">
          <RotateCcw size={18} />
        </Button>
      </header>

      <div className="flex p-1 bg-muted/50 rounded-xl mb-6">
        {(["editor", "saved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "editor" ? <Edit3 size={16} /> : <BookOpen size={16} />}
            {t === "editor" ? "Editor" : "Tersimpan"}
          </button>
        ))}
      </div>

      {tab === "editor" && (
        <div className="space-y-4 pb-4">
          <ContentDetailForm
            draft={draft}
            onDraftChange={setDraft}
            analyzing={analyzing}
            saving={saving}
            onAnalyze={analyzeTribe}
            onSave={saveToNotion}
          />
          {showAnalysis && (
            <TribeAnalysisPanel draft={draft} open={showAnalysis} onToggle={() => setShowAnalysis((v) => !v)} />
          )}
        </div>
      )}

      {tab === "saved" && (
        <SavedScriptsTab
          pages={pages}
          loaded={loaded}
          onRefresh={() => setRefreshKey((k) => k + 1)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDateChange={handleDateChange}
          onToneChange={handleToneChange}
          onDownload={handleDownloadPDF}
          onAIUpdate={(pageId, patch) => setDraft(patch)}
        />
      )}
    </div>
  );
}
