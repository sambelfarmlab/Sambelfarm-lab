import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SwipeableItem } from "@/components/swipeable-item";
import { InlineDatePicker } from "@/components/features/inline-date-picker";
import { Edit3, RefreshCw, Sparkles, Trash2, Palette, FileDown } from "lucide-react";
import {
  type NotionPage,
  getTitle,
  getRichText,
  getSelect,
  getDate,
  getNumber,
} from "@/lib/notion-helpers";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function statusBadgeClass(status: string) {
  if (status === "Final" || status === "Dipublikasi")
    return "bg-primary/10 text-primary border-primary/20";
  if (status === "Terjadwal") return "bg-accent/10 text-accent border-accent/20";
  return "";
}

interface Props {
  page: NotionPage;
  swipeRef?: (el: { reset: () => void } | null) => void;
  onEdit: (page: NotionPage) => void;
  onAdapt: (page: NotionPage) => void;
  onRewrite: (page: NotionPage) => void;
  onDelete: (page: NotionPage) => void;
  onChangeTone: (page: NotionPage) => void;
  onDownload: (page: NotionPage) => void;
  onDateChange: (page: NotionPage, date: string) => void;
}

/** Individual saved script card with swipe actions and quick-action buttons. */
export function SavedScriptCard({
  page,
  swipeRef,
  onEdit,
  onAdapt,
  onRewrite,
  onDelete,
  onChangeTone,
  onDownload,
  onDateChange,
}: Props) {
  const topik = getTitle(page);
  const judul = getRichText(page, "Judul");
  const displayTitle = judul || topik || "Tanpa Judul";
  const platform = getSelect(page, "Platform");
  const jenisKonten = getSelect(page, "Jenis Konten");
  const tone = getSelect(page, "Tone");
  const tanggal = getDate(page, "Tanggal");
  const statusRevisi = getSelect(page, "Status Revisi");
  const skor = getNumber(page, "Skor Viralitas");

  return (
    <motion.div
      variants={cardVariants}
      transition={{ duration: 0.4, ease: "easeOut" }}
      exit={{ opacity: 0, y: -20 }}
    >
      <SwipeableItem
        ref={swipeRef}
        leftActions={[
          {
            label: "Hapus",
            icon: <Trash2 size={18} />,
            bgClass: "bg-red-500",
            direction: "left",
            onClick: () => onDelete(page),
          },
        ]}
        rightActions={[
          {
            label: "Tone",
            icon: <Palette size={18} />,
            bgClass: "bg-amber-500",
            direction: "right",
            onClick: () => onChangeTone(page),
          },
          {
            label: "Download",
            icon: <FileDown size={18} />,
            bgClass: "bg-sky-500",
            direction: "right",
            onClick: () => onDownload(page),
          },
        ]}
      >
        <div
          data-testid={`saved-script-${page.id}`}
          className="bg-card border border-border rounded-2xl p-4 space-y-3 relative z-10"
        >
          {/* Title & date */}
          <div className="min-w-0">
            <div className="font-semibold text-sm text-foreground truncate pr-2">
              {displayTitle}
            </div>
            {topik && judul && (
              <div className="text-[11px] text-muted-foreground mt-0.5 truncate pr-2">
                {topik}
              </div>
            )}
            <div className="mt-2">
              <InlineDatePicker
                value={tanggal}
                onSave={(d) => onDateChange(page, d)}
              />
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {platform && (
                <Badge variant="outline" className="text-[10px] px-1.5 h-5 font-normal">
                  {platform}
                </Badge>
              )}
              {jenisKonten && (
                <Badge variant="outline" className="text-[10px] px-1.5 h-5 font-normal">
                  {jenisKonten}
                </Badge>
              )}
              {tone && (
                <Badge variant="outline" className="text-[10px] px-1.5 h-5 font-normal">
                  {tone}
                </Badge>
              )}
              {statusRevisi && (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 h-5 font-normal ${statusBadgeClass(statusRevisi)}`}
                >
                  {statusRevisi}
                </Badge>
              )}
              {skor !== null && (
                <Badge className="text-[10px] px-1.5 h-5 bg-primary/10 text-primary border-primary/20 font-medium">
                  ⚡ {Math.round(skor)}
                </Badge>
              )}
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="grid grid-cols-3 gap-2 pt-3 mt-2 border-t border-border/50">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-[10px] sm:text-xs px-1 bg-muted/40 hover:bg-muted"
              data-testid={`button-edit-saved-${page.id}`}
              onClick={() => onEdit(page)}
            >
              <Edit3 size={14} className="mr-1.5 shrink-0" />
              Editor
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-[10px] sm:text-xs px-1 bg-muted/40 hover:bg-muted"
              data-testid={`button-adapt-${page.id}`}
              onClick={() => onAdapt(page)}
            >
              <RefreshCw size={14} className="mr-1.5 shrink-0" />
              Adaptasi
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-[10px] sm:text-xs px-1 bg-muted/40 hover:bg-muted"
              data-testid={`button-rewrite-${page.id}`}
              onClick={() => onRewrite(page)}
            >
              <Sparkles size={14} className="mr-1.5 shrink-0" />
              Tulis Ulang
            </Button>
          </div>
        </div>
      </SwipeableItem>
    </motion.div>
  );
}
