import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SwipeableItem } from "@/components/swipeable-item";
import { InlineDatePicker } from "@/components/features/inline-date-picker";
import { useToast } from "@/hooks/use-toast";
import { useDraft } from "@/lib/draft";
import {
  Lightbulb,
  FileText,
  Edit3,
  Calendar,
  LogOut,
  Leaf,
  FileDown,
  RefreshCw,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useSavedPages } from "@/hooks/use-saved-pages";
import {
  type NotionPage,
  getTitle,
  getRichText,
  getSelect,
  getDate,
  pageToPartialDraft,
} from "@/lib/notion-helpers";

const STATUS_OPTIONS = ["Draft", "Terjadwal", "Final", "Dipublikasi"];

function statusColor(status: string) {
  if (status === "Final" || status === "Dipublikasi")
    return "bg-primary/10 text-primary border-primary/20";
  if (status === "Terjadwal")
    return "bg-accent/10 text-accent border-accent/20";
  return "bg-muted text-muted-foreground border-border";
}

const QUICK_ACTIONS = [
  { label: "Brainstorm Ide", icon: Lightbulb, path: "/brainstorm", desc: "5 ide konten baru" },
  { label: "Buat Script", icon: FileText, path: "/generator", desc: "Generate naskah" },
  { label: "Editor", icon: Edit3, path: "/editor", desc: "Edit & analisis" },
  { label: "Kalender", icon: Calendar, path: "/calendar", desc: "Jadwal konten" },
];

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();
  const { setDraft } = useDraft();

  const [filterStatus, setFilterStatus] = useState("all");
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [pageForStatus, setPageForStatus] = useState<NotionPage | null>(null);

  const {
    pages,
    loaded,
    fetchPages,
    handleDateChange,
    handleStatusChange,
    handleDelete,
    handlePublish,
    handleDownloadPDF,
  } = useSavedPages();

  // Load pages on mount (only once)
  useEffect(() => {
    fetchPages(20);
  }, [fetchPages]);

  const filteredPages = useMemo(
    () =>
      filterStatus === "all"
        ? pages
        : pages.filter((p) => getSelect(p, "Status Revisi") === filterStatus),
    [pages, filterStatus],
  );

  // Show only the latest 6 on the home screen to keep it snappy
  const displayPages = useMemo(() => filteredPages.slice(0, 6), [filteredPages]);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Leaf size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Selamat datang
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Sambelfarm Content Lab
          </h1>
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

      {/* Quick action grid */}
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map(({ label, icon: Icon, path, desc }) => (
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

      {/* Recent scripts section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Script Terbaru</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground h-7"
            onClick={() => setLocation("/editor")}
          >
            Lihat semua
          </Button>
        </div>

        {/* Status filter */}
        <div className="mb-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-xs w-44" data-testid="select-filter-status">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading / empty / list */}
        {!loaded ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : displayPages.length === 0 ? (
          <div className="bg-muted/50 rounded-2xl p-5 text-center">
            <p className="text-sm text-muted-foreground">
              {filterStatus === "all"
                ? "Belum ada script tersimpan di Notion."
                : `Tidak ada script dengan status "${filterStatus}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayPages.map((page) => {
              const topik = getTitle(page);
              const judul = getRichText(page, "Judul");
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
                      <div className="font-medium text-sm text-foreground truncate">
                        {title}
                      </div>
                      {topik && judul && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {topik}
                        </div>
                      )}
                      <div className="mt-1.5">
                        <InlineDatePicker
                          value={tanggal}
                          onSave={(d) => handleDateChange(page, d)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {platform && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          {platform}
                        </Badge>
                      )}
                      {tone && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          {tone}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-5 ${statusColor(status)}`}
                      >
                        {status}
                      </Badge>
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

      {/* Change status dialog */}
      <Dialog open={changeStatusOpen} onOpenChange={setChangeStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Status Revisi</DialogTitle>
          </DialogHeader>
          {pageForStatus && (
            <p className="text-xs text-muted-foreground -mt-2 truncate">
              {getRichText(pageForStatus, "Judul") ||
                getTitle(pageForStatus) ||
                "Script"}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {STATUS_OPTIONS.map((s) => (
              <Button
                key={s}
                variant={
                  pageForStatus &&
                  getSelect(pageForStatus, "Status Revisi") === s
                    ? "default"
                    : "outline"
                }
                className="h-11"
                onClick={() => {
                  if (!pageForStatus) return;
                  handleStatusChange(pageForStatus.id, s);
                  setChangeStatusOpen(false);
                }}
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
