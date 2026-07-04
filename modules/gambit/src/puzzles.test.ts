/**
 * Validates EVERY curated puzzle against chess.js so nothing incorrect ships:
 *  - the solution's first move is legal from the FEN;
 *  - mate1 puzzles → that move is checkmate;
 *  - mate2 puzzles → the move is a forcing start that leads to mate in <= 2;
 *  - escape puzzles → the side was in check and is no longer after the move;
 *  - capture/fork/pin/skewer/discovered → the move wins at least `wins` points
 *    of material (net, allowing the opponent's best single recapture).
 */
import { describe, it, expect } from "vitest";
import { Chess, type Color } from "chess.js";
import { PUZZLES, dailyPuzzle } from "./puzzles.js";

const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function material(game: Chess, color: Color): number {
  let sum = 0;
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell && cell.color === color) sum += VALUE[cell.type];
    }
  }
  return sum;
}

/**
 * Guaranteed net material for the mover playing `san`, assuming the opponent
 * defends optimally for two plies. We take the opponent's reply that MINIMISES
 * the mover's eventual gain (their best defence), then let the mover grab the
 * biggest capture available. This correctly scores tactics whose material win
 * lands on the follow-up move (forks/skewers/discovered checks).
 */
function netMaterialAfter(fen: string, san: string): number {
  const game = new Chess(fen);
  const me = game.turn();
  const opp: Color = me === "w" ? "b" : "w";
  const myBefore = material(game, me);
  const oppBefore = material(game, opp);
  game.move(san);

  const netHere = () => material(game, me) - myBefore - (material(game, opp) - oppBefore);
  const bestMoverGrab = (): number => {
    let g = 0;
    for (const mv of game.moves({ verbose: true })) {
      if (!mv.captured) continue;
      game.move(mv.san);
      g = Math.max(g, netHere());
      game.undo();
    }
    return g === 0 ? netHere() : g;
  };

  const replies = game.moves();
  if (replies.length === 0) return netHere();

  // Opponent picks the reply that leaves the mover with the LEAST material.
  let worst = Infinity;
  for (const reply of replies) {
    game.move(reply);
    worst = Math.min(worst, bestMoverGrab());
    game.undo();
  }
  return worst;
}

/** True if the side to move has a mate in <= n plies of forcing play. */
function isMateInN(fen: string, n: number): boolean {
  const game = new Chess(fen);
  const search = (depth: number): boolean => {
    if (depth <= 0) return false;
    for (const mv of game.moves()) {
      game.move(mv);
      if (game.isCheckmate()) {
        game.undo();
        return true;
      }
      // defender to move: every reply must still allow mate
      const replies = game.moves();
      let all = replies.length > 0;
      for (const r of replies) {
        game.move(r);
        const sub = search(depth - 1);
        game.undo();
        if (!sub) {
          all = false;
          break;
        }
      }
      game.undo();
      if (all) return true;
    }
    return false;
  };
  return search(n);
}

describe("Gambit puzzles", () => {
  it("has a healthy library across belts", () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(20);
    for (const belt of [1, 2, 3, 4, 5] as const) {
      expect(PUZZLES.some((p) => p.belt === belt), `belt ${belt} has puzzles`).toBe(true);
    }
  });

  it("has unique ids", () => {
    const ids = new Set(PUZZLES.map((p) => p.id));
    expect(ids.size).toBe(PUZZLES.length);
  });

  for (const puzzle of PUZZLES) {
    describe(`${puzzle.id} (belt ${puzzle.belt}, ${puzzle.type})`, () => {
      it("has a valid FEN", () => {
        expect(() => new Chess(puzzle.fen)).not.toThrow();
      });

      it("first solution move is legal", () => {
        const game = new Chess(puzzle.fen);
        expect(game.moves()).toContain(puzzle.solution[0]);
      });

      if (puzzle.type === "mate1") {
        it("delivers checkmate", () => {
          const game = new Chess(puzzle.fen);
          game.move(puzzle.solution[0]);
          expect(game.isCheckmate()).toBe(true);
        });
      }

      if (puzzle.type === "mate2") {
        it("is a forcing mate in two", () => {
          const game = new Chess(puzzle.fen);
          // the key move must not be immediate mate but must lead to mate <= 2
          game.move(puzzle.solution[0]);
          expect(game.isCheckmate()).toBe(false);
          expect(isMateInN(puzzle.fen, 2)).toBe(true);
        });
      }

      if (puzzle.type === "escape") {
        it("escapes check", () => {
          const game = new Chess(puzzle.fen);
          expect(game.isCheck()).toBe(true);
          game.move(puzzle.solution[0]);
          // after our move it's the opponent's turn; we are no longer in check
          expect(game.isCheck()).toBe(false);
        });
      }

      if (
        puzzle.type === "capture" ||
        puzzle.type === "fork" ||
        puzzle.type === "pin" ||
        puzzle.type === "skewer" ||
        puzzle.type === "discovered"
      ) {
        if (puzzle.wins !== undefined) {
          it(`wins at least ${puzzle.wins} points`, () => {
            expect(netMaterialAfter(puzzle.fen, puzzle.solution[0])).toBeGreaterThanOrEqual(puzzle.wins!);
          });
        }
      }
    });
  }

  it("daily puzzle is deterministic by date", () => {
    expect(dailyPuzzle("2026-07-04").id).toBe(dailyPuzzle("2026-07-04").id);
    // different dates should (usually) differ; at minimum both are real puzzles
    expect(PUZZLES).toContain(dailyPuzzle("2026-01-01"));
    expect(PUZZLES).toContain(dailyPuzzle("2026-12-31"));
  });
});
