import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InlineDatePicker } from "@/components/features/inline-date-picker";
import { useToast } from "@/hooks/use-toast";
import { useDraft } from "@/lib/draft";
import { STATUS_REVISI_OPTIONS } from "@/components/features/content-detail-form";
import {
  Lightbulb,
  FileText,
  Edit3,
  Calendar,
  LogOut,
  Leaf,
  Check,
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

const QUICK_ACTIONS = [
  { label: "Brainstorm Ide", icon: Lightbulb, path: "/brainstorm", desc: "5 ide konten baru" },
  { label: "Buat Script", icon: FileText, path: "/generator", desc: "Generate naskah" },
  { label: "Editor", icon: Edit3, path: "/editor", desc: "Edit & analisis" },
  { label: "Kalender", icon: Calendar, path: "/calendar", desc: "Jadwal konten" },
];

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground border-border",
  Revisi: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  Final: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  Terjadwal: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  Dipublikasi: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
};

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { toast: _toast } = useToast();
  const { setDraft } = useDraft();
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const {
    pages,
    loaded,
    fetchPages,
    handleDateChange,
    handleStatusChange,
  } = useSavedPages();

  useEffect(() => {
    fetchPages(20);
  }, [fetchPages]);

  const displayPages = useMemo(() => pages.slice(0, 5), [pages]);

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
        <div className="flex items-center mb-3">
          <h2 className="font-semibold text-foreground">Script Terbaru</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground h-7 ml-2 px-0"
            onClick={() => setLocation("/editor?tab=saved")}
          >
            Lihat semua
          </Button>
        </div>

        {!loaded ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : displayPages.length === 0 ? (
          <div className="bg-muted/50 rounded-2xl p-5 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada script tersimpan di Notion.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayPages.map((page) => {
              const topik = getTitle(page);
              const judul = getRichText(page, "Judul");
              const title = judul || topik || "Tanpa Judul";
              const tone = getSelect(page, "Tone");
              const platform = getSelect(page, "Platform");
              const statusRevisi = getSelect(page, "Status Revisi");
              const tanggal = getDate(page, "Tanggal");
              const popoverKey = page.id;

              return (
                <div
                  key={page.id}
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
                    <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                      <InlineDatePicker
                        value={tanggal}
                        onSave={(d) => handleDateChange(page, d)}
                      />
                    </div>
                  </div>

                  {/* Badges column — all clickable */}
                  <div
                    className="flex flex-col items-end gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
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

                    {/* Status Revisi — clickable popover */}
                    <Popover
                      open={openPopover === popoverKey}
                      onOpenChange={(open) => setOpenPopover(open ? popoverKey : null)}
                    >
                      <PopoverTrigger asChild>
                        <button
                          className={`text-[10px] px-1.5 h-5 rounded-full border font-medium cursor-pointer transition-opacity hover:opacity-80 ${
                            statusRevisi
                              ? (STATUS_COLORS[statusRevisi] ?? "bg-muted text-muted-foreground border-border")
                              : "bg-muted/60 text-muted-foreground border-dashed border-border"
                          }`}
                        >
                          {statusRevisi ?? "Set status"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-40 p-1.5"
                        align="end"
                        side="bottom"
                      >
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1">
                          Status Revisi
                        </p>
                        {STATUS_REVISI_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              handleStatusChange(page.id, opt);
                              setOpenPopover(null);
                            }}
                            className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md hover:bg-muted transition-colors"
                          >
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${
                                STATUS_COLORS[opt] ?? "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {opt}
                            </span>
                            {statusRevisi === opt && (
                              <Check size={12} className="text-primary shrink-0" />
                            )}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
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
