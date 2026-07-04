/**
 * Gambit deterministic engine — material + piece-square-table evaluation with a
 * negamax/alpha-beta search. No WASM, no network: pure chess.js + arithmetic so
 * it runs instantly for kid play at depth <= 3. This is the ground truth the
 * move tutor reasons about (the AI never analyses, it only phrases).
 */
import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";

/** Centipawn value of each piece. King is huge but finite so eval stays sane. */
export const PIECE_VALUE: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

/**
 * Piece-square tables (white's point of view, a8..h1 reading order, i.e. rank 8
 * first). Values are small nudges toward good squares — centre control, knights
 * off the rim, pawns pushing, king tucked away. Classic simplified-eval tables.
 */
const PST: Record<PieceSymbol, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30,
    20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5,
    -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0,
    0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30,
    0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20,
    20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20,
    -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0,
    5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10,
    0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20,
    -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0,
    -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0,
    0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5,
    5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5,
    5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10,
    -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40,
    -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40,
    -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20,
    -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

/** PST index (0..63, a8-first) for a square from white's perspective. */
function pstIndex(square: Square): number {
  const file = FILES.indexOf(square[0] as (typeof FILES)[number]);
  const rank = Number(square[1]); // 1..8
  return (8 - rank) * 8 + file;
}

/**
 * Static evaluation in centipawns, POSITIVE = good for `pov` (the side to move
 * when called from search). Uses material + piece-square tables.
 */
export function evaluate(game: Chess, pov: Color): number {
  let score = 0;
  const board = game.board();
  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue;
      const base = PIECE_VALUE[cell.type];
      const table = PST[cell.type];
      const idx = pstIndex(cell.square);
      // White reads the table directly; black mirrors it vertically.
      const positional = cell.color === "w" ? table[idx] : table[63 - idx];
      const value = base + positional;
      score += cell.color === pov ? value : -value;
    }
  }
  return score;
}

const MATE = 1_000_000;

/**
 * Standard negamax with alpha-beta pruning. Scores are ALWAYS from the
 * perspective of the side to move at this node (higher = better for them), so
 * the parent negates. Being checkmated is the worst outcome; nearer mates score
 * higher (via +depth) so the engine prefers the fastest win. Depth is small
 * (<=3) so captures-first ordering is enough.
 */
function negamax(game: Chess, depth: number, alpha: number, beta: number): number {
  if (game.isGameOver()) {
    // Side to move has no move: checkmate is a loss for them, else a draw.
    if (game.isCheckmate()) return -MATE - depth;
    return 0; // stalemate / draw
  }
  if (depth === 0) return evaluate(game, game.turn());

  let best = -Infinity;
  const moves = orderedMoves(game);
  for (const san of moves) {
    game.move(san);
    const score = -negamax(game, depth - 1, -beta, -alpha);
    game.undo();
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break; // prune
  }
  return best;
}

/** Captures first (cheap ordering that makes alpha-beta far more effective). */
function orderedMoves(game: Chess): string[] {
  const verbose = game.moves({ verbose: true });
  verbose.sort((a, b) => Number(b.isCapture()) - Number(a.isCapture()));
  return verbose.map((m) => m.san);
}

export interface ScoredMove {
  san: string;
  /** Centipawn score from the moving side's point of view (higher = better). */
  score: number;
}

/**
 * Evaluate every legal move to `depth` and return them sorted best-first.
 * Deterministic: equal scores keep chess.js move order (stable sort).
 */
export function rankMoves(game: Chess, depth: number): ScoredMove[] {
  const d = Math.max(1, Math.min(3, depth));
  const scored: ScoredMove[] = [];
  for (const san of orderedMoves(game)) {
    game.move(san);
    // Child node is scored from the OPPONENT's view; negate for us.
    const score = -negamax(game, d - 1, -Infinity, Infinity);
    game.undo();
    scored.push({ san, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/** Top-N moves with evals (multi-PV) for the tutor and hints. */
export function topMoves(game: Chess, depth: number, n: number): ScoredMove[] {
  return rankMoves(game, depth).slice(0, Math.max(1, n));
}

/** Best move SAN at the given depth, or null if the game is over. */
export function bestMove(game: Chess, depth: number): string | null {
  const ranked = rankMoves(game, depth);
  return ranked.length ? ranked[0].san : null;
}

/** True when the given score represents a forced mate. */
export function isMateScore(score: number): boolean {
  return Math.abs(score) >= MATE;
}
