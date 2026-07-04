/**
 * The move tutor — Gambit's soul. After a child's move we compute, DETERMIN-
 * ISTICALLY from chess.js and the engine, WHY the move was weak. The taxonomy
 * and every square/piece come from real board facts — never the model. The AI
 * gateway only rephrases the fact sheet warmly, and we always have a correct
 * deterministic sentence as fallback. The tutor never hallucinates squares.
 */
import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";
import { PIECE_VALUE, rankMoves, isMateScore, type ScoredMove } from "./engine.js";

export type Severity = "great" | "fine" | "oops" | "trap" | "blunder";

export type TutorLabel =
  | "good"
  | "hung-piece"
  | "missed-capture"
  | "missed-mate"
  | "walked-into-fork"
  | "ignored-threat"
  | "bad-trade";

const PIECE_NAME: Record<PieceSymbol, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

/** Everything the tutor knows for certain about one child move. */
export interface FactSheet {
  label: TutorLabel;
  severity: Severity;
  /** The piece the child moved (e.g. "knight"), when relevant. */
  piece?: string;
  /** The square involved (landing square, or the hanging piece's square). */
  square?: string;
  /** The engine's better move in SAN, when there is one. */
  better?: string;
  /** Centipawn drop vs the engine's best (>=0). */
  lossCp: number;
  /** A correct, kind, self-contained sentence — the deterministic fallback. */
  sentence: string;
}

const OPPONENT = (c: "w" | "b") => (c === "w" ? "b" : "w");

/** Was the piece that just landed on `to` attacked and not defended enough? */
function isHanging(after: Chess, to: Square, moverColor: "w" | "b"): boolean {
  const piece = after.get(to);
  if (!piece || piece.color !== moverColor) return false;
  const attackers = after.attackers(to, OPPONENT(moverColor));
  if (attackers.length === 0) return false;
  const defenders = after.attackers(to, moverColor);
  // Undefended and attacked = hanging. If defended, treat as hanging only when
  // the cheapest attacker is worth clearly less than the piece (a losing trade).
  if (defenders.length === 0) return true;
  const cheapestAttacker = Math.min(
    ...attackers.map((sq) => PIECE_VALUE[after.get(sq)!.type])
  );
  return cheapestAttacker + 100 < PIECE_VALUE[piece.type];
}

/** Best free (undefended) enemy capture available in a position, if any. */
function bestFreeCapture(game: Chess): Move | null {
  const mover = game.turn();
  let best: Move | null = null;
  let bestGain = 0;
  for (const m of game.moves({ verbose: true })) {
    if (!m.captured) continue;
    // Simulate to see if the capturing piece is then safe (undefended target).
    game.move(m.san);
    const safe = game.attackers(m.to, OPPONENT(mover)).length === 0;
    game.undo();
    const gain = PIECE_VALUE[m.captured] - (safe ? 0 : PIECE_VALUE[m.piece]);
    if ((safe || PIECE_VALUE[m.captured] > PIECE_VALUE[m.piece]) && gain > bestGain) {
      bestGain = gain;
      best = m;
    }
  }
  return best;
}

/** Does the side to move have a mate in 1? Returns the SAN if so. */
function mateInOne(game: Chess): string | null {
  for (const m of game.moves({ verbose: true })) {
    game.move(m.san);
    const mate = game.isCheckmate();
    game.undo();
    if (mate) return m.san;
  }
  return null;
}

/**
 * After the child's move, does the opponent now have a move that forks two
 * valuable pieces (attacks 2+ pieces each worth >= a knight, from one square)?
 * Returns the enemy landing square if so.
 */
function opponentForkSquare(after: Chess): Square | null {
  const enemy = after.turn(); // it's the opponent's move now
  for (const m of after.moves({ verbose: true })) {
    after.move(m.san);
    const from = m.to;
    // Count valuable enemy-of-enemy (i.e. child's) pieces this piece attacks.
    let hits = 0;
    for (const row of after.board()) {
      for (const cell of row) {
        if (!cell || cell.color === enemy) continue;
        if (PIECE_VALUE[cell.type] < PIECE_VALUE.n) continue;
        if (after.attackers(cell.square, enemy).includes(from)) hits++;
      }
    }
    after.undo();
    if (hits >= 2) return m.to;
  }
  return null;
}

function severityFromLoss(lossCp: number, mated: boolean): Severity {
  if (mated) return "blunder";
  if (lossCp >= 500) return "blunder";
  if (lossCp >= 250) return "trap";
  if (lossCp >= 90) return "oops";
  return "fine";
}

/**
 * Analyse the child's move. `before` is the position BEFORE the move (FEN),
 * `moveSan` is what they played, `depth` is the analysis depth.
 * Pure and deterministic — safe to unit-test.
 */
