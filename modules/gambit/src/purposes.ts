/**
 * The purpose taxonomy — Gambit's "why is this move GOOD?" (Chernev's method).
 * A sibling to the mistake taxonomy in tutor.ts. Every purpose is computed
 * DETERMINISTICALLY from the position via chess.js — the pieces and squares it
 * names are always real board facts, never invented. The AI gateway only PHRASES
 * this verified fact sheet; the deterministic sentence is always the fallback.
 *
 * A move can serve several purposes; we return the single most teachable one
 * (checked in a fixed, Chernev-flavoured order) plus a structured fact sheet.
 */
import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";
import { PIECE_VALUE } from "./engine.js";

/** The good-move purposes (PRD 4.2, Chernev). */
export type PurposeLabel =
  | "castles"
  | "prepares-castling"
  | "develops"
  | "controls-centre"
  | "improves-worst-piece"
  | "creates-threat"
  | "defends-threat"
  | "opens-file-for-rook"
  | "gains-space"
  | "restricts-enemy"
  | "solid"; // a fine move with no single standout purpose (fallback)

const PIECE_NAME: Record<PieceSymbol, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

/** Everything the purpose tutor knows for certain about one good move. */
export interface PurposeSheet {
  label: PurposeLabel;
  /** The piece that moved (e.g. "knight"), when relevant. */
  piece?: string;
  /** The key square (usually the landing square). */
  square?: string;
  /** A correct, kind, self-contained sentence — the deterministic fallback. */
  sentence: string;
}

const CENTRE = new Set<Square>(["d4", "e4", "d5", "e5"]);
const BIG_CENTRE = new Set<Square>([
  "c3", "d3", "e3", "f3", "c4", "d4", "e4", "f4",
  "c5", "d5", "e5", "f5", "c6", "d6", "e6", "f6",
]);
const OPPONENT = (c: "w" | "b") => (c === "w" ? "b" : "w");
const BACK_RANK = (c: "w" | "b") => (c === "w" ? "1" : "8");

/** Home squares of the minor/major pieces, used to detect development. */
function isOnHomeSquare(piece: PieceSymbol, from: Square, color: "w" | "b"): boolean {
  const rank = BACK_RANK(color);
  if (from[1] !== rank) return false;
  switch (piece) {
    case "n":
      return from[0] === "b" || from[0] === "g";
    case "b":
      return from[0] === "c" || from[0] === "f";
    case "r":
      return from[0] === "a" || from[0] === "h";
    case "q":
      return from[0] === "d";
    default:
      return false;
  }
}

/** Count squares a colour's pieces attack on the opponent's half of the board. */
function spaceOnEnemyHalf(game: Chess, color: "w" | "b"): number {
  const enemyRanks = color === "w" ? ["5", "6", "7", "8"] : ["1", "2", "3", "4"];
  let count = 0;
  for (const file of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
    for (const rank of enemyRanks) {
      const sq = `${file}${rank}` as Square;
      if (game.attackers(sq, color).length > 0) count++;
    }
  }
  return count;
}

/** Does `color` have a rook on `file` with no friendly pawn ahead of it? */
function rookOnOpenOrHalfOpenFile(game: Chess, color: "w" | "b", file: string): boolean {
  let hasRook = false;
  let hasOwnPawn = false;
  for (const rank of ["1", "2", "3", "4", "5", "6", "7", "8"]) {
    const p = game.get(`${file}${rank}` as Square);
    if (!p) continue;
    if (p.color === color && p.type === "r") hasRook = true;
    if (p.color === color && p.type === "p") hasOwnPawn = true;
  }
  return hasRook && !hasOwnPawn;
}

/**
 * Does the mover now threaten to win material next move? Returns the value (in
 * centipawns) of the best undefended enemy piece the mover attacks, or 0.
 * "Threat" here = an enemy piece the mover attacks that is not defended, or is
 * defended only by more valuable pieces (a winning capture is available next).
 */
function bestThreatValue(after: Chess): number {
  const mover = OPPONENT(after.turn()); // mover just moved; it's the enemy's turn now
  let best = 0;
  for (const row of after.board()) {
    for (const cell of row) {
      if (!cell || cell.color === mover) continue;
      const attackers = after.attackers(cell.square, mover);
      if (attackers.length === 0) continue;
      const defenders = after.attackers(cell.square, cell.color);
      const cheapestAttacker = Math.min(...attackers.map((sq) => PIECE_VALUE[after.get(sq)!.type]));
      // Winning capture available if the piece is undefended, or worth clearly
      // more than the cheapest attacker.
      if (defenders.length === 0 || PIECE_VALUE[cell.type] > cheapestAttacker + 100) {
        best = Math.max(best, PIECE_VALUE[cell.type]);
      }
    }
  }
  return best;
}

