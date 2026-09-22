"use client";

import { useState } from "react";
import { TournamentProvider, useTournament } from "@/context/TournamentContext";
import { ScoreHeader } from "./ScoreHeader";
import { MvpModal } from "./MvpModal";
import { MeldingerModal } from "./MeldingerModal";
import { AgendaModal } from "./AgendaModal";
import { BaneinfoModal } from "./BaneinfoModal";
import { InfoPageModal } from "./InfoPageModal";
import { KartModal } from "./KartModal";
import { AdminModal } from "./AdminModal";

function SyncErrorToast() {
  const { syncError, clearSyncError } = useTournament();
  if (!syncError) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-red-500/40 bg-red-950/90 px-4 py-3 text-sm text-red-200 shadow-lg backdrop-blur sm:bottom-28">
      <div className="flex items-start gap-3">
        <p className="flex-1">
          <span className="font-semibold">Klarte ikke å lagre.</span> Sjekk nettforbindelsen og prøv igjen.
        </p>
        <button
          onClick={clearSyncError}
          aria-label="Lukk"
          className="shrink-0 text-red-300/70 hover:text-red-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

type ModalKey =
  | "mvp"
  | "meldinger"
  | "agenda"
  | "baneinfo"
  | "kart"
  | "praktisk"
  | "restaurant"
  | "admin"
  | null;

const NAV_ITEMS: { key: Exclude<ModalKey, null | "admin">; label: string; icon: string }[] = [
  { key: "mvp", label: "MVP", icon: "🏆" },
  { key: "meldinger", label: "Meldinger", icon: "💬" },
  { key: "agenda", label: "Agenda", icon: "📅" },
  { key: "baneinfo", label: "Baneinfo", icon: "⛳" },
  { key: "kart", label: "Kart", icon: "🗺️" },
  { key: "praktisk", label: "Praktisk", icon: "ℹ️" },
  { key: "restaurant", label: "Restaurant", icon: "🍽️" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [openModal, setOpenModal] = useState<ModalKey>(null);

  return (
    <TournamentProvider>
      <ScoreHeader onOpenAdmin={() => setOpenModal("admin")} />

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-4 sm:px-6">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-navy-lighter/60 bg-navy-deep/95 backdrop-blur supports-[backdrop-filter]:bg-navy-deep/85">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 py-2 sm:justify-center sm:gap-2 sm:px-6">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setOpenModal(item.key)}
              className="flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-foreground/60 transition hover:bg-navy-lighter/40 hover:text-gold"
            >
              <span className="text-lg leading-none" aria-hidden>
                {item.icon}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {openModal === "mvp" && <MvpModal onClose={() => setOpenModal(null)} />}
      {openModal === "meldinger" && <MeldingerModal onClose={() => setOpenModal(null)} />}
      {openModal === "agenda" && <AgendaModal onClose={() => setOpenModal(null)} />}
      {openModal === "baneinfo" && <BaneinfoModal onClose={() => setOpenModal(null)} />}
      {openModal === "kart" && <KartModal onClose={() => setOpenModal(null)} />}
      {openModal === "praktisk" && (
        <InfoPageModal pageId="praktisk" title="Praktisk info" onClose={() => setOpenModal(null)} />
      )}
      {openModal === "restaurant" && (
        <InfoPageModal pageId="restaurant" title="Restaurantinfo" onClose={() => setOpenModal(null)} />
      )}
      {openModal === "admin" && <AdminModal onClose={() => setOpenModal(null)} />}

      <SyncErrorToast />
    </TournamentProvider>
  );
}
