import { useState } from "react";
import { Button, Card, Display, Modal } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { generateSequence, sequenceHint } from "./sequences.js";
import { recordSolve, type CortexProgress } from "./progress.js";
import { phraseExplain } from "./hints.js";
import { HintPanel, PlayerTop, useHintLadder } from "./shared.js";
import { useSeed } from "./useSeed.js";

/**
 * Number-sequence player. Shows the run of terms with a "?" box, four options
 * (answer included exactly once), and the hint ladder off sequenceHint. On a
 * correct pick we award inductive-reasoning + pattern-recognition and offer the
 * deterministic step-by-step reasoning replay.
 */
export function SequencesView(props: {
  ctx: ModuleContext;
  level: number;
  onSolved: (p: CortexProgress) => void;
  onBack: () => void;
}) {
  const [seed, nextSeed] = useSeed(props.level * 104729);
  return <SequenceRound key={seed} seed={seed} {...props} onRestart={nextSeed} />;
}

function SequenceRound({
  ctx,
  level,
  seed,
  onSolved,
  onBack,
  onRestart,
}: {
  ctx: ModuleContext;
  level: number;
  seed: number;
  onSolved: (p: CortexProgress) => void;
  onBack: () => void;
  onRestart: () => void;
}) {
  const [puzzle] = useState(() => {
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "cortex", skills: ["inductive-reasoning"], difficulty: level });
    return generateSequence(seed, level);
  });
  const [picked, setPicked] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [reasonLines, setReasonLines] = useState<string[]>([]);

  const ladder = useHintLadder(ctx, (lvl) => sequenceHint(puzzle, lvl));

  const pick = (value: number) => {
    if (won) return;
    setPicked(value);
    if (value !== puzzle.answer) return;
    const hintFree = ladder.hintFree;
    const outcome = recordSolve(ctx, "sequences", level, hintFree);
    ctx.progression.award("inductive-reasoning", 12 + (hintFree ? 8 : 0));
    ctx.progression.award("pattern-recognition", 6);
    if (hintFree) ctx.progression.award("metacognition", 3);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "cortex",
      skills: ["inductive-reasoning", "pattern-recognition"],
      difficulty: level,
      success: 1,
      hints: ladder.used,
    });
    setWon(true);
    onSolved(outcome.progress);
  };

  const openReason = async () => {
    setShowReason(true);
    setReasonLines(["…"]);
    const first = await phraseExplain(ctx, puzzle.reasoning[0] ?? "", []);
    setReasonLines([first, ...puzzle.reasoning.slice(1)]);
  };

  const optClass = (value: number): string => {
    if (won && value === puzzle.answer) return "cx-opt cx-opt--right";
    if (!won && picked === value && value !== puzzle.answer) return "cx-opt cx-opt--wrong";
    return "cx-opt";
  };

  return (
    <div className="stack">
      <PlayerTop title={`Number sequence · Level ${level}`} onBack={onBack} />

      <Card className="stack">
        <Display as="h3">What comes next?</Display>
        <div className="cx-seq" style={{ marginTop: 8 }}>
          {puzzle.terms.map((t, i) => (
            <span className="cx-seq__term" key={i}>
              {t}
            </span>
          ))}
          <span className="cx-seq__q" aria-label="the missing number">
            ?
          </span>
        </div>
      </Card>

      <div className="cx-options">
        {puzzle.options.map((o) => (
          <button key={o} className={optClass(o)} onClick={() => pick(o)} disabled={won}>
            {o}
          </button>
        ))}
      </div>

      {picked !== null && picked !== puzzle.answer && !won ? (
        <p className="ds-muted">Ooh, not that one — look at how each number changes and try again. 💛</p>
      ) : null}

      {!won ? (
        <HintPanel ladder={ladder} />
      ) : (
        <Card className="center stack">
          <div className="big-emoji">🌟</div>
          <Display as="h3">Yes — {puzzle.answer}!</Display>
          <p className="ds-muted">
            {ladder.hintFree ? "You spotted the pattern all by yourself." : "Nicely worked out."}
          </p>
          <div className="row wrap" style={{ justifyContent: "center" }}>
            <Button variant="ghost" onClick={openReason}>
              Show me the reasoning
            </Button>
            <Button onClick={onRestart}>Another one →</Button>
          </div>
        </Card>
      )}

      {showReason ? (
        <Modal onClose={() => setShowReason(false)}>
          <Display as="h3">Following the pattern</Display>
          <p className="ds-muted" style={{ marginTop: 6 }}>
            {puzzle.ruleText}
          </p>
          <ol className="cx-trace" style={{ marginTop: 12 }}>
            {reasonLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
          <Button big style={{ marginTop: 16 }} onClick={() => setShowReason(false)}>
            Got it!
          </Button>
        </Modal>
      ) : null}
    </div>
  );
}
