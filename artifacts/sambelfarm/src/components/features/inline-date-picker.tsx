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
        className="text-[10px] border border-primary/50 rounded px-1.5 bg-background h-5 appearance-none"
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
      className="flex h-9 items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
        setVal(value);
      }}
    >
      <CalendarDays size={9} />
      <span className={value ? "" : "italic"}>
        {value ? formatDate(value) : "Tambah tanggal"}
      </span>
    </button>
  );
}
