import { useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { PEGS, pegFor } from "../pegs.js";
import type { ListSource } from "../lists.js";
import { recordBeltResult } from "../belts.js";
import { optionsFor, sample } from "../util.js";

/**
 * Peg Dojo — belt 3 (number–shape pegs). Teach the ten pegs, hang a list on
 * them, then drill by POSITION: "what was number 3?" — no reciting from the
 * start. Jumping straight to any position is the peg superpower.
 */

type Stage = "teach" | "attach" | "drill" | "done";

interface DrillQ {
  pos: number; // 1-based
  answer: string;
  options: string[];
}

export function PegDojo({ ctx, list, onExit }: { ctx: ModuleContext; list: ListSource; onExit: () => void }) {
  const [items] = useState(() => list.items.slice(0, 10));
  const [stage, setStage] = useState<Stage>("teach");
  const [attachIdx, setAttachIdx] = useState(0);
  const [questions, setQuestions] = useState<DrillQ[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState("");

  const startAttach = () => {
    setAttachIdx(0);
    setStage("attach");
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "memora", skills: ["long-term-memory-technique"] });
  };

  const startDrill = () => {
    const positions = sample(
      items.map((_, i) => i + 1),
      Math.min(5, items.length)
    );
    setQuestions(
      positions.map((pos) => ({
        pos,
        answer: items[pos - 1],
        options: optionsFor(items, items[pos - 1]),
      }))
    );
    setQIdx(0);
    setCorrect(0);
    setFeedback("");
    setStage("drill");
  };

  const answer = (guess: string) => {
    const q = questions[qIdx];
    const hit = guess === q.answer;
    const hits = correct + (hit ? 1 : 0);
    if (hit) setCorrect(hits);
    setFeedback(hit ? "" : `Number ${q.pos} was the ${pegFor(q.pos).word} ${pegFor(q.pos).emoji} — it was holding ${q.answer}.`);
    const n = qIdx + 1;
    if (n >= questions.length) finish(hits);
    else setQIdx(n);
  };

  const finish = (hits: number) => {
    ctx.progression.award("long-term-memory-technique", 10 + hits * 5);
    ctx.srs.schedule("memora", `memora:pegs:${list.id}`);
    recordBeltResult(ctx.storage, "pegs", hits, questions.length);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "memora",
      skills: ["long-term-memory-technique"],
      success: questions.length > 0 ? hits / questions.length : 0,
    });
    setCorrect(hits);
    setStage("done");
  };

  if (stage === "teach") {
    return (
      <div className="stack">
        <GuideBubble>
          Each number has a shape twin — 1 looks like a candle, 2 like a swan. Hang a thing on each peg and you can
          jump straight to "number 7" without counting up!
        </GuideBubble>
        <Display as="h3">Meet your ten pegs</Display>
        <div className="tiles">
          {PEGS.map((p) => (
            <div key={p.n} className="tile" style={{ cursor: "default" }}>
              <span className="tile__emoji">{p.emoji}</span>
              <span className="tile__name">{p.n} = {p.word}</span>
              <span className="tile__blurb">{p.line}</span>
            </div>
          ))}
        </div>
        <Button big onClick={startAttach}>Hang my list on the pegs →</Button>
        <Button variant="ghost" onClick={onExit}>← Back</Button>
      </div>
    );
  }

  if (stage === "attach") {
    const peg = pegFor(attachIdx + 1);
    const item = items[attachIdx];
    return (
      <div className="stack">
        <ProgressRibbon value={((attachIdx + 1) / items.length) * 100} />
        <Card className="center stack">
          <span className="pill">Peg {attachIdx + 1} of {items.length}</span>
          <div className="big-emoji">{peg.emoji}</div>
          <Display as="h3">{attachIdx + 1} is the {peg.word} — hang <span style={{ color: "var(--accent)" }}>{item}</span> on it</Display>
          <GuideBubble>Picture {item} stuck to the {peg.word} {peg.emoji}. Make it wobble, glow or squeak!</GuideBubble>
          <Button big onClick={() => (attachIdx + 1 >= items.length ? startDrill() : setAttachIdx(attachIdx + 1))}>
            {attachIdx + 1 >= items.length ? "Drill me →" : "Next peg →"}
          </Button>
        </Card>
      </div>
    );
  }

  if (stage === "drill") {
    const q = questions[qIdx];
    return (
      <div className="stack">
        <ProgressRibbon value={((qIdx + 1) / questions.length) * 100} />
        <Card className="center stack">
          <span className="pill">Question {qIdx + 1} of {questions.length}</span>
          <div className="big-emoji">{pegFor(q.pos).emoji}</div>
          <Display as="h3">What was number {q.pos}?</Display>
          <p className="ds-muted">Jump straight to the {pegFor(q.pos).word} — what's hanging on it?</p>
          <div className="choice-grid">
            {q.options.map((o) => (
              <button key={o} className="choice" style={{ fontSize: "0.9rem" }} onClick={() => answer(o)}>
                {o}
              </button>
            ))}
          </div>
          {feedback && <GuideBubble>{feedback}</GuideBubble>}
        </Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <Card className="center stack">
        <div className="big-emoji">{correct === questions.length ? "🏆" : "🌟"}</div>
        <Display as="h3">Peg power: {correct}/{questions.length}</Display>
        <p className="ds-muted">
          You jumped straight to positions — that's something most grown-ups can't do! Review scheduled. Great place
          to stop. 🎉
        </p>
        <Button big onClick={onExit}>Back to Memora</Button>
      </Card>
    </div>
  );
}
