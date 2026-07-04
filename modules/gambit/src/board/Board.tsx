/**
 * SVG chessboard rendered from a chess.js instance. Tap a piece to select it,
 * then tap a legal target (dots show where it can go). Parchment styling via
 * design-system CSS vars, big touch targets, board-flip support, unicode glyphs.
 */
import { useMemo } from "react";
import type { Chess, Color, Square } from "chess.js";
import "./board.css";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

/** Unicode glyphs. We use the solid (black) glyphs and colour with CSS so both
 * sides read crisply on parchment. */
const GLYPH: Record<string, string> = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚",
};

export interface BoardProps {
  game: Chess;
  /** Currently selected square, if any. */
  selected?: Square | null;
  /** Legal target squares for the selected piece (shows dots). */
  targets?: Square[];
  /** Squares to highlight (e.g. last move from/to). */
  lastMove?: { from: Square; to: Square } | null;
  /** Flip so black is at the bottom. */
  flipped?: boolean;
  /** Called when a square is tapped. */
  onSquare?: (square: Square) => void;
  /** Disable interaction (e.g. bot thinking, game over). */
  interactive?: boolean;
}

const CELL = 100; // viewBox units per square; scales via CSS width.

export function Board({
  game,
  selected,
  targets = [],
  lastMove,
  flipped = false,
  onSquare,
  interactive = true,
}: BoardProps) {
  const board = game.board();
  const targetSet = useMemo(() => new Set(targets), [targets]);

  const orderedFiles = flipped ? [...FILES].reverse() : FILES;
  const orderedRanks = flipped ? [...RANKS].reverse() : RANKS;

  const inCheckColor: Color | null = game.isCheck() ? game.turn() : null;
  const kingSquare = inCheckColor ? findKing(game, inCheckColor) : null;

  return (
    <svg
      className="gambit-board"
      viewBox={`0 0 ${CELL * 8} ${CELL * 8}`}
      role="grid"
      aria-label="Chess board"
    >
      {orderedRanks.map((rank, r) =>
        orderedFiles.map((file, f) => {
          const square = `${file}${rank}` as Square;
          const piece = board[8 - rank][FILES.indexOf(file)];
          const light = (FILES.indexOf(file) + rank) % 2 === 1;
          const x = f * CELL;
          const y = r * CELL;
          const isSel = selected === square;
          const isTarget = targetSet.has(square);
          const isLast = lastMove && (lastMove.from === square || lastMove.to === square);
          const isCheck = kingSquare === square;

          const classes = [
            "gambit-sq",
            light ? "gambit-sq--light" : "gambit-sq--dark",
            isSel ? "is-selected" : "",
            isLast ? "is-last" : "",
            isCheck ? "is-check" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <g
              key={square}
              className={classes}
              onClick={interactive ? () => onSquare?.(square) : undefined}
              role="gridcell"
              aria-label={square + (piece ? ` ${piece.color} ${piece.type}` : " empty")}
              style={{ cursor: interactive ? "pointer" : "default" }}
            >
              <rect x={x} y={y} width={CELL} height={CELL} />
              {/* coordinate labels on the edges */}
              {f === 0 && (
                <text x={x + 6} y={y + 24} className="gambit-coord">
                  {rank}
                </text>
              )}
              {r === 7 && (
                <text x={x + CELL - 18} y={y + CELL - 8} className="gambit-coord">
                  {file}
                </text>
              )}
              {piece && (
                <text
                  x={x + CELL / 2}
                  y={y + CELL / 2}
                  className={`gambit-piece gambit-piece--${piece.color}`}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {GLYPH[piece.type]}
                </text>
              )}
              {isTarget && !piece && <circle cx={x + CELL / 2} cy={y + CELL / 2} r={14} className="gambit-dot" />}
              {isTarget && piece && (
                <circle cx={x + CELL / 2} cy={y + CELL / 2} r={44} className="gambit-ring" />
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}

function findKing(game: Chess, color: Color): Square | null {
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell && cell.color === color && cell.type === "k") return cell.square;
    }
  }
  return null;
}

/** Legal target squares for the piece on `from`, or [] if none / not its turn. */
export function legalTargets(game: Chess, from: Square): Square[] {
  return game.moves({ square: from, verbose: true }).map((m) => m.to);
}