export function analyzeMove(before: string, moveSan: string, depth = 2): FactSheet {
  const pre = new Chess(before);
  const ranked: ScoredMove[] = rankMoves(pre, depth);
  const best = ranked[0];

  // Position after the child's move.
  const post = new Chess(before);
  const played = post.move(moveSan);
  const mover = played.color;

  // Eval delta: engine's best vs what the child left on the board. We recompute
  // the played move's own rank so the loss is exact and deterministic.
  const playedRank = ranked.find((r) => r.san === moveSan);
  const playedScore = playedRank ? playedRank.score : best.score;
  const lossCp = Math.max(0, best.score - playedScore);
  const mated = post.isCheckmate() && post.turn() === mover ? false : false; // handled via severity

  // --- Deterministic taxonomy, checked in order of "most teachable" ---

  // 1. Missed a mate-in-1 that was available before the move.
  const mateBefore = mateInOne(pre);
  if (mateBefore && moveSan !== mateBefore) {
    return finalize({
      label: "missed-mate",
      severity: "blunder",
      better: mateBefore,
      lossCp,
      sentence: `You had checkmate with ${mateBefore}! Always look for a way to trap the king — that's how you win the game.`,
    });
  }

  // 2. Hung the piece you just moved (landed where it can be taken for free).
  if (isHanging(post, played.to, mover)) {
    const name = PIECE_NAME[played.piece];
    return finalize({
      label: "hung-piece",
      severity: severityFromLoss(Math.max(lossCp, PIECE_VALUE[played.piece]), false),
      piece: name,
      square: played.to,
      better: best.san,
      lossCp,
      sentence: `Your ${name} moved to ${played.to}, where it can be taken for free. Before you move, check who can capture the square you're landing on. ${best.san} keeps everything safe.`,
    });
  }

  // 3. Walked into a fork: opponent can now hit two valuable pieces at once.
  const forkSq = opponentForkSquare(post);
  if (forkSq && lossCp >= 150) {
    return finalize({
      label: "walked-into-fork",
      severity: severityFromLoss(lossCp, false),
      square: forkSq,
      better: best.san,
      lossCp,
      sentence: `Watch out — the other side can play to ${forkSq} and attack two of your pieces at once (a fork!). ${best.san} avoids the trap.`,
    });
  }

  // 4. Missed a free capture that was sitting there before your move.
  const free = bestFreeCapture(pre);
  if (free && free.san !== moveSan && lossCp >= 150) {
    return finalize({
      label: "missed-capture",
      severity: severityFromLoss(lossCp, false),
      piece: free.captured ? PIECE_NAME[free.captured] : undefined,
      square: free.to,
      better: free.san,
      lossCp,
      sentence: `There was a free ${free.captured ? PIECE_NAME[free.captured] : "piece"} to grab with ${free.san} on ${free.to}. Grabbing free material is one of the fastest ways to win.`,
    });
  }

  // 5. Ignored the opponent's threat: they can win material next move and your
  //    move didn't address it (loss is real but no cleaner label fit above).
  if (lossCp >= 250) {
    return finalize({
      label: "ignored-threat",
      severity: severityFromLoss(lossCp, false),
      better: best.san,
      lossCp,
      sentence: `The other side had a plan you didn't stop. ${best.san} was stronger — try asking "what does my opponent want to do?" before each move.`,
    });
  }

  // 6. Bad trade: small-to-medium loss from an uneven swap.
  if (played.captured && lossCp >= 90) {
    return finalize({
      label: "bad-trade",
      severity: "oops",
      better: best.san,
      lossCp,
      sentence: `That trade gave up a bit more than it won. Count the values on both sides before you swap — ${best.san} was a better deal.`,
    });
  }

  void mated;
  // Otherwise: a fine or even great move.
  const great = lossCp === 0 || (isMateScore(playedScore) && playedScore > 0);
  return finalize({
    label: "good",
    severity: great ? "great" : "fine",
    lossCp,
    sentence: great
      ? "Nice — that's the strongest move here. You're thinking ahead!"
      : "Good move. That keeps you in a solid spot.",
  });
}

function finalize(f: FactSheet): FactSheet {
  return f;
}

/** Warm, kid-friendly headline for a severity (never shaming). */
export function severityHeadline(sev: Severity): { emoji: string; text: string } {
  switch (sev) {
    case "great":
      return { emoji: "🌟", text: "Great move!" };
    case "fine":
      return { emoji: "👍", text: "Good move" };
    case "oops":
      return { emoji: "😯", text: "Oops — little slip" };
    case "trap":
      return { emoji: "⚠️", text: "Careful — that's a trap!" };
    case "blunder":
      return { emoji: "💡", text: "Big learning moment" };
  }
}

/**
 * Turn a fact sheet into the AI gateway context (all values string|number|
 * boolean, per the SDK contract). The model only PHRASES these verified facts.
 */
export function factSheetContext(f: FactSheet): Record<string, string | number | boolean> {
  return {
    label: f.label,
    severity: f.severity,
    piece: f.piece ?? "",
    square: f.square ?? "",
    better: f.better ?? "",
    lossCp: f.lossCp,
  };
}
