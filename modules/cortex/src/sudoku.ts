import { mulberry32, shuffle } from "./random.js";
import type { Hint } from "./hints.js";

/**
 * Sudoku 4×4 and 6×6 — deterministic generator + solver.
 *
 * Generation: fill a complete valid grid by backtracking, then remove cells
 * (in seeded random order) only while the puzzle BOTH keeps a unique solution
 * (backtracking count, the ground truth) AND stays solvable using only naked
 * and hidden singles — so every puzzle has a child-followable deduction trace
 * and the hint ladder always has a real next step to point at.
 */

export interface SudokuPuzzle {
  size: 4 | 6;
  boxW: number;
  boxH: number;
  /** Row-major, 0 = empty. */
  givens: number[];
  solution: number[];
  level: number;
}

export interface SudokuStep {
  row: number;
  col: number;
  value: number;
  kind: "naked" | "hidden";
  /** Human name of the unit that powered the deduction, e.g. "row 2". */
  unit: string;
  /** Digits that cannot go in the cell (used by hint level 2). */
  eliminated: number[];
  text: string;
}

const DIMS: Record<4 | 6, { boxW: number; boxH: number }> = {
  4: { boxW: 2, boxH: 2 },
  6: { boxW: 3, boxH: 2 },
};

function idxOf(size: number, row: number, col: number): number {
  return row * size + col;
}

function boxOrigin(row: number, col: number, boxW: number, boxH: number): { r0: number; c0: number } {
  return { r0: Math.floor(row / boxH) * boxH, c0: Math.floor(col / boxW) * boxW };
}

function canPlace(grid: number[], size: number, boxW: number, boxH: number, row: number, col: number, d: number): boolean {
  for (let i = 0; i < size; i++) {
    if (grid[idxOf(size, row, i)] === d) return false;
    if (grid[idxOf(size, i, col)] === d) return false;
  }
  const { r0, c0 } = boxOrigin(row, col, boxW, boxH);
  for (let r = r0; r < r0 + boxH; r++)
    for (let c = c0; c < c0 + boxW; c++) if (grid[idxOf(size, r, c)] === d) return false;
  return true;
}

export function candidatesFor(grid: number[], size: number, boxW: number, boxH: number, row: number, col: number): number[] {
  if (grid[idxOf(size, row, col)] !== 0) return [];
  const out: number[] = [];
  for (let d = 1; d <= size; d++) if (canPlace(grid, size, boxW, boxH, row, col, d)) out.push(d);
  return out;
}

/* ------------------------------------------------------------------ *
 * Ground truth: count solutions by backtracking (capped)
 * ------------------------------------------------------------------ */

export function countSudokuSolutions(grid: number[], size: number, boxW: number, boxH: number, cap = 2): number {
  const work = grid.slice();
  let count = 0;
  const search = (): void => {
    if (count >= cap) return;
    const empty = work.indexOf(0);
    if (empty === -1) {
      count++;
      return;
    }
    const row = Math.floor(empty / size);
    const col = empty % size;
    for (let d = 1; d <= size; d++) {
      if (canPlace(work, size, boxW, boxH, row, col, d)) {
        work[empty] = d;
        search();
        work[empty] = 0;
        if (count >= cap) return;
      }
    }
  };
  search();
  return count;
}

/* ------------------------------------------------------------------ *
 * Singles solver with a human-readable deduction trace
 * ------------------------------------------------------------------ */

export interface SudokuTrace {
  solved: boolean;
  steps: SudokuStep[];
  board: number[];
}

interface UnitRef {
  name: string;
  cells: number[]; // indexes
}

function allUnits(size: number, boxW: number, boxH: number): UnitRef[] {
  const units: UnitRef[] = [];
  for (let r = 0; r < size; r++) {
    units.push({ name: `row ${r + 1}`, cells: Array.from({ length: size }, (_, c) => idxOf(size, r, c)) });
  }
  for (let c = 0; c < size; c++) {
    units.push({ name: `column ${c + 1}`, cells: Array.from({ length: size }, (_, r) => idxOf(size, r, c)) });
  }
  for (let r0 = 0; r0 < size; r0 += boxH) {
    for (let c0 = 0; c0 < size; c0 += boxW) {
      const cells: number[] = [];
      for (let r = r0; r < r0 + boxH; r++) for (let c = c0; c < c0 + boxW; c++) cells.push(idxOf(size, r, c));
      units.push({ name: `the box starting at row ${r0 + 1}, column ${c0 + 1}`, cells });
    }
  }
  return units;
}

export function solveSudokuWithTrace(start: number[], size: number, boxW: number, boxH: number): SudokuTrace {
  const board = start.slice();
  const steps: SudokuStep[] = [];
  const units = allUnits(size, boxW, boxH);
  const all = Array.from({ length: size }, (_, i) => i + 1);

  let changed = true;
  while (changed) {
    changed = false;

    // Naked singles: a cell with exactly one candidate.
    for (let i = 0; i < size * size; i++) {
      if (board[i] !== 0) continue;
      const row = Math.floor(i / size);
      const col = i % size;
      const cands = candidatesFor(board, size, boxW, boxH, row, col);
      if (cands.length === 1) {
        const d = cands[0];
        board[i] = d;
        steps.push({
          row,
          col,
          value: d,
          kind: "naked",
          unit: `row ${row + 1}`,
          eliminated: all.filter((x) => x !== d),
          text: `The square at row ${row + 1}, column ${col + 1} has just one number that fits: ${d}. Every other number already lives in its row, column or box.`,
        });
        changed = true;
      }
    }
    if (changed) continue;

    // Hidden singles: in some unit, a digit fits only one cell.
    outer: for (const unit of units) {
      for (const d of all) {
        if (unit.cells.some((i) => board[i] === d)) continue;
        const spots = unit.cells.filter((i) => {
          if (board[i] !== 0) return false;
          const row = Math.floor(i / size);
          const col = i % size;
          return canPlace(board, size, boxW, boxH, row, col, d);
        });
        if (spots.length === 1) {
          const i = spots[0];
          const row = Math.floor(i / size);
          const col = i % size;
          board[i] = d;
          steps.push({
            row,
            col,
            value: d,
            kind: "hidden",
            unit: unit.name,
            eliminated: candidatesFor(start, size, boxW, boxH, row, col).filter((x) => x !== d),
            text: `In ${unit.name}, there's only one square where ${d} can go — row ${row + 1}, column ${col + 1}.`,
          });
          changed = true;
          break outer;
        }
      }
    }
  }

  return { solved: !board.includes(0), steps, board };
}

