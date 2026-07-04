import { useState } from "react";
import { Button, Card, Display, Modal } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { oddHint, oddRounds, type OddOneOutRound } from "./oddoneout.js";
import { recordSolve, type CortexProgress } from "./progress.js";
import { phraseExplain } from "./hints.js";
import { HintPanel, PlayerTop, useHintLadder } from "./shared.js";
import { useSeed } from "./useSeed.js";

/**
 * Odd-one-out player. A short set of rounds; in each the child first picks which
 * item is odd, then picks WHY. Correct on both → award inductive-reasoning +
 * pattern-recognition and reveal the deterministic explanation. The hint ladder
 * runs off oddHint for the current round.
 */
export function OddOneOutView(props: {
  ctx: ModuleContext;
  level: number;
  onSolved: (p: CortexProgress) => void;
  onBack: () => void;
}) {
  const [seed, nextSeed] = useSeed(props.level * 15485863);
  return <OddSet key={seed} seed={seed} {...props} onRestart={nextSeed} />;
}

function OddSet({
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
  const [rounds] = useState<OddOneOutRound[]>(() => {
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "cortex", skills: ["inductive-reasoning"], difficulty: level });
    return oddRounds(seed, level, 3);
  });
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"which" | "why">("which");
  const [pickedItem, setPickedItem] = useState<number | null>(null);
  const [pickedReason, setPickedReason] = useState<number | null>(null);
  const [hintsAcrossSet, setHintsAcrossSet] = useState(0);
  const [done, setDone] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [explainText, setExplainText] = useState("");

  const round = rounds[idx];
  const ladder = useHintLadder(ctx, (lvl) => oddHint(round, lvl));

  const pickItem = (i: number) => {
    if (phase !== "which") return;
    setPickedItem(i);
    if (i === round.oddIndex) setPhase("why");
  };

  const pickReason = (i: number) => {
    if (phase !== "why" || pickedReason !== null) return;
    setPickedReason(i);
    if (i !== round.correctReason) return;
    // Round solved — reveal explanation, then advance.
    void revealAndAdvance();
  };

  const revealAndAdvance = async () => {
    setShowReason(true);
    setExplainText("…");
    const text = await phraseExplain(ctx, round.explanation, [round.choices[round.oddIndex]]);
    setExplainText(text);
    setHintsAcrossSet((n) => n + ladder.used);
  };

  const nextRound = () => {
    setShowReason(false);
    const n = idx + 1;
    if (n >= rounds.length) {
      finish();
      return;
    }
    setIdx(n);
    setPhase("which");
    setPickedItem(null);
    setPickedReason(null);
    ladder.reset();
  };

  const finish = () => {
    const hintFree = hintsAcrossSet === 0 && ladder.used === 0;
    const outcome = recordSolve(ctx, "oddoneout", level, hintFree);
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
      hints: hintsAcrossSet + ladder.used,
    });
    setDone(true);
    onSolved(outcome.progress);
  };

  if (done) {
    return (
      <div className="stack">
        <PlayerTop title={`Odd one out · Level ${level}`} onBack={onBack} />
        <Card className="center stack">
          <div className="big-emoji">🏆</div>
          <Display as="h3">All {rounds.length} sorted!</Display>
          <p className="ds-muted">You found what didn't fit — and knew exactly why. That's sharp thinking.</p>
          <Button big onClick={onRestart}>
            Play again →
          </Button>
        </Card>
      </div>
    );
  }

  const itemClass = (i: number): string => {
    if (phase === "why" && i === round.oddIndex) return "cx-opt cx-opt--right";
    if (phase === "which" && pickedItem === i && i !== round.oddIndex) return "cx-opt cx-opt--wrong";
    return "cx-opt";
  };

  const reasonClass = (i: number): string => {
    if (pickedReason === null) return "cx-opt cx-reason";
    if (i === round.correctReason) return "cx-opt cx-reason cx-opt--right";
    if (i === pickedReason) return "cx-opt cx-reason cx-opt--wrong";
    return "cx-opt cx-reason";
  };

  return (
    <div className="stack">
      <PlayerTop title={`Odd one out · Level ${level}`} onBack={onBack} />

      <Card className="stack">
        <span className="pill">
          Round {idx + 1} of {rounds.length}
        </span>
        <Display as="h3">
          {phase === "which" ? "Which one doesn't belong?" : "Great — now, why is it the odd one?"}
        </Display>
        {phase === "which" ? (
          <div className="cx-options">
            {round.choices.map((c, i) => (
              <button key={i} className={itemClass(i)} onClick={() => pickItem(i)}>
                {c}
              </button>
            ))}
          </div>
        ) : (
          <>
            <p className="ds-muted">
              You picked <strong>{round.choices[round.oddIndex]}</strong>. Now choose the reason:
            </p>
            <div className="stack">
              {round.reasons.map((r, i) => (
                <button key={i} className={reasonClass(i)} onClick={() => pickReason(i)} disabled={pickedReason !== null}>
                  {r}
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      {phase === "which" && pickedItem !== null && pickedItem !== round.oddIndex ? (
        <p className="ds-muted">Hmm, that one does fit with some others. Look again for the real odd one. 💛</p>
      ) : null}
      {phase === "why" && pickedReason !== null && pickedReason !== round.correctReason ? (
        <p className="ds-muted">Not quite the reason — check which one is actually true of all the others.</p>
      ) : null}

      {!showReason ? <HintPanel ladder={ladder} /> : null}

      {showReason ? (
        <Modal onClose={nextRound}>
          <div className="center">
            <div className="big-emoji">✨</div>
          </div>
          <Display as="h3">Exactly!</Display>
          <p style={{ marginTop: 10, lineHeight: 1.5 }}>{explainText}</p>
          <Button big style={{ marginTop: 16 }} onClick={nextRound}>
            {idx + 1 >= rounds.length ? "Finish →" : "Next round →"}
          </Button>
        </Modal>
      ) : null}
    </div>
  );
}
