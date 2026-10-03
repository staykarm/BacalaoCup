import { TournamentProvider } from "@/context/TournamentContext";
import { PlayerModalProvider } from "@/context/PlayerModalContext";

/**
 * The TV scoreboard is a passive, full-bleed display meant for a screen across the room —
 * it skips the phone-sized AppShell (header, bottom nav, modals) entirely and just needs
 * the live tournament data.
 */
export default function TvLayout({ children }: { children: React.ReactNode }) {
  return (
    <TournamentProvider>
      <PlayerModalProvider>{children}</PlayerModalProvider>
    </TournamentProvider>
  );
}
