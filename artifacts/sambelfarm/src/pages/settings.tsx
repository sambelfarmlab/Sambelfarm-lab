import { useState, useEffect, useCallback } from "react";
import { getConfig, saveConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Settings, Save, Check, Cpu, FileType, MessageSquare,
  Wifi, WifiOff, RefreshCw, Database, Bot, Zap,
} from "lucide-react";
import { loadUsage, resetUsage as resetUsageLib, formatTokenCount, type TokenUsage } from "@/lib/token-usage";

const AI_MODELS = [
  { value: "claude-opus-4-7", label: "Claude Opus 4.7 — Terbaik, paling kreatif" },
  { value: "claude-opus-4-6", label: "Claude Opus 4.6 — Sangat baik" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 — Seimbang (default)" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5 — Cepat & ringan" },
];

interface ConnectionStatus {
  claude: { connected: boolean };
  notion: { connected: boolean; workspace: string | null };
}

function StatusBadge({ connected, loading }: { connected: boolean | null; loading: boolean }) {
  if (loading) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <RefreshCw size={11} className="animate-spin" /> Mengecek...
      </span>
    );
  }
  if (connected === null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return connected ? (
    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
      <Wifi size={11} /> Terhubung
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs font-medium text-destructive">
      <WifiOff size={11} /> Tidak terhubung
    </span>
  );
}

export default function SettingsPage() {
  const initial = getConfig();
  const [dnaStyle, setDnaStyle] = useState(initial.dnaStyle);
  const [customPrompt, setCustomPrompt] = useState(initial.customPrompt);
  const [aiModel, setAiModel] = useState(initial.aiModel);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const [statusLoading, setStatusLoading] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [usage, setUsage] = useState<TokenUsage>(loadUsage());

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const token = localStorage.getItem("sf_auth_token");
      const res = await fetch("/api/status", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as ConnectionStatus;
      setStatus(data);
    } catch {
      setStatus({ claude: { connected: false }, notion: { connected: false, workspace: null } });
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const refreshUsage = () => setUsage(loadUsage());

  const resetUsage = () => {
    resetUsageLib();
    setUsage({ input_tokens: 0, output_tokens: 0, requests: 0 });
    toast({ title: "Statistik token direset" });
  };

  const handleSave = () => {
    saveConfig({ dnaStyle, customPrompt, aiModel });
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

        {/* Connection Status */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <div className="flex items-center gap-2">
              <Wifi size={14} className="text-muted-foreground" />
              <span className="text-sm font-semibold">Status Koneksi</span>
            </div>
            <button
              onClick={fetchStatus}
              disabled={statusLoading}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={11} className={statusLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Claude */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Bot size={14} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Claude AI</p>
                  <p className="text-xs text-muted-foreground">Anthropic API</p>
                </div>
              </div>
              <StatusBadge
                connected={status ? status.claude.connected : null}
                loading={statusLoading}
              />
            </div>

            {/* Notion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Database size={14} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Notion</p>
                  <p className="text-xs text-muted-foreground">
                    {status?.notion.workspace
                      ? status.notion.workspace
                      : "Database konten"}
                  </p>
                </div>
              </div>
              <StatusBadge
                connected={status ? status.notion.connected : null}
                loading={statusLoading}
              />
            </div>
          </div>
        </div>

        {/* Token Usage */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-muted-foreground" />
              <span className="text-sm font-semibold">Penggunaan Token Claude</span>
            </div>
            <button
              onClick={refreshUsage}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={11} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{usage.requests}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Request</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{formatTokenCount(usage.input_tokens)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Token Input</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{formatTokenCount(usage.output_tokens)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Token Output</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Total token: {formatTokenCount(usage.input_tokens + usage.output_tokens)} — disimpan di perangkat ini.
          </p>

          <Button variant="outline" size="sm" onClick={resetUsage} className="w-full text-xs h-8">
            Reset Statistik
          </Button>
        </div>

        {/* AI Model */}
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

        {/* DNA Style */}
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

        {/* Custom Prompt */}
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