/**
 * Analyse the purpose of a GOOD move. `before` is the FEN before the move,
 * `moveSan` is what was played. Pure and deterministic — safe to unit-test.
 * Returns the single most teachable purpose plus a verified fact sheet.
 */
export function analyzePurpose(before: string, moveSan: string): PurposeSheet {
  const pre = new Chess(before);
  const post = new Chess(before);
  const played: Move = post.move(moveSan);
  const mover = played.color;
  const name = PIECE_NAME[played.piece];
  const to = played.to as Square;

  // 1. Castling — the single clearest king-safety milestone.
  if (played.isKingsideCastle() || played.isQueensideCastle()) {
    const side = played.isKingsideCastle() ? "kingside" : "queenside";
    return {
      label: "castles",
      piece: "king",
      square: to,
      sentence: `You castled ${side}! Your king is tucked away safe and your rook joins the game — a great habit.`,
    };
  }

  // 2. Creates a threat — the mover now menaces to win material.
  const threat = bestThreatValue(post);
  const preThreat = threatAgainst(pre, mover); // was material already hanging before?
  if (threat >= PIECE_VALUE.n && threat > preThreat) {
    return {
      label: "creates-threat",
      piece: name,
      square: to,
      sentence: `Your ${name} on ${to} makes a threat — next move you could win material. Making threats keeps your opponent busy defending.`,
    };
  }

  // 3. Defends a threat — before the move the mover had a piece hanging; after,
  //    it is safe (defended or moved away).
  const rescued = defendedHangingPiece(pre, post, mover);
  if (rescued) {
    return {
      label: "defends-threat",
      piece: PIECE_NAME[rescued.type],
      square: rescued.square,
      sentence: `Good save — your ${PIECE_NAME[rescued.type]} on ${rescued.square} was in danger and now it's safe. Always answer your opponent's threats.`,
    };
  }

  // 4. Develops a piece — a knight/bishop (or queen/rook) leaves its home square.
  if (isOnHomeSquare(played.piece, played.from as Square, mover) && (played.piece === "n" || played.piece === "b")) {
    const centreWord = CENTRE.has(to) ? " toward the centre" : "";
    return {
      label: "develops",
      piece: name,
      square: to,
      sentence: `You developed your ${name} to ${to}${centreWord}. Bringing new pieces out early is how you build an army ready to attack.`,
    };
  }

  // 5. Controls or occupies the centre — a pawn or piece lands on the centre.
  if (CENTRE.has(to)) {
    return {
      label: "controls-centre",
      piece: name,
      square: to,
      sentence: `Your ${name} took the centre on ${to}. Owning the middle squares gives your pieces more room and power.`,
    };
  }
  if (played.piece === "p" && BIG_CENTRE.has(to)) {
    return {
      label: "controls-centre",
      piece: name,
      square: to,
      sentence: `Your pawn on ${to} helps control the centre. Central pawns are the backbone of a strong position.`,
    };
  }

  // 6. Opens a file for a rook — after the move the mover has a rook on an
  //    open/half-open file it didn't have before.
  const openedFile = newlyOpenRookFile(pre, post, mover);
  if (openedFile) {
    return {
      label: "opens-file-for-rook",
      piece: "rook",
      square: `${openedFile}${played.to[1]}` as string,
      sentence: `Your rook now sees down the open ${openedFile}-file. Rooks love open files — that's where they do the most damage.`,
    };
  }

  // 7. Improves the worst-placed piece — the moved piece was the mover's least
  //    active piece and is now more active (attacks more squares).
  if (improvesWorstPiece(pre, post, played)) {
    return {
      label: "improves-worst-piece",
      piece: name,
      square: to,
      sentence: `Nice — you gave your sleepiest piece a better job. Your ${name} on ${to} is much more active now. When you're not sure what to do, improve your worst piece.`,
    };
  }

  // 8. Gains space — the move increases how much of the enemy half you cover.
  if (spaceOnEnemyHalf(post, mover) > spaceOnEnemyHalf(pre, mover) && played.piece === "p") {
    return {
      label: "gains-space",
      piece: name,
      square: to,
      sentence: `Your pawn to ${to} grabs more space. More space means more room for your pieces and less for your opponent's.`,
    };
  }

  // 9. Prepares castling — clears the last minor piece between king and rook.
  if (preparesCastling(pre, post, mover)) {
    return {
      label: "prepares-castling",
      piece: name,
      square: to,
      sentence: `That clears the way to castle. Getting your king safe early is one of the smartest things you can do.`,
    };
  }

  // 10. Restricts an enemy piece — after the move an enemy piece has fewer legal
  //     squares than before (we clamped one of its escape squares).
  if (restrictsEnemy(pre, post, mover)) {
    return {
      label: "restricts-enemy",
      piece: name,
      square: to,
      sentence: `Your ${name} on ${to} takes squares away from your opponent's pieces. Cramping the other side makes their job harder.`,
    };
  }

  // Fallback — a solid move with no single standout purpose.
  return {
    label: "solid",
    piece: name,
    square: to,
    sentence: `A solid move — your ${name} goes to ${to} and keeps your position healthy.`,
  };
}

