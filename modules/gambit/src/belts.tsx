/**
 * Curriculum belts 1–5 — a lesson path whose progress persists in ctx.storage.
 * Each belt is a set of puzzles the child solves on the board. Solving a Belt-4
 * tactic schedules an SRS review ("tactic:<type>:<id>"). Warm, non-shaming copy.
 */
import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { Chess, type Square } from "chess.js";
import { Board, legalTargets } from "./board/Board.js";
import { PUZZLES, puzzlesForBelt, type Belt, type Puzzle } from "./puzzles.js";

const BELTS: { belt: Belt; emoji: string; name: string; blurb: string }[] = [
  { belt: 1, emoji: "♟️", name: "Pieces & Powers", blurb: "How each piece moves and captures." },
  { belt: 2, emoji: "📜", name: "Rules of the Game", blurb: "Check, escaping, and pawn dreams." },
  { belt: 3, emoji: "🐣", name: "Baby Tactics", blurb: "Free pieces and getting out of check." },
  { belt: 4, emoji: "⚔️", name: "The Big Four", blurb: "Forks, pins, skewers, discovered attacks." },
  { belt: 5, emoji: "👑", name: "Checkmates", blurb: "Trap the king — back-rank and more." },
];

const PROGRESS_KEY = "belts:solved";

type SolvedMap = Record<string, true>;

function readSolved(ctx: ModuleContext): SolvedMap {
  return ctx.storage.get<SolvedMap>(PROGRESS_KEY) ?? {};
}
function markSolved(ctx: ModuleContext, id: string) {
  const s = readSolved(ctx);
  s[id] = true;
  ctx.storage.set(PROGRESS_KEY, s);
}

export function beltProgress(ctx: ModuleContext, belt: Belt): { solved: number; total: number } {
  const solved = readSolved(ctx);
  const items = puzzlesForBelt(belt);
  return { solved: items.filter((p) => solved[p.id]).length, total: items.length };
}

/** Belt path overview — pick a belt to practise. */
export function BeltPath({ ctx, onOpen }: { ctx: ModuleContext; onOpen: (belt: Belt) => void }) {
  return (
    <div className="stack">
      <GuideBubble>Follow the belts from the top. Each one teaches a new chess superpower!</GuideBubble>
      <div className="tiles">
        {BELTS.map((b) => {
          const { solved, total } = beltProgress(ctx, b.belt);
          const done = total > 0 && solved === total;
          return (
            <button key={b.belt} className="tile" onClick={() => onOpen(b.belt)}>
              <span className="tile__emoji">{done ? "🏅" : b.emoji}</span>
              <span className="tile__name">
                Belt {b.belt}: {b.name}
              </span>
              <span className="tile__blurb">{b.blurb}</span>
              <ProgressRibbon value={total ? (solved / total) * 100 : 0} />
              <span className="tile__blurb">
                {solved}/{total} solved
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Practise all puzzles in a belt, one at a time. */
export function BeltRun({ ctx, belt, onExit }: { ctx: ModuleContext; belt: Belt; onExit: () => void }) {
  const puzzles = useMemo(() => puzzlesForBelt(belt), [belt]);
  const [idx, setIdx] = useState(0);
  const puzzle = puzzles[idx];

  if (!puzzle) {
    return (
      <div className="stack">
        <Display as="h3">Belt {belt}</Display>
        <p className="ds-muted">No puzzles here yet — check back soon!</p>
        <Button onClick={onExit}>← Back</Button>
      </div>
    );
  }

  const isLast = idx + 1 >= puzzles.length;
  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onExit}>
          ← Belts
        </Button>
        <span className="pill">
          Puzzle {idx + 1} of {puzzles.length}
        </span>
      </div>
      <PuzzleBoard
        key={puzzle.id}
        ctx={ctx}
        puzzle={puzzle}
        onSolved={() => {
          markSolved(ctx, puzzle.id);
          if (belt === 4) ctx.srs.schedule("gambit", `tactic:${puzzle.type}:${puzzle.id}`);
          ctx.progression.award("pattern-recognition", 8);
          if (puzzle.type === "mate1" || puzzle.type === "mate2") ctx.progression.award("planning-foresight", 8);
          ctx.analytics.emit({
            kind: "content",
            action: "completed",
            itemId: puzzle.id,
            pass: true,
          });
        }}
        onNext={() => (isLast ? onExit() : setIdx((i) => i + 1))}
        nextLabel={isLast ? "Finish belt →" : "Next puzzle →"}
      />
    </div>
  );
}

/**
 * A single solvable puzzle on the board. The child selects a piece, then a
 * target; if the move matches the solution's first move (SAN), it's solved.
 * Non-shaming: wrong tries just gently reset with an encouraging nudge.
 */
export function PuzzleBoard({
  puzzle,
  onSolved,
  onNext,
  nextLabel = "Next →",
}: {
  ctx?: ModuleContext;
  puzzle: Puzzle;
  /** Called once when solved; `firstTry` is true if there were no wrong guesses. */
  onSolved?: (firstTry: boolean) => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  const [game] = useState(() => new Chess(puzzle.fen));
  const [, force] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [solved, setSolved] = useState(false);
  const [wrongTries, setWrongTries] = useState(0);
  const [nudge, setNudge] = useState<string>(puzzle.ask);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  const flipped = new Chess(puzzle.fen).turn() === "b";
  const targets = selected ? legalTargets(game, selected) : [];

  const onSquare = (square: Square) => {
    if (solved) return;
    const piece = game.get(square);
    if (selected && targets.includes(square)) {
      // try the move
      const before = game.fen();
      const move = game.move({ from: selected, to: square, promotion: "q" });
      const san = move.san;
      setLastMove({ from: selected, to: square });
      setSelected(null);
      if (san === puzzle.solution[0]) {
        setSolved(true);
        setNudge("Yes! That's it. 🌟");
        onSolved?.(wrongTries === 0);
      } else {
        // undo — a gentle retry, never a penalty
        game.undo();
        setLastMove(null);
        void before;
        setWrongTries((w) => w + 1);
        setNudge("Not quite — try another idea. You've got this!");
      }
      force((n) => n + 1);
      return;
    }
    // select own piece whose side is to move
    if (piece && piece.color === game.turn()) {
      setSelected(square);
    } else {
      setSelected(null);
    }
  };

  return (
    <div className="stack">
      <GuideBubble>{nudge}</GuideBubble>
      <Board
        game={game}
        selected={selected}
        targets={targets}
        lastMove={lastMove}
        flipped={flipped}
        onSquare={onSquare}
        interactive={!solved}
      />
      {solved && (
        <Card className="center stack">
          <div className="big-emoji">🏅</div>
          <Display as="h3">Solved!</Display>
          <Button big onClick={onNext}>
            {nextLabel}
          </Button>
        </Card>
      )}
    </div>
  );
}

export function allSolvedCount(ctx: ModuleContext): { solved: number; total: number } {
  const s = readSolved(ctx);
  return { solved: PUZZLES.filter((p) => s[p.id]).length, total: PUZZLES.length };
}
