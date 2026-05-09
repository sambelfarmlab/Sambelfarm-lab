import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/features/copy-button";
import { BarChart2, Save, RefreshCw } from "lucide-react";
import type { Draft } from "@/lib/draft";

const PLATFORMS = [
  "TikTok",
  "Instagram Reels",
  "Instagram Stories",
  "Instagram Feed",
  "YouTube Shorts",
  "YouTube",
];
const JENIS_KONTEN = [
  "Reels",
  "Stories",
  "Feed Post",
  "Carousel",
  "Tutorial",
  "Behind the Scenes",
];
const TONES = ["Storytelling", "Edukatif", "Promosi", "Nyeleneh", "Roasting"];

interface Props {
  draft: Draft;
  onDraftChange: (partial: Partial<Draft>) => void;
  analyzing: boolean;
  saving: boolean;
  onAnalyze: () => void;
  onSave: () => void;
}

/** Form for editing content metadata + script, with Analyze & Save actions. */
export function ContentDetailForm({
  draft,
  onDraftChange,
  analyzing,
  saving,
  onAnalyze,
  onSave,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Metadata fields */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Detail Konten
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Topik</Label>
            <Input
              data-testid="input-topik-editor"
              value={draft.topik}
              onChange={(e) => onDraftChange({ topik: e.target.value })}
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
              onChange={(e) => onDraftChange({ tanggal: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Judul Konten</Label>
          <Input
            data-testid="input-judul-editor"
            value={draft.judul}
            onChange={(e) => onDraftChange({ judul: e.target.value })}
            placeholder="Judul konten"
            className="h-9 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Platform</Label>
            <Select
              value={draft.platform}
              onValueChange={(v) => onDraftChange({ platform: v })}
            >
              <SelectTrigger className="h-9 text-sm" data-testid="select-platform-editor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Jenis</Label>
            <Select
              value={draft.jenisKonten}
              onValueChange={(v) => onDraftChange({ jenisKonten: v })}
            >
              <SelectTrigger className="h-9 text-sm" data-testid="select-jenis-editor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JENIS_KONTEN.map((j) => (
                  <SelectItem key={j} value={j}>{j}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tone</Label>
            <Select
              value={draft.tone}
              onValueChange={(v) => onDraftChange({ tone: v })}
            >
              <SelectTrigger className="h-9 text-sm" data-testid="select-tone-editor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Script textarea */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Naskah Script
          </p>
          <CopyButton text={draft.script} label="Script" />
        </div>
        <Textarea
          data-testid="editor-textarea"
          value={draft.script}
          onChange={(e) => onDraftChange({ script: e.target.value })}
          placeholder="Script kamu akan muncul di sini setelah di-generate..."
          className="min-h-56 text-sm resize-none font-mono"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          data-testid="button-analyze-tribe"
          variant="outline"
          onClick={onAnalyze}
          disabled={analyzing || !draft.script.trim()}
          className="flex-1 h-10 sm:h-9 text-xs sm:text-sm"
        >
          {analyzing ? (
            <>
              <RefreshCw size={14} className="mr-2 animate-spin" />
              Menganalisis...
            </>
          ) : (
            <>
              <BarChart2 size={14} className="mr-2" />
              Analisis TRIBE
            </>
          )}
        </Button>
        <Button
          data-testid="button-save-script"
          onClick={onSave}
          disabled={saving || !draft.script.trim()}
          className="flex-1 h-10 sm:h-9 text-xs sm:text-sm"
        >
          {saving ? (
            <>
              <RefreshCw size={14} className="mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save size={14} className="mr-2" />
              Simpan ke Notion
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export const STATUS_REVISI_OPTIONS = [
  "Draft",
  "Revisi",
  "Final",
  "Terjadwal",
  "Dipublikasi",
];

export { PLATFORMS, JENIS_KONTEN, TONES };
