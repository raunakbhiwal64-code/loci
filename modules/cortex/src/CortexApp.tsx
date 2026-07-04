import { useState } from "react";
import { Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { LogicGridView } from "./LogicGridView.js";
import { SequencesView } from "./SequencesView.js";
import { OddOneOutView } from "./OddOneOutView.js";
import { SudokuView } from "./SudokuView.js";
import { loadProgress, MAX_LEVEL, type CortexProgress, type PuzzleTypeId } from "./progress.js";
import "./cortex.css";

/**
 * Cortex module home — four puzzle types, each with a difficulty ladder and
 * per-type progress. Every puzzle is generator+solver validated (see the
 * engines); nothing unsolvable ever ships.
 */
const TYPES: { id: PuzzleTypeId; name: string; emoji: string; blurb: string }[] = [
  { id: "logicgrid", name: "Logic grids", emoji: "🕵️", blurb: "Who owns the parrot? Deduce it." },
  { id: "sequences", name: "Number sequences", emoji: "🔢", blurb: "Spot the rule, find what's next." },
  { id: "oddoneout", name: "Odd one out", emoji: "🎯", blurb: "Which doesn't belong — and why?" },
  { id: "sudoku", name: "Sudoku", emoji: "🔲", blurb: "Fill the grid, no repeats." },
];

export function CortexApp({ ctx }: { ctx: ModuleContext }) {
  const [progress, setProgress] = useState<CortexProgress>(() => loadProgress(ctx));
  const [active, setActive] = useState<PuzzleTypeId | null>(null);

  const onSolved = (p: CortexProgress) => setProgress(p);
  const back = () => {
    setProgress(loadProgress(ctx));
    setActive(null);
  };

  if (active) {
    const level = progress[active].level;
    const common = { ctx, level, onSolved, onBack: back };
    return (
      <div>
        {active === "logicgrid" && <LogicGridView {...common} />}
        {active === "sequences" && <SequencesView {...common} />}
        {active === "oddoneout" && <OddOneOutView {...common} />}
        {active === "sudoku" && <SudokuView {...common} />}
      </div>
    );
  }

  return (
    <div className="stack">
      <GuideBubble>Puzzles that make your thinking stronger. Every one can be solved — I promise. Pick a kind!</GuideBubble>
      <div className="tiles">
        {TYPES.map((t) => {
          const tp = progress[t.id];
          const pct = (tp.level / MAX_LEVEL[t.id]) * 100;
          return (
            <button key={t.id} className="tile" onClick={() => setActive(t.id)}>
              <span className="tile__emoji">{t.emoji}</span>
              <span className="tile__name">{t.name}</span>
              <span className="tile__blurb">{t.blurb}</span>
              <div style={{ marginTop: 6 }}>
                <ProgressRibbon value={pct} />
                <span className="tile__blurb">Level {tp.level} of {MAX_LEVEL[t.id]} · {tp.solved} solved</span>
              </div>
            </button>
          );
        })}
      </div>
      <Card className="center">
        <Display as="h3" style={{ fontSize: "1rem" }}>
          Hint-free solves: {Object.values(progress).reduce((s, p) => s + p.hintFree, 0)}
        </Display>
        <p className="ds-muted" style={{ margin: 0 }}>Solving without hints grows your "learning-to-learn" skill the most.</p>
      </Card>
    </div>
  );
}
