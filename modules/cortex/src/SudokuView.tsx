import { useMemo, useState } from "react";
import { Button, Card, Display } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { generateSudoku, sudokuConflicts, sudokuHint } from "./sudoku.js";
import { recordSolve, type CortexProgress } from "./progress.js";
import { HintPanel, PlayerTop, useHintLadder } from "./shared.js";
import { useSeed } from "./useSeed.js";

/**
 * Sudoku player (4×4 and 6×6). Tap a cell, tap a number to place it; givens are
 * fixed. Gentle conflict highlighting (never red-shame). Solved when the board
 * equals the unique solution. Awards deductive-reasoning; hint ladder off
 * sudokuHint.
 */
export function SudokuView(props: {
  ctx: ModuleContext;
  level: number;
  onSolved: (p: CortexProgress) => void;
  onBack: () => void;
}) {
  const [seed, nextSeed] = useSeed(props.level * 49157);
  return <SudokuRound key={seed} seed={seed} {...props} onRestart={nextSeed} />;
}

function SudokuRound({
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
  const puzzle = useMemo(() => {
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "cortex", skills: ["deductive-reasoning"], difficulty: level });
    return generateSudoku(seed, level);
  }, [seed, level, ctx]);

  const { size, boxW, boxH } = puzzle;
  const [board, setBoard] = useState<number[]>(() => [...puzzle.givens]);
  const [sel, setSel] = useState<number | null>(null);
  const [won, setWon] = useState(false);

  const conflicts = useMemo(() => sudokuConflicts(board, size, boxW, boxH), [board, size, boxW, boxH]);
  const ladder = useHintLadder(ctx, (lvl) => sudokuHint(puzzle, board, lvl));

  const place = (d: number) => {
    if (won || sel == null || puzzle.givens[sel] !== 0) return;
    const nb = [...board];
    nb[sel] = nb[sel] === d ? 0 : d;
    setBoard(nb);
    if (nb.every((v, i) => v === puzzle.solution[i])) {
      const hintFree = ladder.hintFree;
      const outcome = recordSolve(ctx, "sudoku", level, hintFree);
      ctx.progression.award("deductive-reasoning", 14 + (hintFree ? 8 : 0));
      ctx.progression.award("pattern-recognition", 5);
      if (hintFree) ctx.progression.award("metacognition", 3);
      ctx.analytics.emit({ kind: "activity", action: "completed", moduleId: "cortex", skills: ["deductive-reasoning"], difficulty: level, success: 1, hints: ladder.used });
      setWon(true);
      onSolved(outcome.progress);
    }
  };

  const digits = Array.from({ length: size }, (_, i) => i + 1);

  return (
    <div className="stack">
      <PlayerTop title={`Sudoku ${size}×${size} · Level ${level}`} onBack={onBack} />
      <Card className="center stack">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gap: 2,
            maxWidth: size === 4 ? 240 : 320,
            margin: "0 auto",
            background: "var(--ink-soft)",
            padding: 3,
            borderRadius: 8,
          }}
        >
          {board.map((v, i) => {
            const given = puzzle.givens[i] !== 0;
            const row = Math.floor(i / size);
            const col = i % size;
            const boxEdgeR = (row + 1) % boxH === 0 && row + 1 < size;
            const boxEdgeC = (col + 1) % boxW === 0 && col + 1 < size;
            return (
              <button
                key={i}
                onClick={() => !given && setSel(i)}
                style={{
                  aspectRatio: "1",
                  fontSize: "1.3rem",
                  fontWeight: given ? 800 : 500,
                  border: "none",
                  cursor: given ? "default" : "pointer",
                  background: sel === i ? "var(--parchment-2)" : given ? "var(--parchment)" : "var(--surface-raised)",
                  color: conflicts.has(i) ? "var(--ember-deep)" : "var(--ink)",
                  outline: conflicts.has(i) ? "2px solid var(--gold)" : "none",
                  marginBottom: boxEdgeR ? 2 : 0,
                  marginRight: boxEdgeC ? 2 : 0,
                }}
              >
                {v || ""}
              </button>
            );
          })}
        </div>
      </Card>

      {!won ? (
        <>
          <div className="row wrap" style={{ justifyContent: "center" }}>
            {digits.map((d) => (
              <button key={d} className="choice" style={{ fontSize: "1.2rem", minWidth: 48 }} onClick={() => place(d)}>
                {d}
              </button>
            ))}
          </div>
          <HintPanel ladder={ladder} />
        </>
      ) : (
        <Card className="center stack">
          <div className="big-emoji">🎉</div>
          <Display as="h3">Solved it!</Display>
          <p className="ds-muted">{ladder.hintFree ? "All by yourself, too. Brilliant deducing." : "Nicely worked out."}</p>
          <Button onClick={onRestart}>Another one →</Button>
        </Card>
      )}
    </div>
  );
}
