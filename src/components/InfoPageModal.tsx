"use client";

import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { InfoPageId } from "@/lib/types";
import { ModalShell } from "./ModalShell";

export function InfoPageModal({
  pageId,
  title,
  onClose,
}: {
  pageId: InfoPageId;
  title: string;
  onClose: () => void;
}) {
  const { infoPages, updateInfoPage } = useTournament();
  const page = infoPages.find((p) => p.id === pageId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(page?.content ?? "");

  function startEdit() {
    setDraft(page?.content ?? "");
    setEditing(true);
  }

  async function save() {
    await updateInfoPage(pageId, draft);
    setEditing(false);
  }

  return (
    <ModalShell title={title} onClose={onClose}>
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            placeholder={`Skriv inn ${title.toLowerCase()}...`}
            className="w-full rounded-xl border border-card-border bg-card-deep px-3 py-2 text-sm leading-relaxed text-ink focus:border-gold-deep/60 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-xl border border-card-border px-3 py-1.5 text-xs text-ink-light hover:bg-card-deep"
            >
              Avbryt
            </button>
            <button
              onClick={save}
              className="rounded-xl border border-gold-deep/60 bg-gold/20 px-3 py-1.5 text-xs font-semibold text-gold-deep hover:bg-gold/30"
            >
              Lagre
            </button>
          </div>
        </div>
      ) : (
        <div>
          {page?.content ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{page.content}</p>
          ) : (
            <p className="text-sm italic text-ink-light/60">Ingen info lagt inn ennå.</p>
          )}
          <button
            onClick={startEdit}
            className="mt-4 rounded-xl border border-gold-deep/50 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold-deep hover:bg-gold/20"
          >
            ✎ Rediger
          </button>
        </div>
      )}
    </ModalShell>
  );
}
