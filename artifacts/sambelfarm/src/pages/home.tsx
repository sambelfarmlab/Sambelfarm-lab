import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useNotionQuery, useNotionUpdatePage, useNotionDeletePage } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SwipeableItem } from "@/components/swipeable-item";
import { downloadScriptPDF } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, FileText, Edit3, Calendar, LogOut, Leaf, FileDown, RefreshCw, Trash2, CalendarDays, CheckCircle2 } from "lucide-react";
import { useDraft } from "@/lib/draft";

interface NotionPage {
  id: string;
  properties: Record<string, {
    title?: Array<{ plain_text: string }>;
    select?: { name: string };
    rich_text?: Array<{ plain_text: string }>;
    date?: { start: string };
    number?: number;
  }>;
}

const STATUS_OPTIONS = ["Draft", "Terjadwal", "Final", "Dipublikasi"];

function statusColor(status: string) {
  if (status === "Final" || status === "Dipublikasi") return "bg-primary/10 text-primary border-primary/20";
  if (status === "Terjadwal") return "bg-accent/10 text-accent border-accent/20";
  return "bg-muted text-muted-foreground border-border";
}

function getTitle(page: NotionPage) { return page.properties?.Topik?.title?.[0]?.plain_text ?? ""; }
function getJudul(page: NotionPage) { return page.properties?.Judul?.rich_text?.[0]?.plain_text ?? ""; }
function getSelect(page: NotionPage, prop: string) { return page.properties?.[prop]?.select?.name ?? ""; }
function getDate(page: NotionPage, prop: string) { return page.properties?.[prop]?.date?.start ?? ""; }
function getRichText(page: NotionPage, prop: string) { return page.properties?.[prop]?.rich_text?.[0]?.plain_text ?? ""; }
function getNumber(page: NotionPage, prop: string): number | null {
  const v = page.properties?.[prop]?.number; return v !== undefined ? v : null;
}

