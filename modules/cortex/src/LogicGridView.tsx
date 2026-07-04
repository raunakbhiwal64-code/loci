import { useState } from "react";
import { Button, Card, Display, Modal } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import {
  clueText,
  emptyMarks,
  generateLogicGrid,
  gridHint,
  gridIsSolved,
  solveGridWithTrace,
  type CellMark,
} from "./logicgrid.js";
import { recordSolve, type CortexProgress } from "./progress.js";
import { phraseExplain } from "./hints.js";
import { HintPanel, PlayerTop, useHintLadder } from "./shared.js";
import { useSeed } from "./useSeed.js";

const CYCLE: Record<CellMark, CellMark> = { none: "yes", yes: "no", no: "none" };
const GLYPH: Record<CellMark, string> = { none: "", yes: "✓", no: "✗" };

/**
 * Logic-grid player. Renders one NxN block per category (rows = people, cols =
 * values); tapping a cell cycles blank → ✓ → ✗. Clues are listed, the hint
 * ladder runs off gridHint, and on a correct Check we celebrate, offer the
 * solver's reasoning trace, and award deductive-reasoning + pattern-recognition.
 *
 * The outer component owns the seed; the actual round is keyed by seed so a new
 * puzzle remounts with clean state (no setState-in-render).
 */
export function LogicGridView(props: {
  ctx: ModuleContext;
  level: number;
  onSolved: (p: CortexProgress) => void;
  onBack: () => void;
}) {
  const [seed, nextSeed] = useSeed(props.level * 7919);
  return <LogicGridRound key={seed} seed={seed} {...props} onRestart={nextSeed} />;
}

function LogicGridRound({
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
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "cortex", skills: ["deductive-reasoning"], difficulty: level });
    return generateLogicGrid(seed, level);
  });
  const [marks, setMarks] = useState<CellMark[][][]>(() => emptyMarks(puzzle));
  const [won, setWon] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showReason, setShowReason] = useState(false);
  const [reasonLines, setReasonLines] = useState<string[]>([]);

  const ladder = useHintLadder(ctx, (lvl) => gridHint(puzzle, marks, lvl));

  const cycle = (c: number, q: number, v: number) => {
    if (won) return;
    setMarks((prev) => {
      const copy = prev.map((cat) => cat.map((row) => row.slice()));
      copy[c][q][v] = CYCLE[copy[c][q][v]];
      return copy;
    });
    setFeedback("");
  };

  const check = () => {
    if (!gridIsSolved(puzzle, marks)) {
      setFeedback("Not quite yet — some boxes don't match the clues. Keep going, you're close! 💛");
      return;
    }
    const hintFree = ladder.hintFree;
    const outcome = recordSolve(ctx, "logicgrid", level, hintFree);
    ctx.progression.award("deductive-reasoning", 14 + (hintFree ? 8 : 0));
    ctx.progression.award("pattern-recognition", 5);
    if (hintFree) ctx.progression.award("metacognition", 3);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "cortex",
      skills: ["deductive-reasoning", "pattern-recognition"],
      difficulty: level,
      success: 1,
      hints: ladder.used,
    });
    setWon(true);
    onSolved(outcome.progress);
  };

  const openReason = async () => {
    setShowReason(true);
    const { steps } = solveGridWithTrace(puzzle);
    const fallback = steps.map((s) => s.text);
    setReasonLines(["…"]);
    const first = await phraseExplain(ctx, fallback[0] ?? "", []);
    setReasonLines([first, ...fallback.slice(1)]);
  };

  return (
    <div className="stack">
      <PlayerTop title={`Logic grid · Level ${level}`} onBack={onBack} />

      <Card>
        <Display as="h3">Who is who?</Display>
        <p className="ds-muted" style={{ marginTop: 6 }}>
          Tap a box once for ✓ (yes), again for ✗ (no), again to clear it. Use the clues to fill it in.
        </p>
        <ul className="cx-clues" style={{ marginTop: 12 }}>
          {puzzle.clues.map((clue, i) => (
            <li className="cx-clue" key={i}>
              <span className="cx-clue__n">{i + 1}</span>
              <span>{clueText(puzzle, clue)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="cx-grid">
          {puzzle.categories.map((cat, c) => (
            <div className="cx-grid__block" key={c}>
              <h4 className="cx-grid__title">
                Who {cat.verb} what? <span className="ds-muted">({cat.name})</span>
              </h4>
              <table className="cx-grid__table">
                <thead>
                  <tr>
                    <th className="cx-grid__corner" />
                    {cat.values.map((val, v) => (
                      <th className="cx-grid__colh" key={v}>
                        <span aria-hidden>{val.emoji}</span>
                        {val.short}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {puzzle.people.map((person, q) => (
                    <tr key={q}>
                      <th className="cx-grid__rowh" scope="row">
                        {person}
                      </th>
                      {cat.values.map((val, v) => {
                        const m = marks[c][q][v];
                        return (
                          <td key={v}>
                            <button
                              className={`cx-cell ${m === "yes" ? "cx-cell--yes" : m === "no" ? "cx-cell--no" : ""}`}
                              onClick={() => cycle(c, q, v)}
                              aria-label={`${person} ${cat.verb} ${val.short}: ${m}`}
                            >
                              {GLYPH[m]}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </Card>

      {!won ? (
        <>
          {feedback ? <p className="ds-muted">{feedback}</p> : null}
          <HintPanel ladder={ladder} />
          <Button big onClick={check}>
            Check my answer
          </Button>
        </>
      ) : (
        <Card className="center stack">
          <div className="big-emoji">🏆</div>
          <Display as="h3">You cracked it!</Display>
          <p className="ds-muted">
            {ladder.hintFree ? "And all on your own — brilliant deducing!" : "Lovely, careful thinking."}
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
          <Display as="h3">How the clues untangle</Display>
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