/** Best already-hanging enemy material for `mover` in a position (centipawns). */
function threatAgainst(game: Chess, mover: "w" | "b"): number {
  // Reuse bestThreatValue by constructing a position where it's the enemy's turn.
  // In `before`, it is the mover's turn, so we measure directly.
  let best = 0;
  for (const row of game.board()) {
    for (const cell of row) {
      if (!cell || cell.color === mover) continue;
      const attackers = game.attackers(cell.square, mover);
      if (attackers.length === 0) continue;
      const defenders = game.attackers(cell.square, cell.color);
      const cheapestAttacker = Math.min(...attackers.map((sq) => PIECE_VALUE[game.get(sq)!.type]));
      if (defenders.length === 0 || PIECE_VALUE[cell.type] > cheapestAttacker + 100) {
        best = Math.max(best, PIECE_VALUE[cell.type]);
      }
    }
  }
  return best;
}

/**
 * A mover's piece that was hanging (attacked & winnable) before the move and is
 * safe afterwards — either it moved to safety or gained a defender. Returns the
 * rescued piece's post-move location, or null.
 */
function defendedHangingPiece(
  pre: Chess,
  post: Chess,
  mover: "w" | "b"
): { type: PieceSymbol; square: Square } | null {
  const hangingBefore: { type: PieceSymbol; square: Square }[] = [];
  for (const row of pre.board()) {
    for (const cell of row) {
      if (!cell || cell.color !== mover) continue;
      const attackers = pre.attackers(cell.square, OPPONENT(mover));
      if (attackers.length === 0) continue;
      const defenders = pre.attackers(cell.square, mover);
      const cheapest = Math.min(...attackers.map((sq) => PIECE_VALUE[pre.get(sq)!.type]));
      if (defenders.length === 0 || PIECE_VALUE[cell.type] > cheapest + 100) {
        hangingBefore.push({ type: cell.type, square: cell.square });
      }
    }
  }
  if (hangingBefore.length === 0) return null;

  for (const h of hangingBefore) {
    const nowThere = post.get(h.square);
    if (!nowThere || nowThere.color !== mover) {
      // The piece moved away to safety — check it isn't hanging on its new home
      // by scanning for a same-type mover piece that is now safe.
      const safeSame = findSafeSameType(post, mover, h.type);
      if (safeSame) return { type: h.type, square: safeSame };
      continue;
    }
    // Still on its square — is it defended / no longer winnable now?
    const attackers = post.attackers(h.square, OPPONENT(mover));
    if (attackers.length === 0) return { type: h.type, square: h.square };
    const defenders = post.attackers(h.square, mover);
    const cheapest = Math.min(...attackers.map((sq) => PIECE_VALUE[post.get(sq)!.type]));
    if (defenders.length > 0 && PIECE_VALUE[nowThere.type] <= cheapest + 100) {
      return { type: h.type, square: h.square };
    }
  }
  return null;
}

/** A mover piece of `type` that is currently safe (not winnably attacked). */
function findSafeSameType(game: Chess, mover: "w" | "b", type: PieceSymbol): Square | null {
  for (const row of game.board()) {
    for (const cell of row) {
      if (!cell || cell.color !== mover || cell.type !== type) continue;
      const attackers = game.attackers(cell.square, OPPONENT(mover));
      if (attackers.length === 0) return cell.square;
      const defenders = game.attackers(cell.square, mover);
      const cheapest = Math.min(...attackers.map((sq) => PIECE_VALUE[game.get(sq)!.type]));
      if (defenders.length > 0 && PIECE_VALUE[type] <= cheapest + 100) return cell.square;
    }
  }
  return null;
}

/** A file on which the mover has a rook now (open/half-open) but did not before. */
function newlyOpenRookFile(pre: Chess, post: Chess, mover: "w" | "b"): string | null {
  for (const file of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
    const now = rookOnOpenOrHalfOpenFile(post, mover, file);
    const was = rookOnOpenOrHalfOpenFile(pre, mover, file);
    if (now && !was) return file;
  }
  return null;
}

