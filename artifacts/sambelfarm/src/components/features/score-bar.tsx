import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface Props {
  label: string;
  value: number;
}

/** Animated score bar used in TRIBE analysis results. */
export function ScoreBar({ label, value }: Props) {
  const barColor =
    value >= 75 ? "bg-primary" : value >= 50 ? "bg-secondary" : "bg-accent";
  const textColor =
    value >= 75
      ? "text-primary"
      : value >= 50
        ? "text-secondary"
        : "text-accent";

  const count = useSpring(0, { stiffness: 60, damping: 20 });
  const displayValue = useTransform(count, (latest) => Math.round(latest));
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    count.set(value);
  }, [value, count]);

  useEffect(() => {
    return displayValue.on("change", (latest) => {
      if (textRef.current) {
        textRef.current.textContent = latest.toString();
      }
    });
  }, [displayValue]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-24 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      <span className={`text-xs font-semibold w-7 text-right ${textColor}`}>
        <span ref={textRef}>0</span>
      </span>
    </div>
  );
}
