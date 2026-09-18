interface ScoreBarProps {
  gray: number;
  aqua: number;
  possible: number;
  className?: string;
}

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function ScoreBar({ gray, aqua, possible, className }: ScoreBarProps) {
  const total = possible > 0 ? possible : 1;
  const grayPct = (gray / total) * 100;
  const aquaPct = (aqua / total) * 100;
  const remainingPct = Math.max(0, 100 - grayPct - aquaPct);

  return (
    <div className={className}>
      <div className="flex h-3 w-full overflow-hidden rounded-full border border-navy-lighter/60 bg-navy-deep shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-gray-team-deep to-gray-team transition-all duration-500"
          style={{ width: `${grayPct}%` }}
        />
        <div
          className="h-full bg-navy-light/40 transition-all duration-500"
          style={{ width: `${remainingPct}%` }}
        />
        <div
          className="h-full bg-gradient-to-l from-aqua-team-deep to-aqua-team transition-all duration-500"
          style={{ width: `${aquaPct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-foreground/50">
        <span>{fmt(gray)} p</span>
        <span>{fmt(possible)} p totalt</span>
        <span>{fmt(aqua)} p</span>
      </div>
    </div>
  );
}