function pageToPartialDraft(page: NotionPage) {
  return {
    topik: getTitle(page),
    judul: getJudul(page),
    platform: getSelect(page, "Platform") || "TikTok",
    jenisKonten: getSelect(page, "Jenis Konten") || "Reels",
    tone: getSelect(page, "Tone") || "Storytelling",
    tanggal: getDate(page, "Tanggal"),
    script: getRichText(page, "Script"),
    skorViralitas: getNumber(page, "Skor Viralitas"),
    analisisAI: getRichText(page, "Analisis AI"),
    rekomendasi: getRichText(page, "Rekomendasi"),
    captionTikTok: getRichText(page, "Caption TikTok"),
    captionInstagram: getRichText(page, "Caption Instagram"),
    captionYTShorts: getRichText(page, "Caption YT Shorts"),
    tribeTrigger: 0, tribeResonance: 0, tribeImpact: 0,
    tribeBehavior: 0, tribeEngagement: 0,
    inputTambahan: "", konsep: "",
  };
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try { return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function InlineDatePicker({ value, onSave }: { value: string; onSave: (d: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  if (editing) {
    return (
      <input
        type="date"
        value={val}
        autoFocus
        className="text-[10px] border border-primary/50 rounded px-1.5 bg-background h-5"
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { setEditing(false); if (val && val !== value) onSave(val); }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      onClick={(e) => { e.stopPropagation(); setEditing(true); setVal(value); }}
    >
      <CalendarDays size={9} />
      <span className={value ? "" : "italic"}>{value ? formatDate(value) : "Tambah tanggal"}</span>
    </button>
  );
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();
  const { setDraft } = useDraft();
  const notionQuery = useNotionQuery();
  const notionUpdate = useNotionUpdatePage();
  const notionDelete = useNotionDeletePage();
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [pageForStatus, setPageForStatus] = useState<NotionPage | null>(null);

  useEffect(() => {
    notionQuery.mutate(
      {
        data: {
          database_id: "",
          page_size: 20,
          sorts: [{ timestamp: "last_edited_time", direction: "descending" } as unknown as Record<string, string>],
        }
      },
      {
        onSuccess: (data) => {
          setPages((data as unknown as { results: NotionPage[] }).results ?? []);
          setLoaded(true);
        },
        onError: () => setLoaded(true),
      }
    );
  }, []);

  const updatePageLocal = (pageId: string, propKey: string, propValue: NotionPage["properties"][string]) => {
    setPages((prev) => prev.map((p) => p.id === pageId
      ? { ...p, properties: { ...p.properties, [propKey]: propValue } }
      : p
    ));
  };

  const handleDateChange = (page: NotionPage, newDate: string) => {
    updatePageLocal(page.id, "Tanggal", { date: { start: newDate } });
    notionUpdate.mutate(
      { pageId: page.id, data: { properties: { Tanggal: { date: { start: newDate } } } as Record<string, string> } },
      {
        onSuccess: () => toast({ title: "Tanggal diperbarui" }),
        onError: () => {
          toast({ title: "Gagal update tanggal", variant: "destructive" });
          updatePageLocal(page.id, "Tanggal", { date: { start: getDate(page, "Tanggal") } });
        },
      }
    );
  };

  const handleStatusChange = (newStatus: string) => {
    if (!pageForStatus) return;
    const pageId = pageForStatus.id;
    updatePageLocal(pageId, "Status Revisi", { select: { name: newStatus } });
    setChangeStatusOpen(false);
    notionUpdate.mutate(
      { pageId, data: { properties: { "Status Revisi": { select: { name: newStatus } } } as Record<string, string> } },
      {
        onSuccess: () => toast({ title: `Status diubah ke "${newStatus}"` }),
        onError: () => toast({ title: "Gagal update status", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (page: NotionPage) => {
    setPages((prev) => prev.filter((p) => p.id !== page.id));
    notionDelete.mutate(
      { pageId: page.id },
      {
        onSuccess: () => toast({ title: "Script dihapus" }),
        onError: () => {
          toast({ title: "Gagal menghapus", variant: "destructive" });
          setPages((prev) => [...prev, page].sort((a, b) => a.id.localeCompare(b.id)));
        },
      }
    );
  };

  const handlePublish = (page: NotionPage) => {
    // Optimistic UI: Update status langsung
    updatePageLocal(page.id, "Status Revisi", { select: { name: "Dipublikasi" } });
    
    // Kirim update ke Notion
    notionUpdate.mutate(
      { pageId: page.id, data: { properties: { "Status Revisi": { select: { name: "Dipublikasi" } } } as Record<string, string> } },
      {
        onSuccess: () => toast({ title: "Script dipublikasi!" }),
        onError: () => {
          toast({ title: "Gagal mempublikasi", variant: "destructive" });
          // Revert UI jika gagal
          updatePageLocal(page.id, "Status Revisi", { select: { name: getSelect(page, "Status Revisi") } });
        },
      }
    );
  };

  const handleDownloadPDF = (page: NotionPage) => {
    downloadScriptPDF({
      topik: getTitle(page),
      judul: getJudul(page),
      platform: getSelect(page, "Platform"),
      jenisKonten: getSelect(page, "Jenis Konten"),
      tone: getSelect(page, "Tone"),
      tanggal: getDate(page, "Tanggal"),
      statusRevisi: getSelect(page, "Status Revisi"),
      script: getRichText(page, "Script"),
      skorViralitas: page.properties?.["Skor Viralitas"]?.number ?? null,
    });
  };

  const filteredPages = filterStatus === "all"
    ? pages
    : pages.filter((p) => getSelect(p, "Status Revisi") === filterStatus);

  const displayPages = filteredPages.slice(0, 6);

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
          variant="ghost" size="icon" data-testid="button-logout"
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

        <div className="mb-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-xs w-44" data-testid="select-filter-status">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {!loaded ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : displayPages.length === 0 ? (
          <div className="bg-muted/50 rounded-2xl p-5 text-center">
            <p className="text-sm text-muted-foreground">
              {filterStatus === "all" ? "Belum ada script tersimpan di Notion." : `Tidak ada script dengan status "${filterStatus}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayPages.map((page) => {
              const topik = getTitle(page);
              const judul = getJudul(page);
              const title = judul || topik || "Tanpa Judul";
              const tone = getSelect(page, "Tone");
              const status = getSelect(page, "Status Revisi") || "Draft";
              const platform = getSelect(page, "Platform");
              const tanggal = getDate(page, "Tanggal");

              return (
                <SwipeableItem
                  key={page.id}
                  leftActions={[
                    {
                      label: "Publish",
                      icon: <CheckCircle2 size={18} />,
                      bgClass: "bg-green-500",
                      direction: "left",
                      onClick: () => handlePublish(page),
                    },
                  ]}
                  rightActions={[
                    {
                      label: "Download",
                      icon: <FileDown size={18} />,
                      bgClass: "bg-sky-500",
                      direction: "right",
                      onClick: () => handleDownloadPDF(page),
                    },
                    {
                      label: "Status",
                      icon: <RefreshCw size={18} />,
                      bgClass: "bg-amber-500",
                      direction: "right",
                      onClick: () => { setPageForStatus(page); setChangeStatusOpen(true); },
                    },
                    {
                      label: "Hapus",
                      icon: <Trash2 size={18} />,
                      bgClass: "bg-red-500",
                      direction: "right",
                      onClick: () => handleDelete(page),
                    },
                  ]}
                >
                  <div
                    data-testid={`script-card-${page.id}`}
                    className="bg-card border border-border rounded-xl p-3.5 flex items-start gap-3 hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setDraft(pageToPartialDraft(page));
                      setLocation("/editor");
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">{title}</div>
                      {topik && judul && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{topik}</div>
                      )}
                      <div className="mt-1.5">
                        <InlineDatePicker
                          value={tanggal}
                          onSave={(d) => handleDateChange(page, d)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {platform && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{platform}</Badge>}
                      {tone && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{tone}</Badge>}
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${statusColor(status)}`}>{status}</Badge>
                    </div>
                  </div>
                </SwipeableItem>
              );
            })}
          </div>
        )}

        {loaded && displayPages.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Geser kartu ke kiri untuk opsi tambahan
          </p>
        )}
      </div>

      <Dialog open={changeStatusOpen} onOpenChange={setChangeStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Status Revisi</DialogTitle>
          </DialogHeader>
          {pageForStatus && (
            <p className="text-xs text-muted-foreground -mt-2 truncate">
              {getJudul(pageForStatus) || getTitle(pageForStatus) || "Script"}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {STATUS_OPTIONS.map((s) => (
              <Button
                key={s}
                variant={pageForStatus && getSelect(pageForStatus, "Status Revisi") === s ? "default" : "outline"}
                className="h-11"
                onClick={() => handleStatusChange(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
