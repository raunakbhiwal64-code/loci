import { useEffect, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext, RecallGrade, SrsItem } from "@loci/module-sdk";
import { DECKS } from "../decks.js";
import { loadSavedLists } from "../lists.js";
import { loadSavedTexts } from "../learntext.js";
import { allPalaces } from "../palaces.js";

/**
 * Review session — the "due reviews" flow. Each learned set comes back on the
 * SRS ladder; the child replays it in their head and grades themselves.
 * Honest self-grading is the metacognition rep, so finishing awards
 * metacognition XP. No shame anywhere: "not yet" just means sooner.
 */

export function ReviewSession({ ctx, onExit }: { ctx: ModuleContext; onExit: () => void }) {
  const [items] = useState<SrsItem[]>(() => ctx.srs.due("memora"));
  const [idx, setIdx] = useState(0);
  const [remembered, setRemembered] = useState(0);
  const [closing, setClosing] = useState("Coming back to old memories is how they become forever-memories.");

  useEffect(() => {
    if (items.length === 0) return;
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "memora", skills: ["metacognition"] });
    void ctx.ai
      .review({ task: "memora.review", context: { count: items.length } })
      .then((r) => {
        if (!r.filtered) setClosing(r.text);
      });
  }, [ctx, items]);

  const grade = (g: RecallGrade) => {
    const item = items[idx];
    ctx.srs.review(item.id, g);
    const recalled = g !== "again";
    if (recalled) setRemembered((r) => r + 1);
    ctx.analytics.emit({ kind: "review", action: "attempted", moduleId: "memora", intervalDays: item.intervalDays });
    ctx.analytics.emit({ kind: "review", action: recalled ? "recalled" : "missed", moduleId: "memora" });
    const n = idx + 1;
    if (n >= items.length) {
      // Finishing a review is a metacognition win — you checked your own memory.
      ctx.progression.award("metacognition", 6 + items.length * 2);
      ctx.analytics.emit({
        kind: "activity",
        action: "completed",
        moduleId: "memora",
        skills: ["metacognition"],
        success: items.length > 0 ? (remembered + (recalled ? 1 : 0)) / items.length : 1,
      });
    }
    setIdx(n);
  };

  if (items.length === 0) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">🌤️</div>
          <Display as="h3">Nothing due right now</Display>
          <p className="ds-muted">Your memories are resting. Learn something new and it'll show up here later!</p>
          <Button big onClick={onExit}>Back to Memora</Button>
        </Card>
      </div>
    );
  }

  if (idx >= items.length) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">🧠</div>
          <Display as="h3">Reviews done — {remembered}/{items.length} still in there!</Display>
          <GuideBubble>{closing}</GuideBubble>
          <p className="ds-muted">Checking your own memory is a superpower called metacognition. It just grew. 🎉</p>
          <Button big onClick={onExit}>Back to Memora</Button>
        </Card>
      </div>
    );
  }

  const item = items[idx];
  const desc = describeRef(item.payloadRef, ctx);
  return (
    <div className="stack">
      <ProgressRibbon value={((idx + 1) / items.length) * 100} />
      <Card className="center stack">
        <span className="pill">Review {idx + 1} of {items.length}</span>
        <div className="big-emoji">{desc.emoji}</div>
        <Display as="h3">{desc.title}</Display>
        <GuideBubble>{desc.prompt}</GuideBubble>
        <p className="ds-muted">Try it in your head first — then be honest (that's the skill!):</p>
        <div className="row wrap" style={{ justifyContent: "center" }}>
          <Button variant="ghost" onClick={() => grade("again")}>Not yet 🌱</Button>
          <Button variant="ghost" onClick={() => grade("hard")}>Almost 🌤️</Button>
          <Button onClick={() => grade("good")}>Got it! ☀️</Button>
          <Button onClick={() => grade("easy")}>Super easy ⚡</Button>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- payloadRef → child-friendly prompt ---------------- */

function listTitle(listId: string, ctx: ModuleContext): string | undefined {
  if (listId === "planets-default") return "The planets";
  if (listId.startsWith("deck-")) {
    const id = listId.slice(5);
    for (const band of ["8-9", "10-12"] as const) {
      const deck = DECKS[band].find((d) => d.id === id);
      if (deck) return deck.title;
    }
  }
  if (listId.startsWith("list-")) {
    const saved = loadSavedLists(ctx.storage).find((l) => `list-${l.id}` === listId);
    if (saved) return saved.name;
  }
  if (listId.startsWith("text-")) {
    const text = loadSavedTexts(ctx.storage).find((t) => `text-${t.id}` === listId);
    if (text) return text.title;
  }
  return undefined;
}

export function describeRef(ref: string, ctx: ModuleContext): { emoji: string; title: string; prompt: string } {
  const parts = ref.split(":");
  if (parts[0] === "memora") {
    const kind = parts[1];
    if (kind === "story") {
      const title = listTitle(parts.slice(2).join(":"), ctx) ?? "your list";
      return { emoji: "🔗", title: `Your story: ${title}`, prompt: "Tell the silly story back to yourself. Can you still see every link?" };
    }
    if (kind === "palace") {
      const palace = allPalaces(ctx.storage).find((p) => p.id === parts[2]);
      const title = listTitle(parts.slice(3).join(":"), ctx) ?? "your list";
      return {
        emoji: palace?.emoji ?? "🏰",
        title: `${palace?.name ?? "Your palace"}: ${title}`,
        prompt: "Walk the palace in your mind, spot by spot. Is everything still where you left it?",
      };
    }
    if (kind === "pegs") {
      const title = listTitle(parts.slice(2).join(":"), ctx) ?? "your list";
      return { emoji: "🕯️", title: `Pegs: ${title}`, prompt: "Run down the pegs — candle, swan, heart… what's hanging on each one?" };
    }
    if (kind === "faces") {
      return { emoji: "🎉", title: "The party guests", prompt: "Picture the party. Can you still name the guests by their special features?" };
    }
    if (kind === "number") {
      const what = parts[2] === "phone" ? "your practice phone number" : `that ${parts[2]}-digit number`;
      return { emoji: "🥷", title: "Number pictures", prompt: `Say ${what} out loud from the pictures — egg, candle, swan…` };
    }
    if (kind === "text") {
      const title = listTitle(`text-${parts[2]}`, ctx) ?? "your text";
      return { emoji: "📖", title: `Your text: ${title}`, prompt: "Say the key words in order — can you rebuild the ideas from them?" };
    }
  }
  // Legacy v1 refs looked like "<palaceId>:<item>".
  return { emoji: "🌟", title: "A memory you made", prompt: "Close your eyes and bring it back. Still there?" };
}
