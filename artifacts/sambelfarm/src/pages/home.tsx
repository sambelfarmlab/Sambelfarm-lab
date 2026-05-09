import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { toast: _toast } = useToast();
  const { setDraft } = useDraft();

  const {
    pages,
    loaded,
    fetchPages,
    handleDateChange,
  } = useSavedPages();

  useEffect(() => {
    fetchPages(20);
  }, [fetchPages]);

  // Max 5 most recent scripts
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
              "Belum ada script tersimpan di Notion."
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
              const tanggal = getDate(page, "Tanggal");

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
                  {(platform || tone) && (
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
