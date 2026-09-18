import { Player, TeamId } from "@/lib/types";

interface PlayerSelectProps {
  players: Player[];
  team: TeamId;
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}

export function PlayerSelect({ players, team, value, onChange, className }: PlayerSelectProps) {
  const options = players.filter((p) => p.team_id === team);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={`rounded-lg border border-navy-lighter/60 bg-navy-deep px-2 py-1.5 text-sm text-foreground focus:border-gold/60 focus:outline-none ${className ?? ""}`}
    >
      <option value="">—</option>
      {options.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
