import { useState, useEffect } from "react";
import { useNotionQuery } from "@workspace/api-client-react";
import { getConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface NotionPage {
  id: string;
  properties: Record<string, {
    title?: Array<{ plain_text: string }>;
    select?: { name: string };
    date?: { start: string };
  }>;
}

interface DayContent {
  date: string;
  pages: NotionPage[];
}

function statusColor(status: string) {
  if (status === "Final" || status === "Dipublikasi") return "bg-primary text-primary-foreground";
  if (status === "Terjadwal") return "bg-accent text-accent-foreground";
  return "bg-muted text-muted-foreground";
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function CalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const notionQuery = useNotionQuery();
  const config = getConfig();

  useEffect(() => {
    if (!config.dbId) { setLoaded(true); return; }
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().slice(0, 10);

    notionQuery.mutate(
      {
        data: {
          database_id: config.dbId,
          filter: {
            and: [
              { property: "Tanggal", date: { on_or_after: start } },
              { property: "Tanggal", date: { on_or_before: end } },
            ]
          } as unknown as Record<string, string>,
          sorts: [{ property: "Tanggal", direction: "ascending" } as unknown as Record<string, string>],
          page_size: 50,
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
  }, [currentDate, config.dbId]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const dayMap = new Map<string, NotionPage[]>();
  pages.forEach((page) => {
    const dateVal = page.properties?.Tanggal?.date?.start;
    if (!dateVal) return;
    const key = dateVal.slice(0, 10);
    if (!dayMap.has(key)) dayMap.set(key, []);
    dayMap.get(key)!.push(page);
  });

  const selectedPages = selected ? dayMap.get(selected) ?? [] : [];

  return (
    <div className="p-4 space-y-5">
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-0.5">
          <CalIcon size={16} className="text-primary" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Content Calendar</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Jadwal Konten</h1>
      </div>

      {!config.dbId ? (
        <div className="bg-muted/50 rounded-2xl p-5 text-center">
          <p className="text-sm text-muted-foreground">Hubungkan Notion di Pengaturan untuk melihat kalender.</p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-prev-month" onClick={prevMonth}>
                <ChevronLeft size={16} />
              </Button>
              <span className="font-semibold text-sm">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-next-month" onClick={nextMonth}>
                <ChevronRight size={16} />
              </Button>
            </div>

            <div className="grid grid-cols-7 border-b border-border">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-12 border-r border-b border-border/50 last:border-r-0" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayPages = dayMap.get(dateKey) ?? [];
                const isToday = dateKey === today.toISOString().slice(0, 10);
                const isSelected = selected === dateKey;

                return (
                  <button
                    key={day}
                    data-testid={`calendar-day-${dateKey}`}
                    onClick={() => setSelected(isSelected ? null : dateKey)}
                    className={`h-12 border-r border-b border-border/50 last:border-r-0 flex flex-col items-center pt-1.5 gap-0.5 hover:bg-muted/50 transition-colors relative ${isSelected ? "bg-primary/5" : ""}`}
                  >
                    <span className={`text-xs font-medium leading-none rounded-full w-5 h-5 flex items-center justify-center ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                      {day}
                    </span>
                    {dayPages.length > 0 && (
                      <div className="flex gap-0.5">
                        {dayPages.slice(0, 2).map((p, pi) => {
                          const status = p.properties?.Status?.select?.name ?? "Draft";
                          const dot = status === "Final" || status === "Dipublikasi" ? "bg-primary" : status === "Terjadwal" ? "bg-accent" : "bg-muted-foreground";
                          return <div key={pi} className={`w-1.5 h-1.5 rounded-full ${dot}`} />;
                        })}
                        {dayPages.length > 2 && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />Draft</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-accent" />Terjadwal</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-primary" />Final/Dipublikasi</div>
          </div>

          {!loaded ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : selected && selectedPages.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-foreground">{selected}</div>
              {selectedPages.map((page) => {
                const title = page.properties?.Judul?.title?.[0]?.plain_text ?? page.properties?.Name?.title?.[0]?.plain_text ?? "Tanpa Judul";
                const status = page.properties?.Status?.select?.name ?? "Draft";
                const tone = page.properties?.Tone?.select?.name ?? "";
                return (
                  <div
                    key={page.id}
                    data-testid={`calendar-item-${page.id}`}
                    className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{title}</div>
                      {tone && <div className="text-xs text-muted-foreground mt-0.5">{tone}</div>}
                    </div>
                    <Badge variant="outline" className={`text-[10px] px-1.5 h-5 ${statusColor(status)}`}>{status}</Badge>
                  </div>
                );
              })}
            </div>
          ) : selected ? (
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Belum ada konten untuk tanggal ini.</p>
              <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                <Plus size={12} />Tambah Konten
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
