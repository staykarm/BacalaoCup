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
          <p className="text-sm italic text-ink-light/60">Ingen meldinger ennå — vær den første!</p>
        )}

        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="rounded-2xl border border-card-border bg-white p-3">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-gold-deep">{m.author}</span>
                <span className="text-[11px] text-ink-light/60">{fmtTime(m.created_at)}</span>
              </div>
              <p className="text-sm text-ink">{m.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-2 space-y-2 border-t border-card-border pt-3">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Ditt navn"
            className="w-full rounded-xl border border-card-border bg-card-deep px-3 py-2 text-sm text-ink focus:border-gold-deep/60 focus:outline-none"
          />
          <div className="flex gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Skriv en melding til alle..."
              rows={2}
              className="flex-1 rounded-xl border border-card-border bg-card-deep px-3 py-2 text-sm text-ink focus:border-gold-deep/60 focus:outline-none"
            />
            <button
              onClick={send}
              disabled={sending || !author.trim() || !body.trim()}
              className="shrink-0 rounded-xl border border-gold-deep/60 bg-gold/20 px-4 py-2 text-sm font-semibold text-gold-deep hover:bg-gold/30 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
