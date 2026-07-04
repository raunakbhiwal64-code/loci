import { useEffect, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { WORD_POOL, sample, shuffle } from "../util.js";

/**
 * Speed Recall — working-memory span under gentle time. Flash N words
 * briefly, then pick them from a bigger pool. Clear the round and N grows;
 * miss and N simply stays (never shrinks — no shaming). Span is tracked per
 * profile in ctx.storage ("recall-span").
 */

const SPAN_KEY = "recall-span";
const MIN_SPAN = 3;
const MAX_SPAN = 12;

interface SpanRecord {
  current: number;
  best: number;
}

type Stage = "ready" | "flash" | "recall" | "done";

export function SpeedRecall({ ctx, onExit }: { ctx: ModuleContext; onExit: () => void }) {
  const [span, setSpan] = useState<SpanRecord>(
    () => ctx.storage.get<SpanRecord>(SPAN_KEY) ?? { current: MIN_SPAN, best: MIN_SPAN }
  );
  const [stage, setStage] = useState<Stage>("ready");
  const [targets, setTargets] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [hits, setHits] = useState(0);

  const start = () => {
    const t = sample(WORD_POOL, span.current);
    const distractors = sample(WORD_POOL.filter((w) => !t.includes(w)), 4);
    setTargets(t);
    setPool(shuffle([...t, ...distractors]));
    setPicked([]);
    setStage("flash");
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "memora", skills: ["working-memory"] });
  };

  // The flash itself: words show for ~1.2s each, then hide automatically.
  useEffect(() => {
    if (stage !== "flash") return;
    const ms = Math.max(2500, targets.length * 1200);
    const timer = window.setTimeout(() => setStage("recall"), ms);
    return () => window.clearTimeout(timer);
  }, [stage, targets]);

  const toggle = (word: string) => {
    setPicked((p) => (p.includes(word) ? p.filter((w) => w !== word) : p.length < targets.length ? [...p, word] : p));
  };

  const check = () => {
    const got = picked.filter((w) => targets.includes(w)).length;
    setHits(got);
    const cleared = got === targets.length;
    const nextCurrent = cleared ? Math.min(MAX_SPAN, span.current + 1) : span.current;
    const next: SpanRecord = { current: nextCurrent, best: Math.max(span.best, cleared ? span.current : got) };
    ctx.storage.set(SPAN_KEY, next);
    setSpan(next);
    ctx.progression.award("working-memory", 6 + got * 2);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "memora",
      skills: ["working-memory"],
      success: targets.length > 0 ? got / targets.length : 0,
    });
    setStage("done");
  };

  if (stage === "ready") {
    return (
      <div className="stack">
        <GuideBubble>
          Quick eyes, quick mind! Words flash for a few seconds — hold them in your head, then find them all. Your
          span grows every time you clear a round.
        </GuideBubble>
        <Card className="center stack">
          <div className="big-emoji">⚡</div>
          <Display as="h3">Speed Recall</Display>
          <p className="ds-muted">
            Today's span: <strong>{span.current} words</strong> · Best: <strong>{span.best}</strong>
          </p>
          <Button big onClick={start}>Flash me →</Button>
        </Card>
        <Button variant="ghost" onClick={onExit}>← Back</Button>
      </div>
    );
  }

  if (stage === "flash") {
    return (
      <div className="stack">
        <GuideBubble>Look! Hold these in your head…</GuideBubble>
        <Card className="center stack">
          <div className="row wrap" style={{ justifyContent: "center" }}>
            {targets.map((w) => (
              <span key={w} className="pill" style={{ fontSize: "1.1rem" }}>{w}</span>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (stage === "recall") {
    return (
      <div className="stack">
        <ProgressRibbon value={(picked.length / targets.length) * 100} />
        <Display as="h3">Which {targets.length} did you see?</Display>
        <div className="choice-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(100px,1fr))" }}>
          {pool.map((w) => (
            <button
              key={w}
              className="choice"
              style={{ fontSize: "0.9rem" }}
              aria-pressed={picked.includes(w)}
              onClick={() => toggle(w)}
            >
              {w}
            </button>
          ))}
        </div>
        <Button big disabled={picked.length !== targets.length} onClick={check}>
          That's them →
        </Button>
      </div>
    );
  }

  const cleared = hits === targets.length;
  return (
    <div className="stack">
      <Card className="center stack">
        <div className="big-emoji">{cleared ? "🚀" : "🌟"}</div>
        <Display as="h3">{hits}/{targets.length} caught!</Display>
        <p className="ds-muted">
          {cleared
            ? `Round cleared — your span grows to ${span.current}! Fancy one more, or is this a great place to stop?`
            : "So close! Your span stays cosy where it is — it never shrinks. One more go, or stop here like a champion."}
        </p>
        <div className="row wrap" style={{ justifyContent: "center" }}>
          <Button big onClick={start}>One more round</Button>
          <Button variant="ghost" onClick={onExit}>Stop here 🎉</Button>
        </div>
      </Card>
    </div>
  );
}
