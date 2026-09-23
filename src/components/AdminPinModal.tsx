"use client";

import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { ModalShell } from "./ModalShell";

export function AdminPinModal({ onClose, onUnlock }: { onClose: () => void; onUnlock: () => void }) {
  const { adminPin } = useTournament();
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  function submit() {
    if (value === adminPin) {
      onUnlock();
    } else {
      setWrong(true);
      setValue("");
    }
  }

  return (
    <ModalShell title="Admin" onClose={onClose}>
      <div className="space-y-4 text-center">
        <p className="text-sm text-ink-light">Skriv inn PIN-koden for å åpne admin-panelet.</p>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value.replace(/[^0-9]/g, ""));
            setWrong(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className={`w-full rounded-xl border bg-card-deep px-3 py-3 text-center text-2xl tracking-[0.5em] text-ink focus:outline-none ${
            wrong ? "border-red-400" : "border-card-border focus:border-gold-deep/60"
          }`}
        />
        {wrong && <p className="text-xs font-semibold text-red-700">Feil PIN-kode.</p>}
        <button
          onClick={submit}
          disabled={value.length === 0}
          className="w-full rounded-xl border border-gold-deep/60 bg-gold/10 px-3 py-2.5 text-sm font-bold text-gold-deep hover:bg-gold/20 disabled:opacity-40"
        >
          Lås opp
        </button>
      </div>
    </ModalShell>
  );
}
