/**
 * Rotation Match — the base shape sits up top; tap the candidate that is the
 * SAME shape simply turned. The teaching point (a mirror is not a rotation)
 * lives in shapes.ts; here we just render and score.
 */

import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { mulberry32, randomSeed } from "./rng.js";
import { generateRotationPuzzle, type RotationPuzzle } from "./shapes.js";
import {
  DifficultyLadder,
  ShapeSvg,
  recordCleared,
  tangraHint,
  unlockedLevel,
} from "./ui.js";

const ROUNDS = 5;

export function RotationMatch({ ctx, onExit }: { ctx: ModuleContext; onExit: () => void }) {
  const [level, setLevel] = useState(unlockedLevel(ctx, "rotation"));
  const [seed, setSeed] = useState(() => randomSeed());
  const [round, setRound] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [tries, setTries] = useState(0); // wrong taps this round
  const [picked, setPicked] = useState<number | null>(null);
  const [hint, setHint] = useState("");
  const [done, setDone] = useState(false);

  const rng = useMemo(() => mulberry32(seed + round * 101), [seed, round]);
  const puzzle: RotationPuzzle = useMemo(() => generateRotationPuzzle(level, rng), [level, rng]);

  const start = (l: number) => {
    setLevel(l);
    setSeed(randomSeed());
    setRound(0);
    setFirstTry(0);
    setTries(0);
    setPicked(null);
    setHint("");
    setDone(false);
    ctx.analytics.emit({
      kind: "activity",
      action: "started",
      moduleId: "tangra",
      skills: ["spatial-visualisation"],
      difficulty: l,
    });
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    const right = i === puzzle.correctIndex;
    if (right) {
      if (tries === 0) setFirstTry((f) => f + 1);
      setPicked(i);
    } else {
      setTries((t) => t + 1);
      // let them try again — show which was wrong briefly by marking picked-wrong
      setPicked(i);
      setTimeout(() => setPicked((p) => (p === i ? null : p)), 650);
    }
  };

  const next = () => {
    const n = round + 1;
    setPicked(null);
    setTries(0);
    setHint("");
    if (n >= ROUNDS) finish();
    else setRound(n);
  };

  const finish = () => {
    const success = firstTry / ROUNDS;
    const cleared = firstTry >= Math.ceil(ROUNDS * 0.6);
    if (cleared) recordCleared(ctx, "rotation", level);
    ctx.progression.award("spatial-visualisation", 12 + firstTry * 5);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "tangra",
      skills: ["spatial-visualisation"],
      difficulty: level,
      success,
    });
    setDone(true);
  };

  const showHint = async () => {
    setHint("…");
    setHint(
      await tangraHint(
        ctx,
        "rotation",
        "Turn the top shape in your head — a quarter turn at a time. A flipped shape looks reversed; that one is a trick!",
        level
      )
    );
  };

  if (done) {
    const perfect = firstTry === ROUNDS;
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">{perfect ? "🏆" : "🌟"}</div>
          <Display as="h3">{firstTry}/{ROUNDS} on the first try!</Display>
          <p className="ds-muted">
            You pictured each shape turning in your mind — that's spatial thinking growing strong.
          </p>
          <div className="row wrap" style={{ justifyContent: "center" }}>
            <Button big onClick={() => start(level)}>Play again</Button>
            {level < 5 && firstTry >= Math.ceil(ROUNDS * 0.6) && (
              <Button variant="ghost" big onClick={() => start(level + 1)}>Next level →</Button>
            )}
            <Button variant="ghost" onClick={onExit}>Back to Tangra</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="spread">
        <span className="pill">Rotation Match · Level {level}</span>
        <Button variant="ghost" onClick={onExit}>← Back</Button>
      </div>
      <DifficultyLadder level={level} unlocked={unlockedLevel(ctx, "rotation")} onPick={start} />
      <ProgressRibbon value={(round / ROUNDS) * 100} />
      <GuideBubble>Which one is the top shape, just turned around? Watch out for the sneaky mirror!</GuideBubble>

      <Card className="center stack">
        <span className="pill">Round {round + 1} of {ROUNDS}</span>
        <ShapeSvg shape={puzzle.base} px={140} />
      </Card>

      <div className="tg-cands">
        {puzzle.candidates.map((cand, i) => {
          const isPicked = picked === i;
          const state =
            picked === null
              ? undefined
              : i === puzzle.correctIndex
              ? "right"
              : isPicked
              ? "wrong"
              : "miss";
          return (
            <button
              key={i}
              className="tg-cand"
              data-state={state}
              disabled={picked === puzzle.correctIndex}
              onClick={() => pick(i)}
              aria-label={`Candidate ${i + 1}`}
            >
              <ShapeSvg shape={cand.shape} px={120} />
            </button>
          );
        })}
      </div>

      <div className="row wrap">
        {picked === puzzle.correctIndex ? (
          <Button big onClick={next}>{round + 1 >= ROUNDS ? "See results →" : "Next shape →"}</Button>
        ) : (
          <Button variant="ghost" onClick={showHint}>Hint 🦉</Button>
        )}
      </div>
      {hint && <GuideBubble>{hint}</GuideBubble>}
    </div>
  );
}
