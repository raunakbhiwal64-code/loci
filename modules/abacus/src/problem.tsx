/**
 * Shared problem UI: the answer card (number input or choice buttons) and the
 * WrongCoach — deterministic step breakdown plus one warm AI-phrased sentence
 * via ctx.ai.explain (task "abacus.explain"), fact-sheet pattern per PRD 4.3.
 */

import { useEffect, useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import type { Problem } from "./techniques.js";

/* ------------------------------------------------------------------ *
 * WrongCoach
 * ------------------------------------------------------------------ */

export function WrongCoach({
  ctx,
  problem,
  childAnswer,
  onGotIt,
}: {
  ctx: ModuleContext;
  problem: Problem;
  childAnswer: number;
  onGotIt: () => void;
}) {
  const [line, setLine] = useState<string>("");

  useEffect(() => {
    let alive = true;
    // Fact sheet: the drill engine knows exactly which steps were expected;
    // the model only phrases one warm sentence around them.
    ctx.ai
      .explain({
        task: "abacus.explain",
        context: {
          technique: problem.techniqueId,
          given: problem.prompt,
          expectedStep: problem.steps.join(" → "),
          answer: problem.answer,
          childAnswer,
        },
      })
      .then((r) => {
        if (alive) setLine(r.text);
      })
      .catch(() => {
        if (alive) setLine("Close one! Walk through the steps below and it'll click.");
      });
    return () => {
      alive = false;
    };
  }, [ctx, problem, childAnswer]);

  const rightLabel = problem.choices
    ? (problem.choices.find((c) => c.value === problem.answer)?.label ?? String(problem.answer))
    : String(problem.answer);

  return (
    <div className="stack" style={{ gap: 12 }}>
      <GuideBubble>{line || "Let me look at that one…"}</GuideBubble>
      <Card style={{ background: "var(--parchment)" }}>
        <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Here's the whole move:</p>
        <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 1.8 }}>
          {problem.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <p className="ds-muted" style={{ marginBottom: 0 }}>
          Answer: <strong>{rightLabel}</strong>
        </p>
      </Card>
      <Button onClick={onGotIt}>Got it →</Button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ProblemCard — one problem, answered once. Remount (via key) per problem.
 * ------------------------------------------------------------------ */

export function ProblemCard({
  ctx,
  problem,
  scaffold,
  pillText,
  onAnswered,
  onNext,
}: {
  ctx: ModuleContext;
  problem: Problem;
  /** Guided mode: allow revealing the technique's steps one at a time. */
  scaffold?: boolean;
  pillText?: string;
  /** Fires the moment the answer lands (feeds adaptive difficulty). */
  onAnswered: (correct: boolean) => void;
  /** Fires when the child moves on (immediately if right, after the coach if not). */
  onNext: (correct: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState(0);
  const [wrongAnswer, setWrongAnswer] = useState<number | undefined>(undefined);

  const submit = (given: number) => {
    const correct = given === problem.answer;
    onAnswered(correct);
    if (correct) {
      onNext(true);
    } else {
      setWrongAnswer(given);
    }
  };

  const submitTyped = () => {
    const n = Number.parseInt(value.trim(), 10);
    if (Number.isNaN(n)) return;
    submit(n);
  };

  if (wrongAnswer !== undefined) {
    return (
      <Card className="stack" style={{ gap: 12 }}>
        {pillText ? <span className="pill">{pillText}</span> : null}
        <Display as="h3">{problem.prompt}</Display>
        <WrongCoach
          ctx={ctx}
          problem={problem}
          childAnswer={wrongAnswer}
          onGotIt={() => {
            // Reading the breakdown is the metacognition moment — reward it.
            ctx.progression.award("metacognition", 2);
            onNext(false);
          }}
        />
      </Card>
    );
  }

  return (
    <Card className="center stack" style={{ gap: 14 }}>
      {pillText ? <span className="pill">{pillText}</span> : null}
      <Display as="h3">{problem.prompt}</Display>

      {problem.choices ? (
        <div className="row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
          {problem.choices.map((c) => (
            <Button key={c.value} big variant="ghost" onClick={() => submit(c.value)}>
              {c.label}
            </Button>
          ))}
        </div>
      ) : (
        <div className="row" style={{ justifyContent: "center" }}>
          <input
            className="text"
            style={{ maxWidth: 160, textAlign: "center", fontSize: "1.4rem" }}
            inputMode="numeric"
            autoFocus
            aria-label="your answer"
            placeholder="?"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d-]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitTyped();
            }}
          />
          <Button big onClick={submitTyped} disabled={value.trim() === ""}>
            Check
          </Button>
        </div>
      )}

      {scaffold ? (
        <div className="stack" style={{ gap: 8 }}>
          {revealed > 0 ? (
            <Card style={{ background: "var(--parchment)", textAlign: "left" }}>
              <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 1.8 }}>
                {problem.steps.slice(0, revealed).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </Card>
          ) : null}
          {revealed < problem.steps.length - 1 ? (
            <Button variant="ghost" onClick={() => setRevealed((r) => r + 1)}>
              {revealed === 0 ? "Show me a step 💡" : "One more step 💡"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
