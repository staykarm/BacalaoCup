"use client";

import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { ModalShell } from "./ModalShell";

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("nb-NO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function MeldingerModal({ onClose }: { onClose: () => void }) {
  const { messages, postMessage } = useTournament();
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!author.trim() || !body.trim()) return;
    setSending(true);
    await postMessage(author.trim(), body.trim());
    setBody("");
    setSending(false);
  }

  return (
    <ModalShell title="Meldinger" onClose={onClose}>
      <div className="flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-sm italic text-foreground/40">Ingen meldinger ennå — vær den første!</p>
        )}

        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="rounded-xl border border-navy-lighter/50 bg-navy-light/40 p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-gold">{m.author}</span>
                <span className="text-[11px] text-foreground/40">{fmtTime(m.created_at)}</span>
              </div>
              <p className="text-sm text-foreground/80">{m.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-2 space-y-2 border-t border-navy-lighter/60 pt-3">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Ditt navn"
            className="w-full rounded-lg border border-navy-lighter/60 bg-navy px-3 py-2 text-sm focus:border-gold/60 focus:outline-none"
          />
          <div className="flex gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Skriv en melding til alle..."
              rows={2}
              className="flex-1 rounded-lg border border-navy-lighter/60 bg-navy px-3 py-2 text-sm focus:border-gold/60 focus:outline-none"
            />
            <button
              onClick={send}
              disabled={sending || !author.trim() || !body.trim()}
              className="shrink-0 rounded-lg border border-gold/60 bg-gold/20 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/30 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
