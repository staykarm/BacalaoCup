interface ScoreBarProps {
  /** Points from officially finalized matches. */
  graySettled: number;
  aquaSettled: number;
  /** Extra points currently projected from ongoing (not yet finalized) matches. */
  grayLive: number;
  aquaLive: number;
  possible: number;
  className?: string;
}

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function ScoreBar({ graySettled, aquaSettled, grayLive, aquaLive, possible, className }: ScoreBarProps) {
  const total = possible > 0 ? possible : 1;
  const graySettledPct = (graySettled / total) * 100;
  const grayLivePct = (grayLive / total) * 100;
  const aquaLivePct = (aquaLive / total) * 100;
  const aquaSettledPct = (aquaSettled / total) * 100;
  const remainingPct = Math.max(0, 100 - graySettledPct - grayLivePct - aquaLivePct - aquaSettledPct);

  return (
    <div className={className}>
      <div className="flex h-3 w-full overflow-hidden rounded-full border border-navy-lighter/60 bg-navy-deep shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-gray-team-deep to-gray-team transition-all duration-500"
          style={{ width: `${graySettledPct}%` }}
        />
        {/* Lighter tint: points only projected from matches still in progress, not yet locked in. */}
        <div className="h-full bg-gray-team-light transition-all duration-500" style={{ width: `${grayLivePct}%` }} />
        <div
          className="h-full bg-navy-light/40 transition-all duration-500"
          style={{ width: `${remainingPct}%` }}
        />
        <div className="h-full bg-aqua-team-light transition-all duration-500" style={{ width: `${aquaLivePct}%` }} />
        <div
          className="h-full bg-gradient-to-l from-aqua-team-deep to-aqua-team transition-all duration-500"
          style={{ width: `${aquaSettledPct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-foreground/50">
        <span>{fmt(graySettled + grayLive)} p</span>
        <span>{fmt(possible)} p totalt</span>
        <span>{fmt(aquaSettled + aquaLive)} p</span>
      </div>
    </div>
  );
}
