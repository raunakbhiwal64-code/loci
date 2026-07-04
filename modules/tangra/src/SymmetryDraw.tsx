/**
 * Symmetry Draw — a pattern sits on the left of a mirror line; tap cells on the
 * right to complete its mirror image. Builds a feel for reflective symmetry.
 */

import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { mulberry32, randomSeed } from "./rng.js";
import { cellId, correctCount, generateSymmetryPuzzle, isSolved, type SymmetryPuzzle } from "./symmetry.js";
import { DifficultyLadder, recordCleared, tangraHint, unlockedLevel } from "./ui.js";

export function SymmetryDraw({ ctx, onExit }: { ctx: ModuleContext; onExit: () => void }) {
  const [level, setLevel] = useState(unlockedLevel(ctx, "symmetry"));
  const [seed, setSeed] = useState(() => randomSeed());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState("");
  const [done, setDone] = useState(false);

  const puzzle: SymmetryPuzzle = useMemo(() => generateSymmetryPuzzle(level, mulberry32(seed)), [level, seed]);
  const patternIds = useMemo(() => new Set(puzzle.pattern.map(cellId)), [puzzle]);
  const mid = puzzle.cols / 2;

  const start = (l: number) => {
    setLevel(l); setSeed(randomSeed()); setSelected(new Set()); setHint(""); setDone(false);
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "tangra", skills: ["spatial-visualisation"], difficulty: l });
  };

  const toggle = (x: number, y: number) => {
    if (done || x < mid) return; // only the right half is drawable
    const id = cellId({ x, y });
    const nx = new Set(selected);
    if (nx.has(id)) nx.delete(id); else nx.add(id);
    setSelected(nx);
    if (isSolved(nx, puzzle.target)) finish();
  };

  const finish = () => {
    recordCleared(ctx, "symmetry", level);
    ctx.progression.award("spatial-visualisation", 14);
    ctx.analytics.emit({ kind: "activity", action: "completed", moduleId: "tangra", skills: ["spatial-visualisation"], difficulty: level, success: 1 });
    setDone(true);
  };

  const showHint = async () => {
    setHint("…");
    setHint(await tangraHint(ctx, "symmetry", "Imagine a mirror on the line. Each filled cell on the left has a twin the same distance on the right.", level));
  };

  const px = Math.min(320, puzzle.cols * 40);
  const cell = px / puzzle.cols;

  return (
    <div className="stack">
      <div className="spread">
        <span className="pill">Symmetry Draw · Level {level}</span>
        <Button variant="ghost" onClick={onExit}>← Back</Button>
      </div>
      <DifficultyLadder level={level} unlocked={unlockedLevel(ctx, "symmetry")} onPick={start} />
      <GuideBubble>Complete the mirror image! Tap cells on the right so both sides match across the line.</GuideBubble>

      <Card className="center">
        <svg viewBox={`0 0 ${px} ${(puzzle.rows / puzzle.cols) * px}`} style={{ width: "100%", maxWidth: px }} role="img" aria-label="symmetry grid">
          {Array.from({ length: puzzle.rows }, (_, y) =>
            Array.from({ length: puzzle.cols }, (_, x) => {
              const isPattern = patternIds.has(cellId({ x, y }));
              const isSel = selected.has(cellId({ x, y }));
              const fill = isPattern ? "var(--ember-deep)" : isSel ? "var(--accent)" : "var(--surface-raised)";
              return (
                <rect
                  key={`${x}-${y}`}
                  x={x * cell} y={y * cell} width={cell} height={cell}
                  fill={fill} stroke="var(--line)" strokeWidth={1}
                  style={{ cursor: x >= mid && !done ? "pointer" : "default" }}
                  onClick={() => toggle(x, y)}
                />
              );
            })
          )}
          {/* the mirror line */}
          <line x1={mid * cell} y1={0} x2={mid * cell} y2={(puzzle.rows / puzzle.cols) * px} stroke="var(--gold)" strokeWidth={2} strokeDasharray="4 3" />
        </svg>
      </Card>

      {done ? (
        <Card className="center stack">
          <div className="big-emoji">🎉</div>
          <Display as="h3">Perfectly mirrored!</Display>
          <div className="row wrap" style={{ justifyContent: "center" }}>
            <Button big onClick={() => start(level)}>Play again</Button>
            {level < 5 && <Button variant="ghost" big onClick={() => start(level + 1)}>Next level →</Button>}
            <Button variant="ghost" onClick={onExit}>Back to Tangra</Button>
          </div>
        </Card>
      ) : (
        <div className="row wrap" style={{ justifyContent: "space-between" }}>
          <span className="ds-muted">{correctCount(selected, puzzle.target)} / {puzzle.target.length} matched</span>
          <Button variant="ghost" onClick={showHint}>Hint 🦉</Button>
        </div>
      )}
      {hint && !done && <GuideBubble>{hint}</GuideBubble>}
    </div>
  );
}
