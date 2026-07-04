/**
 * Tangra — Symmetry Draw. A pattern sits on the left of a vertical mirror
 * line; the child completes the mirror image on the right. Validation is
 * cell-by-cell set equality against the true reflection — pure geometry.
 */

import { type Rng, randInt } from "./rng.js";
import type { Cell } from "./shapes.js";

export interface SymmetryPuzzle {
  rows: number;
  /** Always even; the mirror line runs between cols/2−1 and cols/2. */
  cols: number;
  /** Given cells, all on the left half (x < cols/2). */
  pattern: Cell[];
  /** The true mirror image, all on the right half — what the child must draw. */
  target: Cell[];
}

export function mirrorCell(cell: Cell, cols: number): Cell {
  return { x: cols - 1 - cell.x, y: cell.y };
}

export function cellId(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

/** Grid size and pattern density for a difficulty level (1..5). */
export function symmetryDimsForLevel(level: number): { rows: number; cols: number; count: number } {
  const rows = level <= 2 ? 4 : level <= 4 ? 6 : 8;
  const cols = rows; // square grid, even sizes only
  const half = (rows * cols) / 2;
  const count = Math.min(half - 1, 2 + level * 2);
  return { rows, cols, count };
}

export function generateSymmetryPuzzle(level: number, rng: Rng): SymmetryPuzzle {
  const { rows, cols, count } = symmetryDimsForLevel(level);
  const halfCols = cols / 2;

  const chosen = new Map<string, Cell>();
  let guard = 0;
  while (chosen.size < count && guard++ < 500) {
    const cell = { x: randInt(rng, halfCols), y: randInt(rng, rows) };
    chosen.set(cellId(cell), cell);
  }
  // Keep the picture connected-ish and readable: always include one cell
  // touching the mirror line so the reflection visibly "meets" the pattern.
  const touching = [...chosen.values()].some((c) => c.x === halfCols - 1);
  if (!touching) {
    const y = randInt(rng, rows);
    const cell = { x: halfCols - 1, y };
    chosen.set(cellId(cell), cell);
    // Stay at the intended count by dropping one non-touching cell.
    if (chosen.size > count) {
      for (const [key, c] of chosen) {
        if (c.x !== halfCols - 1) {
          chosen.delete(key);
          break;
        }
      }
    }
  }

  const pattern = [...chosen.values()].sort((a, b) => a.y - b.y || a.x - b.x);
  const target = pattern.map((c) => mirrorCell(c, cols)).sort((a, b) => a.y - b.y || a.x - b.x);
  return { rows, cols, pattern, target };
}

/** Exact cell-by-cell check: the child's cells must equal the target set. */
export function isSolved(selected: ReadonlySet<string>, target: Cell[]): boolean {
  if (selected.size !== target.length) return false;
  return target.every((c) => selected.has(cellId(c)));
}

/** How many of the child's cells are correct (for warm partial feedback). */
export function correctCount(selected: ReadonlySet<string>, target: Cell[]): number {
  return target.filter((c) => selected.has(cellId(c))).length;
}
