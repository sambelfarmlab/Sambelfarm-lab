import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/notion-helpers";

interface Props {
  value: string;
  onSave: (date: string) => void;
}

/** Compact inline date picker — shows formatted date, switches to native input on click. */
export function InlineDatePicker({ value, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  if (editing) {
    return (
      <input
        type="date"
        value={val}
        autoFocus
        className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm appearance-none"
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (val && val !== value) onSave(val);
        }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm text-muted-foreground hover:text-foreground transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
        setVal(value);
      }}
    >
      <CalendarDays size={14} className="shrink-0" />
      <span className={`truncate ${value ? "" : "italic"}`}>
        {value ? formatDate(value) : "Tambah tanggal"}
      </span>
    </button>
  );
}
