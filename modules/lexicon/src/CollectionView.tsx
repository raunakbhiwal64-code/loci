import { useEffect, useState } from "react";
import { Button, Card, Display, Modal, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import type { WordEntry, WordPack } from "./words.js";

/**
 * The Word Collection (PRD 4.6) — every mastered word is a collectible card.
 * Locked cards show ??? until the word is mastered in the learn flow.
 * Tap a collected card to flip it and review; the flip may fetch one fresh
 * AI example sentence (authored sentence is always shown as the fallback).
 */
export function CollectionView({
  ctx,
  pack,
  collected,
  onExit,
}: {
  ctx: ModuleContext;
  pack: WordPack;
  collected: string[];
  onExit: () => void;
}) {
  const [open, setOpen] = useState<WordEntry | null>(null);
  const count = pack.words.filter((w) => collected.includes(w.word)).length;

  return (
    <div className="stack">
      <div className="spread">
        <Display as="h3">My Word Collection</Display>
        <span className="pill">
          {count} of {pack.words.length} collected
        </span>
      </div>
      <ProgressRibbon value={(count / pack.words.length) * 100} />
      <div className="tiles">
        {pack.words.map((entry) => {
          const owned = collected.includes(entry.word);
          return owned ? (
            <button
              key={entry.word}
              className="tile"
              onClick={() => setOpen(entry)}
              aria-label={`Review the card for ${entry.word}`}
            >
              <span className="tile__emoji">{entry.emoji}</span>
              <span className="tile__name">{entry.word}</span>
              <span className="tile__blurb">Tap to flip</span>
            </button>
          ) : (
            <div key={entry.word} className="tile" style={{ opacity: 0.55, cursor: "default" }} aria-label="Locked card">
              <span className="tile__emoji">🔒</span>
              <span className="tile__name">???</span>
              <span className="tile__blurb">Learn to unlock</span>
            </div>
          );
        })}
      </div>
      <Button variant="ghost" onClick={onExit}>← Back home</Button>
      {open && (
        <Modal onClose={() => setOpen(null)}>
          <CardBack ctx={ctx} entry={open} onClose={() => setOpen(null)} />
        </Modal>
      )}
    </div>
  );
}

function CardBack({ ctx, entry, onClose }: { ctx: ModuleContext; entry: WordEntry; onClose: () => void }) {
  // One fresh AI example sentence per flip; the authored sentence is the
  // always-available fallback and stays on the card either way.
  const [fresh, setFresh] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setFresh(null);
    ctx.ai
      .generateContent({ task: "lexicon.story", context: { word: entry.word } })
      .then((r) => {
        if (alive && r.text && !r.filtered) setFresh(r.text);
      })
      .catch(() => {
        /* authored sentence remains — no fresh example, no drama */
      });
    return () => {
      alive = false;
    };
  }, [ctx, entry]);

  return (
    <div className="stack center">
      <div className="big-emoji">{entry.emoji}</div>
      <Display as="h2" style={{ color: "var(--accent)" }}>{entry.word}</Display>
      <p style={{ fontSize: "1.1rem", margin: 0 }}>{entry.meaning}</p>
      <p className="ds-muted" style={{ fontStyle: "italic", margin: 0 }}>"{entry.sentence}"</p>
      {fresh && (
        <p className="ds-muted" style={{ fontStyle: "italic", margin: 0 }}>✨ "{fresh}"</p>
      )}
      <Card style={{ background: "var(--parchment)", textAlign: "left" }}>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          {entry.microStory[0]}
          <br />
          {entry.microStory[1]}
        </p>
      </Card>
      <p style={{ margin: 0, textAlign: "left" }}>
        💡 <strong>Use it today:</strong> {entry.useIt}
      </p>
      <Button onClick={onClose}>Done</Button>
    </div>
  );
}
