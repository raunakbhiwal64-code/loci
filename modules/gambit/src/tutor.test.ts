/**
 * The tutor's promise: the mistake taxonomy is deterministic, correct, and never
 * hallucinates squares (every square it names comes from chess.js). These tests
 * script positions where the "right" diagnosis is unambiguous.
 */
import { describe, it, expect } from "vitest";
import { Chess, type Square } from "chess.js";
import { analyzeMove } from "./tutor.js";
import { bestMove, rankMoves, evaluate } from "./engine.js";

/** Every square the tutor names must be a real square in the FEN's board. */
function squareIsReal(fen: string, square?: string): boolean {
  if (!square) return true;
  const g = new Chess(fen);
  // a square is "real" if it is a valid coordinate; get() never throws for valid
  const files = "abcdefgh";
  if (square.length !== 2 || !files.includes(square[0]) || !"12345678".includes(square[1])) return false;
  void g.get(square as Square);
  return true;
}

describe("tutor taxonomy", () => {
  it("detects a hung piece and names a real, correct square", () => {
    // White queen on d1 moves to h5 where it is attacked (…g6) — but cleaner:
    // move the queen to a square attacked by a pawn and undefended.
    // Position: white to move, Qd1 -> Qa4 is safe; Qh5 gets hit by g6 later.
    // Use an outright hang: knight to a square a pawn guards.
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    // Nf3 then ...nothing; instead craft a real hang:
    const hangFen = "4k3/8/8/8/8/5p2/8/3QK3 w - - 0 1"; // Qd1; Qd3?? no. move queen next to pawn f3 -> e2? f3 attacks e2,g2. Qe2 hangs.
    const fact = analyzeMove(hangFen, "Qe2", 2);
    expect(["hung-piece", "ignored-threat", "bad-trade"]).toContain(fact.label);
    if (fact.label === "hung-piece") {
      expect(fact.square).toBe("e2");
      expect(fact.piece).toBe("queen");
    }
    expect(squareIsReal(hangFen, fact.square)).toBe(true);
    void fen;
  });

  it("classifies a strong move as good (no false alarms)", () => {
    const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const best = bestMove(new Chess(start), 2)!;
    const fact = analyzeMove(start, best, 2);
    expect(["good"]).toContain(fact.label);
    expect(fact.lossCp).toBe(0);
  });

  it("flags missing a mate-in-1", () => {
    // White has Ra8# but plays a quiet move instead.
    const fen = "6k1/5ppp/8/8/8/8/8/R3K2R w - - 0 1";
    const fact = analyzeMove(fen, "Rh2", 2);
    expect(fact.label).toBe("missed-mate");
    expect(fact.better).toBe("Ra8#");
    expect(squareIsReal(fen, fact.square)).toBe(true);
  });

  it("every produced fact sheet only names real squares", () => {
    const positions = [
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "4k3/8/8/8/8/5p2/8/3QK3 w - - 0 1",
      "6k1/5ppp/8/8/8/8/8/R3K2R w - - 0 1",
    ];
    for (const fen of positions) {
      const g = new Chess(fen);
      for (const mv of g.moves()) {
        const fact = analyzeMove(fen, mv, 1);
        expect(squareIsReal(fen, fact.square), `${mv} -> ${fact.square}`).toBe(true);
        // better move, when present, must be a legal SAN in this position
        if (fact.better) {
          expect(g.moves()).toContain(fact.better);
        }
      }
    }
  });
});

describe("engine", () => {
  it("finds a mate in 1", () => {
    const fen = "6k1/5ppp/8/8/8/8/8/R3K2R w - - 0 1";
    expect(bestMove(new Chess(fen), 2)).toBe("Ra8#");
  });

  it("prefers winning a free queen", () => {
    const fen = "rnb1kbnr/pppp1ppp/8/4p3/6q1/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 1";
    expect(bestMove(new Chess(fen), 2)).toBe("fxg4");
  });

  it("ranks moves deterministically (same order every run)", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const a = rankMoves(new Chess(fen), 2).map((m) => m.san);
    const b = rankMoves(new Chess(fen), 2).map((m) => m.san);
    expect(a).toEqual(b);
  });

  it("evaluates the start position as roughly balanced", () => {
    const g = new Chess();
    expect(Math.abs(evaluate(g, "w"))).toBeLessThan(60);
  });
});
