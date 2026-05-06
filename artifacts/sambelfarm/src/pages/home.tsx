import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useNotionQuery } from "@workspace/api-client-react";
import { getConfig } from "@/lib/config";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, FileText, Edit3, Calendar, LogOut, Leaf } from "lucide-react";

interface NotionPage {
  id: string;
  properties: Record<string, { title?: Array<{ plain_text: string }>; select?: { name: string }; rich_text?: Array<{ plain_text: string }>; date?: { start: string } }>;
}

function statusColor(status: string) {
  if (status === "Final" || status === "Dipublikasi") return "bg-primary/10 text-primary border-primary/20";
  if (status === "Terjadwal") return "bg-accent/10 text-accent border-accent/20";
  return "bg-muted text-muted-foreground border-border";
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const config = getConfig();
  const notionQuery = useNotionQuery();
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!config.dbId) { setLoaded(true); return; }
    notionQuery.mutate(
      { data: { database_id: config.dbId, page_size: 6, sorts: [{ timestamp: "last_edited_time", direction: "descending" } as unknown as Record<string, string>] } },
      {
        onSuccess: (data) => {
          setPages((data as unknown as { results: NotionPage[] }).results ?? []);
          setLoaded(true);
        },
        onError: () => setLoaded(true),
      }
    );
  }, [config.dbId]);

  const quickActions = [
    { label: "Brainstorm Ide", icon: Lightbulb, path: "/brainstorm", desc: "5 ide konten baru" },
    { label: "Buat Script", icon: FileText, path: "/generator", desc: "Generate naskah" },
    { label: "Editor", icon: Edit3, path: "/editor", desc: "Edit & analisis" },
    { label: "Kalender", icon: Calendar, path: "/calendar", desc: "Jadwal konten" },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between pt-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Leaf size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Selamat datang</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Sambelfarm Content Lab</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-logout"
          onClick={() => { logout(); setLocation("/login"); }}
          className="text-muted-foreground"
        >
          <LogOut size={18} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {quickActions.map(({ label, icon: Icon, path, desc }) => (
          <button
            key={path}
            data-testid={`quick-action-${label.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => setLocation(path)}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
              <Icon size={18} className="text-primary" />
            </div>
            <div className="font-semibold text-sm text-foreground">{label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Script Terbaru</h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => setLocation("/editor")}>
            Lihat semua
          </Button>
        </div>

        {!config.dbId ? (
          <div className="bg-muted/50 rounded-2xl p-5 text-center">
            <p className="text-sm text-muted-foreground">Hubungkan Notion di Pengaturan untuk melihat history script.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setLocation("/settings")}>
              Buka Pengaturan
            </Button>
          </div>
        ) : !loaded ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : pages.length === 0 ? (
          <div className="bg-muted/50 rounded-2xl p-5 text-center">
            <p className="text-sm text-muted-foreground">Belum ada script tersimpan di Notion.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pages.map((page) => {
              const titleArr = page.properties?.Judul?.title ?? page.properties?.Name?.title ?? [];
              const title = titleArr[0]?.plain_text ?? "Tanpa Judul";
              const tone = page.properties?.Tone?.select?.name ?? "";
              const status = page.properties?.Status?.select?.name ?? "Draft";
              const topik = page.properties?.Topik?.rich_text?.[0]?.plain_text ?? "";
              return (
                <div
                  key={page.id}
                  data-testid={`script-card-${page.id}`}
                  className="bg-card border border-border rounded-xl p-3.5 flex items-start gap-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{title}</div>
                    {topik && <div className="text-xs text-muted-foreground mt-0.5 truncate">{topik}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {tone && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{tone}</Badge>}
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusColor(status)}`}>{status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
