import { useEffect, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { ANALOGIES, RELATION_LABEL, type Analogy } from "./analogies.js";
import { sample, shuffle } from "./lib.js";
import { Choices } from "./Choices.js";

/**
 * Analogy Builder (PRD 4.6) — hot : cold :: big : ___ with four options.
 * After each answer the relation is NAMED ("these are OPPOSITES") — seeing
 * the relation type is the verbal-reasoning pedagogy, not just the answer.
 */

const ROUND_SIZE = 6;

interface RoundItem {
  analogy: Analogy;
  options: string[];
  correct: number;
}

export function AnalogyMode({
  ctx,
  onFinished,
  onExit,
}: {
  ctx: ModuleContext;
  onFinished: (right: number, total: number) => void;
  onExit: () => void;
}) {
  const [round] = useState<RoundItem[]>(() =>
    sample(ANALOGIES, ROUND_SIZE).map((analogy) => {
      const options = shuffle(analogy.options);
      return { analogy, options, correct: options.indexOf(analogy.answer) };
    })
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "lexicon", skills: ["verbal-reasoning"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = (score: number) => {
    ctx.progression.award("verbal-reasoning", 6 + score * 4);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "lexicon",
      skills: ["verbal-reasoning"],
      success: score / round.length,
    });
    onFinished(score, round.length);
    setDone(true);
  };

  if (done) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">{right === round.length ? "🏆" : "🔗"}</div>
          <Display as="h3">{right} of {round.length} analogies solved!</Display>
          <p className="ds-muted">
            You now know {right === round.length ? "every" : "more of the"} secret{" "}
            {right === 1 ? "pattern" : "patterns"} words hide between them. Your{" "}
            <strong>verbal reasoning</strong> grew.
          </p>
          <Button big onClick={onExit}>Back home</Button>
        </Card>
      </div>
    );
  }

  const item = round[idx];
  const { analogy } = item;

  const next = () => {
    const score = right;
    if (idx + 1 >= round.length) {
      finish(score);
    } else {
      setIdx(idx + 1);
      setPicked(null);
    }
  };

  return (
    <div className="stack">
      <ProgressRibbon value={((idx + 1) / round.length) * 100} />
      <span className="pill">Analogy {idx + 1} of {round.length}</span>
      <Card className="center stack">
        <Display as="h3">
          {analogy.a} : {analogy.b} &nbsp;::&nbsp; {analogy.c} :{" "}
          <span style={{ color: "var(--accent)" }}>___</span>
        </Display>
        <Choices
          options={item.options}
          picked={picked}
          correctIndex={item.correct}
          onPick={(i) => {
            setPicked(i);
            if (i === item.correct) setRight((r) => r + 1);
          }}
        />
        {picked !== null && (
          <>
            <span className="pill" style={{ background: "var(--accent)", color: "#fff" }}>
              {RELATION_LABEL[analogy.relation]}
            </span>
            <GuideBubble>{analogy.explain}</GuideBubble>
            <Button big onClick={next}>{idx + 1 >= round.length ? "Finish →" : "Next analogy →"}</Button>
          </>
        )}
      </Card>
    </div>
  );
}