/* ------------------------------------------------------------------ *
 * Generator
 * ------------------------------------------------------------------ */

/** level → grid shape and how sparse the givens get. */
const LEVELS: { size: 4 | 6; targetGivens: number }[] = [
  { size: 4, targetGivens: 10 },
  { size: 4, targetGivens: 7 },
  { size: 6, targetGivens: 22 },
  { size: 6, targetGivens: 16 },
];

export const SUDOKU_MAX_LEVEL = LEVELS.length;

export function generateSudoku(seed: number, level: number): SudokuPuzzle {
  const spec = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, level - 1))];
  const { size } = spec;
  const { boxW, boxH } = DIMS[size];
  const rng = mulberry32(seed);

  // 1) Fill a complete valid grid by backtracking with seeded digit order.
  const grid = new Array<number>(size * size).fill(0);
  const digits = Array.from({ length: size }, (_, i) => i + 1);
  const fill = (i: number): boolean => {
    if (i === size * size) return true;
    const row = Math.floor(i / size);
    const col = i % size;
    for (const d of shuffle(rng, digits)) {
      if (canPlace(grid, size, boxW, boxH, row, col, d)) {
        grid[i] = d;
        if (fill(i + 1)) return true;
        grid[i] = 0;
      }
    }
    return false;
  };
  fill(0);
  const solution = grid.slice();

  // 2) Remove cells while the puzzle stays unique AND singles-solvable.
  const givens = solution.slice();
  let remaining = size * size;
  for (const i of shuffle(rng, Array.from({ length: size * size }, (_, k) => k))) {
    if (remaining <= spec.targetGivens) break;
    const saved = givens[i];
    givens[i] = 0;
    const ok =
      countSudokuSolutions(givens, size, boxW, boxH, 2) === 1 &&
      solveSudokuWithTrace(givens, size, boxW, boxH).solved;
    if (ok) remaining--;
    else givens[i] = saved;
  }

  return { size, boxW, boxH, givens, solution, level };
}

/* ------------------------------------------------------------------ *
 * Conflicts (for gentle highlighting) and the hint ladder
 * ------------------------------------------------------------------ */

/** Indexes of filled cells that clash with another filled cell. Soft-warn only. */
export function sudokuConflicts(board: number[], size: number, boxW: number, boxH: number): Set<number> {
  const bad = new Set<number>();
  const units = allUnits(size, boxW, boxH);
  for (const unit of units) {
    const seen = new Map<number, number[]>();
    for (const i of unit.cells) {
      const v = board[i];
      if (v === 0) continue;
      const list = seen.get(v) ?? [];
      list.push(i);
      seen.set(v, list);
    }
    for (const list of seen.values()) if (list.length > 1) list.forEach((i) => bad.add(i));
  }
  return bad;
}

export function sudokuHint(p: SudokuPuzzle, board: number[], level: number): Hint {
  const lvl = Math.max(1, Math.min(3, level));
  const { size, boxW, boxH } = p;

  // Wrong entries first — hints never build on a mistake.
  for (let i = 0; i < size * size; i++) {
    if (p.givens[i] === 0 && board[i] !== 0 && board[i] !== p.solution[i]) {
      const row = Math.floor(i / size) + 1;
      const col = (i % size) + 1;
      if (lvl === 1)
        return { level: lvl, givesAnswer: false, text: `Something in row ${row} doesn't quite fit — give your numbers there a second look.` };
      return {
        level: lvl,
        givesAnswer: false,
        text: `The ${board[i]} at row ${row}, column ${col} is causing a tangle — try wiping it and rethinking that square.`,
      };
    }
  }

  // Clean board: ask the solver for its actual next deduction.
  const clean = board.map((v, i) => (p.givens[i] !== 0 ? p.givens[i] : v));
  const { steps } = solveSudokuWithTrace(clean, size, boxW, boxH);
  const next = steps[0];
  if (!next) {
    return { level: lvl, givesAnswer: false, text: "The grid is full — press Check and see how you did!" };
  }

  if (lvl === 1) {
    return {
      level: 1,
      givesAnswer: false,
      text: `Cast your eye over ${next.unit} — one square there has only one number that can fit.`,
    };
  }

  if (lvl === 2) {
    if (next.kind === "hidden") {
      return {
        level: 2,
        givesAnswer: false,
        text: `One number is missing from ${next.unit}, and there's only a single square it can squeeze into. Hunt for it!`,
      };
    }
    const ruled = next.eliminated.slice(0, 2);
    return {
      level: 2,
      givesAnswer: false,
      text: `The square at row ${next.row + 1}, column ${next.col + 1} can't hold ${ruled.join(" or ")}. What's left?`,
    };
  }

  return {
    level: 3,
    givesAnswer: true,
    text: `The square at row ${next.row + 1}, column ${next.col + 1} is asking for a ${next.value}.`,
  };
}
