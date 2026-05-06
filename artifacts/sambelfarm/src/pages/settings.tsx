import { useState } from "react";
import { getConfig, saveConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Check, Database, Cpu, FileType, MessageSquare } from "lucide-react";

const AI_MODELS = [
  { value: "claude-opus-4-7", label: "Claude Opus 4.7 — Terbaik, paling kreatif" },
  { value: "claude-opus-4-6", label: "Claude Opus 4.6 — Sangat baik" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 — Seimbang (default)" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5 — Cepat & ringan" },
];

export default function SettingsPage() {
  const initial = getConfig();
  const [dbId, setDbId] = useState(initial.dbId);
  const [dnaStyle, setDnaStyle] = useState(initial.dnaStyle);
  const [customPrompt, setCustomPrompt] = useState(initial.customPrompt);
  const [aiModel, setAiModel] = useState(initial.aiModel);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    saveConfig({ dbId, dnaStyle, customPrompt, aiModel });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast({ title: "Pengaturan disimpan" });
  };

  return (
    <div className="p-4 space-y-5 pb-8">
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-0.5">
          <Settings size={16} className="text-primary" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pengaturan</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Konfigurasi</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Sesuaikan Content Lab dengan kebutuhan Sambelfarm</p>
      </div>

      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-border">
            <Database size={14} className="text-muted-foreground" />
            <span className="text-sm font-semibold">Notion</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dbId">Database ID</Label>
            <Input
              id="dbId"
              data-testid="input-notion-db-id"
              value={dbId}
              onChange={(e) => setDbId(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Temukan di URL database Notion kamu. Format: 32 karakter hex.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-border">
            <Cpu size={14} className="text-muted-foreground" />
            <span className="text-sm font-semibold">AI Model</span>
          </div>
          <div className="space-y-2">
            <Label>Model Claude</Label>
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger data-testid="select-ai-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-border">
            <FileType size={14} className="text-muted-foreground" />
            <span className="text-sm font-semibold">DNA Style Brand</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dnaStyle">Gaya Penulisan Sambelfarm</Label>
            <Textarea
              id="dnaStyle"
              data-testid="textarea-dna-style"
              value={dnaStyle}
              onChange={(e) => setDnaStyle(e.target.value)}
              placeholder="Deskripsikan gaya penulisan brand kamu. Contoh: Natural, dekat dengan petani, pakai analogi keseharian, selalu ada unsur edukasi..."
              className="min-h-28 text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground">
              DNA ini akan dikirim ke Claude sebagai konteks brand di setiap request.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-border">
            <MessageSquare size={14} className="text-muted-foreground" />
            <span className="text-sm font-semibold">Custom Prompt</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customPrompt">Instruksi Tambahan</Label>
            <Textarea
              id="customPrompt"
              data-testid="textarea-custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Tambahkan instruksi khusus yang selalu digunakan. Contoh: Selalu tambahkan hashtag #sambelfarm. Hindari kata 'viral'. Format harga dalam rupiah..."
              className="min-h-24 text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Prompt ini akan ditambahkan di akhir setiap request ke Claude.
            </p>
          </div>
        </div>
      </div>

      <Button
        data-testid="button-save-settings"
        onClick={handleSave}
        className="w-full"
      >
        {saved ? (
          <><Check size={16} className="mr-2" /> Tersimpan</>
        ) : (
          <><Save size={16} className="mr-2" /> Simpan Pengaturan</>
        )}
      </Button>
    </div>
  );
}
