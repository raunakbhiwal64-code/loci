import { useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import type { ListSource } from "../lists.js";
import { recordBeltResult } from "../belts.js";
import { linkStoryFallback, shuffle } from "../util.js";

/**
 * Story Chain — belt 1 (linking stories). Chain 5 → 10 items into one silly
 * story, then recall the list IN ORDER by tapping from a shuffled pool.
 * Authored lists may ask the AI gateway for a story; child-entered lists
 * always use the deterministic template chain.
 */

type Stage = "size" | "story" | "recall" | "done";

export function StoryChain({ ctx, list, onExit }: { ctx: ModuleContext; list: ListSource; onExit: () => void }) {
  const [stage, setStage] = useState<Stage>("size");
  const [items, setItems] = useState<string[]>([]);
  const [story, setStory] = useState("");
  const [pool, setPool] = useState<string[]>([]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);
  const [nudge, setNudge] = useState("");

  const begin = async (size: number) => {
    const chosen = list.items.slice(0, size);
    setItems(chosen);
    setStory("");
    setStage("story");
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "memora", skills: ["long-term-memory-technique"] });
    const fallback = linkStoryFallback(chosen);
    if (list.authored) {
      // Authored deck items only — child-entered lists never go to ctx.ai.
      const r = await ctx.ai.generateContent({ task: "memora.story", context: { items: chosen.join(", ") } });
      setStory(r.filtered ? fallback : r.text);
    } else {
      setStory(fallback);
    }
  };

  const startRecall = () => {
    setPool(shuffle(items));
    setPlaced([]);
    setMisses(0);
    setNudge("");
    setStage("recall");
  };

  const tap = (item: string) => {
    const expected = items[placed.length];
    if (item === expected) {
      const nextPlaced = [...placed, item];
      setPlaced(nextPlaced);
      setPool(pool.filter((p) => p !== item));
      setNudge("");
      if (nextPlaced.length === items.length) finish();
    } else {
      setMisses((m) => m + 1);
      const before = placed.length > 0 ? placed[placed.length - 1] : null;
      setNudge(before ? `Not quite — in the story, what did the ${before} meet next?` : "Hmm — which one did the story start with?");
    }
  };

  const finish = () => {
    const hits = Math.max(0, items.length - misses);
    ctx.progression.award("long-term-memory-technique", 12 + hits * 4);
    ctx.srs.schedule("memora", `memora:story:${list.id}`);
    recordBeltResult(ctx.storage, "linking", hits, items.length);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "memora",
      skills: ["long-term-memory-technique"],
      success: hits / items.length,
    });
    setStage("done");
  };

  if (stage === "size") {
    return (
      <div className="stack">
        <GuideBubble>
          One silly story can carry a whole list. Each thing bumps into the next — and your brain LOVES silly.
        </GuideBubble>
        <Display as="h3">{list.emoji} {list.title}</Display>
        <div className="row wrap">
          <Button big onClick={() => void begin(Math.min(5, list.items.length))}>5 things — warm up</Button>
          {list.items.length >= 10 && (
            <Button big variant="ghost" onClick={() => void begin(10)}>10 things — belt test! 🔗</Button>
          )}
        </div>
        <Button variant="ghost" onClick={onExit}>← Back</Button>
      </div>
    );
  }

  if (stage === "story") {
    return (
      <div className="stack">
        <Display as="h3">Your linking story</Display>
        <Card>
          <div className="row wrap">
            {items.map((it, i) => (
              <span key={it} className="pill">{i + 1}. {it}</span>
            ))}
          </div>
        </Card>
        <GuideBubble>{story || "Spinning up a story…"}</GuideBubble>
        <p className="ds-muted">Close your eyes and watch it happen like a cartoon. Ready?</p>
        <Button big onClick={startRecall}>I can see it! Quiz me →</Button>
      </div>
    );
  }

  if (stage === "recall") {
    return (
      <div className="stack">
        <ProgressRibbon value={(placed.length / items.length) * 100} />
        <Display as="h3">Tell the story back — in order</Display>
        <Card>
          <div className="row wrap">
            {items.map((_, i) => (
              <span key={i} className="pill" style={i < placed.length ? { background: "var(--accent)", color: "#fff" } : undefined}>
                {i < placed.length ? placed[i] : `${i + 1}?`}
              </span>
            ))}
          </div>
        </Card>
        {nudge && <GuideBubble>{nudge}</GuideBubble>}
        <div className="choice-grid">
          {pool.map((p) => (
            <button key={p} className="choice" style={{ fontSize: "0.9rem" }} onClick={() => tap(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const hits = Math.max(0, items.length - misses);
  return (
    <div className="stack">
      <Card className="center stack">
        <div className="big-emoji">{misses === 0 ? "🏆" : "🌟"}</div>
        <Display as="h3">Story told! {hits}/{items.length} smooth links</Display>
        <p className="ds-muted">
          That story will pop back into your head later — I've scheduled a quick review so it sticks. Great place to
          stop. 🎉
        </p>
        <div className="row wrap" style={{ justifyContent: "center" }}>
          <Button big onClick={onExit}>Back to Memora</Button>
        </div>
      </Card>
    </div>
  );
}