/** Was the moved piece the mover's least mobile piece, and is it now more mobile? */
function improvesWorstPiece(pre: Chess, post: Chess, played: Move): boolean {
  const mover = played.color;
  // Mobility of each mover piece before the move (verbose moves grouped by from).
  const beforeMob = mobilityByPiece(pre, mover);
  if (beforeMob.size < 2) return false;
  // Find the worst-placed (fewest moves) mover piece; ignore pawns and king.
  let worstSquare: Square | null = null;
  let worstCount = Infinity;
  for (const [sq, count] of beforeMob) {
    const p = pre.get(sq);
    if (!p || p.type === "p" || p.type === "k") continue;
    if (count < worstCount) {
      worstCount = count;
      worstSquare = sq;
    }
  }
  if (!worstSquare || worstSquare !== (played.from as Square)) return false;
  // Now measure the moved piece's mobility on its new square.
  const afterCount = post.moves({ square: played.to as Square, verbose: true }).length;
  return afterCount > worstCount;
}

/** Map of mover piece square -> number of legal moves it has. */
function mobilityByPiece(game: Chess, mover: "w" | "b"): Map<Square, number> {
  const m = new Map<Square, number>();
  if (game.turn() !== mover) return m; // only meaningful for the side to move
  for (const mv of game.moves({ verbose: true })) {
    m.set(mv.from as Square, (m.get(mv.from as Square) ?? 0) + 1);
  }
  return m;
}

/** Did the move remove the last minor piece between the king and a rook? */
function preparesCastling(pre: Chess, post: Chess, mover: "w" | "b"): boolean {
  // If the mover can now castle in `post` but could not in `pre`, this move
  // prepared it. chess.js encodes castling rights in the FEN and legal moves.
  const canCastleNow = post.turn() === OPPONENT(mover)
    ? false // not mover's turn now; check via a probe below
    : false;
  void canCastleNow;
  // Probe: from a copy with the mover to move, does a castling move exist?
  const probe = new Chess(post.fen());
  // In `post` it's the opponent's turn; flip by checking pre vs post castle move sets.
  const hadCastle = castleMovesFor(pre, mover);
  const hasCastle = castleMovesForFen(probe, mover);
  return hasCastle.length > hadCastle.length;
}

function castleMovesFor(game: Chess, mover: "w" | "b"): string[] {
  if (game.turn() !== mover) return [];
  return game.moves().filter((m) => m === "O-O" || m === "O-O-O");
}

/** Castling moves available to `mover`, regardless of whose turn the FEN says. */
function castleMovesForFen(game: Chess, mover: "w" | "b"): string[] {
  // Build a FEN with `mover` to move (only safe when not in the middle of a move).
  const parts = game.fen().split(" ");
  if (parts[1] === mover) {
    return game.moves().filter((m) => m === "O-O" || m === "O-O-O");
  }
  parts[1] = mover;
  parts[3] = "-"; // clear en-passant to keep the FEN legal after side flip
  try {
    const flipped = new Chess(parts.join(" "));
    return flipped.moves().filter((m) => m === "O-O" || m === "O-O-O");
  } catch {
    return [];
  }
}

/** Does an enemy piece have strictly fewer legal moves after the mover's move? */
function restrictsEnemy(pre: Chess, post: Chess, mover: "w" | "b"): boolean {
  const enemy = OPPONENT(mover);
  const before = totalMobility(pre, enemy);
  const after = totalMobility(post, enemy);
  return after < before;
}

/** Total legal-move count for `color` in a position (side-to-move independent). */
function totalMobility(game: Chess, color: "w" | "b"): number {
  const parts = game.fen().split(" ");
  if (parts[1] === color) return game.moves().length;
  parts[1] = color;
  parts[3] = "-";
  try {
    return new Chess(parts.join(" ")).moves().length;
  } catch {
    return 0;
  }
}

/** Warm, kid-friendly headline for a purpose. */
export function purposeHeadline(label: PurposeLabel): { emoji: string; text: string } {
  switch (label) {
    case "castles":
      return { emoji: "🏰", text: "King safe!" };
    case "prepares-castling":
      return { emoji: "🧱", text: "Getting ready to castle" };
    case "develops":
      return { emoji: "🚀", text: "Piece developed" };
    case "controls-centre":
      return { emoji: "🎯", text: "Centre control" };
    case "improves-worst-piece":
      return { emoji: "✨", text: "Best piece upgrade" };
    case "creates-threat":
      return { emoji: "⚡", text: "Making a threat" };
    case "defends-threat":
      return { emoji: "🛡️", text: "Good defence" };
    case "opens-file-for-rook":
      return { emoji: "🗼", text: "Open file for the rook" };
    case "gains-space":
      return { emoji: "🌍", text: "Grabbing space" };
    case "restricts-enemy":
      return { emoji: "🔒", text: "Cramping the enemy" };
    case "solid":
      return { emoji: "👍", text: "Solid move" };
  }
}

/**
 * Turn a purpose sheet into AI-gateway context (all string|number|boolean, per
 * the SDK). The model only PHRASES these verified facts — it never analyses.
 */
export function purposeContext(p: PurposeSheet): Record<string, string | number | boolean> {
  return {
    label: p.label,
    piece: p.piece ?? "",
    square: p.square ?? "",
  };
}
