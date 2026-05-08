import { ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { ScoreBar } from "@/components/features/score-bar";
import { CopyButton } from "@/components/features/copy-button";
import type { Draft } from "@/lib/draft";

interface Props {
  draft: Draft;
  open: boolean;
  onToggle: () => void;
}

/** Expandable TRIBE v2 analysis panel — scores, AI analysis, recommendations, captions. */
export function TribeAnalysisPanel({ draft, open, onToggle }: Props) {
  if (draft.skorViralitas === null) return null;

  const scoreColor =
    draft.skorViralitas >= 75
      ? "text-primary"
      : draft.skorViralitas >= 50
        ? "text-secondary"
        : "text-accent";

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
      {/* Header toggle */}
      <button
        className="w-full flex items-center justify-between"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-primary" />
          <span className="font-semibold text-sm">Analisis TRIBE v2</span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground" />
        )}
      </button>

      {open && (
        <>
          {/* Virality score */}
          <div className="text-center py-1">
            <div className={`text-4xl font-bold ${scoreColor}`}>
              {Math.round(draft.skorViralitas)}
            </div>
            <div className="text-xs text-muted-foreground">Skor Viralitas</div>
          </div>

          {/* TRIBE dimension bars */}
          <div className="space-y-2">
            <ScoreBar label="Trigger" value={draft.tribeTrigger} />
            <ScoreBar label="Resonance" value={draft.tribeResonance} />
            <ScoreBar label="Impact" value={draft.tribeImpact} />
            <ScoreBar label="Behavior" value={draft.tribeBehavior} />
            <ScoreBar label="Engagement" value={draft.tribeEngagement} />
          </div>

          {/* AI analysis text */}
          {draft.analisisAI && (
            <div className="border-t border-border pt-3 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Analisis AI
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {draft.analisisAI}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {draft.rekomendasi && (
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Rekomendasi Perbaikan
              </p>
              <ul className="space-y-1">
                {draft.rekomendasi.split("|").map((r, i) => (
                  <li key={i} className="text-sm text-foreground flex gap-2">
                    <span className="text-accent shrink-0">•</span>
                    <span>{r.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ready-to-post captions */}
          {(draft.captionTikTok || draft.captionInstagram || draft.captionYTShorts) && (
            <div className="border-t border-border pt-3 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Caption Siap Posting
              </p>
              {[
                { key: "captionTikTok", label: "TikTok", text: draft.captionTikTok },
                { key: "captionInstagram", label: "Instagram", text: draft.captionInstagram },
                { key: "captionYTShorts", label: "YouTube Shorts", text: draft.captionYTShorts },
              ]
                .filter((c) => c.text)
                .map((c) => (
                  <div key={c.key} className="bg-muted/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{c.label}</span>
                      <CopyButton text={c.text} label={c.label} />
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {c.text}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
