interface ScoreBarProps {
  /** Points from officially finalized matches. */
  graySettled: number;
  aquaSettled: number;
  /** Extra points currently projected from ongoing (not yet finalized) matches. */
  grayLive: number;
  aquaLive: number;
  possible: number;
  /** Points each team still needs (from officially finalized totals) to clinch outright. Null once someone has. */
  clinchGray: number | null;
  clinchAqua: number | null;
  className?: string;
}

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function ScoreBar({
  graySettled,
  aquaSettled,
  grayLive,
  aquaLive,
  possible,
  clinchGray,
  clinchAqua,
  className,
}: ScoreBarProps) {
  const total = possible > 0 ? possible : 1;
  const graySettledPct = (graySettled / total) * 100;
  const grayLivePct = (grayLive / total) * 100;
  const aquaLivePct = (aquaLive / total) * 100;
  const aquaSettledPct = (aquaSettled / total) * 100;
  const remainingPct = Math.max(0, 100 - graySettledPct - grayLivePct - aquaLivePct - aquaSettledPct);

  // The "win line" each team must cross to clinch outright, measured from its own side —
  // so from the left for Gray, from the right for Aqua (drawn here in from-the-left terms).
  const showLines = clinchGray !== null && clinchAqua !== null;
  const majority = showLines ? graySettled + (clinchGray as number) : null;
  const grayLinePct = majority !== null ? (majority / total) * 100 : null;
  const aquaLinePct = majority !== null ? 100 - (majority / total) * 100 : null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 sm:gap-3">
        {showLines && (
          <span className="shrink-0 whitespace-nowrap text-xs font-bold text-gray-team-light sm:text-base">
            Gray trenger {fmt(clinchGray as number)}p
          </span>
        )}

        <div className="relative min-w-0 flex-1">
          <div className="flex h-6 w-full overflow-hidden rounded-full border border-navy-lighter/60 bg-navy-deep shadow-inner sm:h-7">
            <div
              className="h-full bg-gradient-to-r from-gray-team-deep to-gray-team transition-all duration-500"
              style={{ width: `${graySettledPct}%` }}
            />
            {/* Lighter tint: points only projected from matches still in progress, not yet locked in. */}
            <div
              className="h-full bg-gray-team-light transition-all duration-500"
              style={{ width: `${grayLivePct}%` }}
            />
            <div className="h-full bg-navy-light/40 transition-all duration-500" style={{ width: `${remainingPct}%` }} />
            <div
              className="h-full bg-aqua-team-light transition-all duration-500"
              style={{ width: `${aquaLivePct}%` }}
            />
            <div
              className="h-full bg-gradient-to-l from-aqua-team-deep to-aqua-team transition-all duration-500"
              style={{ width: `${aquaSettledPct}%` }}
            />
          </div>

          {showLines && grayLinePct !== null && aquaLinePct !== null && (
            <>
              {/* Win-line ticks: the point each team must reach to clinch outright. */}
              <div className="absolute top-0 h-6 w-px bg-white/70 sm:h-7" style={{ left: `${grayLinePct}%` }} />
              <div className="absolute top-0 h-6 w-px bg-white/70 sm:h-7" style={{ left: `${aquaLinePct}%` }} />
            </>
          )}
        </div>

        {showLines && (
          <span className="shrink-0 whitespace-nowrap text-xs font-bold text-aqua-team-light sm:text-base">
            Aqua trenger {fmt(clinchAqua as number)}p
          </span>
        )}
      </div>

      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-foreground/50">
        <span>{fmt(graySettled + grayLive)} p</span>
        <span>{fmt(possible)} p totalt</span>
        <span>{fmt(aquaSettled + aquaLive)} p</span>
      </div>
    </div>
  );
}
