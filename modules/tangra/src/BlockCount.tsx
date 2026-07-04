/**
 * Block Count — an isometric stack of cubes; count them all, including the
 * hidden ones holding the towers up. Teaches inferring what you can't see.
 */

import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { mulberry32, randomSeed } from "./rng.js";
import { blockDimsForLevel, cubeFaces, generateBlockPuzzle, isoViewBox, paintOrder, type BlockPuzzle } from "./blocks.js";
import { DifficultyLadder, recordCleared, tangraHint, unlockedLevel } from "./ui.js";

const ROUNDS = 5;
const FACE_FILL: Record<string, string> = { top: "var(--gold)", left: "var(--ember-deep)", right: "var(--ember)" };

export function BlockCount({ ctx, onExit }: { ctx: ModuleContext; onExit: () => void }) {
  const [level, setLevel] = useState(unlockedLevel(ctx, "blocks"));
  const [seed, setSeed] = useState(() => randomSeed());
  const [round, setRound] = useState(0);
  const [right, setRight] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [hint, setHint] = useState("");
  const [done, setDone] = useState(false);

  const { maxH } = blockDimsForLevel(level);
  const puzzle: BlockPuzzle = useMemo(() => generateBlockPuzzle(level, mulberry32(seed + round * 733)), [level, seed, round]);
  const dim = puzzle.heights.length;

  const start = (l: number) => {
    setLevel(l); setSeed(randomSeed()); setRound(0); setRight(0); setPicked(null); setHint(""); setDone(false);
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "tangra", skills: ["spatial-visualisation"], difficulty: l });
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === puzzle.answerIndex) setRight((r) => r + 1);
  };

  const next = () => {
    const n = round + 1;
    setPicked(null); setHint("");
    if (n >= ROUNDS) finish();
    else setRound(n);
  };

  const finish = () => {
    const cleared = right >= Math.ceil(ROUNDS * 0.6);
    if (cleared) recordCleared(ctx, "blocks", level);
    ctx.progression.award("spatial-visualisation", 12 + right * 5);
    ctx.analytics.emit({ kind: "activity", action: "completed", moduleId: "tangra", skills: ["spatial-visualisation"], difficulty: level, success: right / ROUNDS });
    setDone(true);
  };

  const showHint = async () => {
    setHint("…");
    setHint(await tangraHint(ctx, "blocks", "Count the cubes you can see, then remember: any tall tower is standing on cubes hiding underneath!", level));
  };

  if (done) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">{right === ROUNDS ? "🏆" : "🌟"}</div>
          <Display as="h3">{right}/{ROUNDS} correct!</Display>
          <p className="ds-muted">You counted the cubes you couldn't even see. That's real 3D thinking.</p>
          <div className="row wrap" style={{ justifyContent: "center" }}>
            <Button big onClick={() => start(level)}>Play again</Button>
            {level < 5 && right >= Math.ceil(ROUNDS * 0.6) && <Button variant="ghost" big onClick={() => start(level + 1)}>Next level →</Button>}
            <Button variant="ghost" onClick={onExit}>Back to Tangra</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="spread">
        <span className="pill">Block Count · Level {level}</span>
        <Button variant="ghost" onClick={onExit}>← Back</Button>
      </div>
      <DifficultyLadder level={level} unlocked={unlockedLevel(ctx, "blocks")} onPick={start} />
      <GuideBubble>How many cubes altogether — including the hidden ones underneath?</GuideBubble>

      <Card className="center">
        <span className="pill">Round {round + 1} of {ROUNDS}</span>
        <svg viewBox={isoViewBox(dim, maxH)} style={{ width: "100%", maxWidth: 300 }} role="img" aria-label="cube stack">
          {paintOrder(puzzle.heights).map(({ r, c, z }) =>
            cubeFaces(r, c, z).map((f, i) => (
              <polygon key={`${r}-${c}-${z}-${i}`} points={f.points} fill={FACE_FILL[f.face]} stroke="var(--ink)" strokeWidth={0.7} strokeLinejoin="round" />
            ))
          )}
        </svg>
      </Card>

      <div className="row wrap" style={{ justifyContent: "center" }}>
        {puzzle.choices.map((c, i) => {
          const state = picked == null ? "" : i === puzzle.answerIndex ? "✓ " : i === picked ? "✗ " : "";
          return (
            <button key={c} className="choice" style={{ fontSize: "1.2rem", minWidth: 56 }} aria-pressed={picked === i} onClick={() => pick(i)}>
              {state}{c}
            </button>
          );
        })}
      </div>

      <div className="row wrap">
        {picked === puzzle.answerIndex ? (
          <Button big onClick={next}>{round + 1 >= ROUNDS ? "See results →" : "Next stack →"}</Button>
        ) : picked != null ? (
          <Button big onClick={next}>{round + 1 >= ROUNDS ? "See results →" : "Next stack →"}</Button>
        ) : (
          <Button variant="ghost" onClick={showHint}>Hint 🦉</Button>
        )}
      </div>
      {picked != null && picked !== puzzle.answerIndex && <GuideBubble>It was {puzzle.choices[puzzle.answerIndex]} — the hidden supporters count too!</GuideBubble>}
      {hint && <GuideBubble>{hint}</GuideBubble>}
    </div>
  );
}
