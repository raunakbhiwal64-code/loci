import { describe, expect, it } from "vitest";
import {
  countGridSolutions,
  emptyMarks,
  generateLogicGrid,
  gridHint,
  gridIsSolved,
  solveGridWithTrace,
  type CellMark,
} from "./logicgrid.js";
import {
  countSudokuSolutions,
  generateSudoku,
  solveSudokuWithTrace,
  sudokuHint,
  SUDOKU_MAX_LEVEL,
} from "./sudoku.js";
import { generateSequence, sequenceHint, termAt, SEQUENCE_MAX_LEVEL, type SequenceRule } from "./sequences.js";
import { ODD_ONE_OUT_ITEMS, ODD_MAX_LEVEL, oddHint, oddRounds } from "./oddoneout.js";

/* ------------------------------------------------------------------ *
 * Logic grids
 * ------------------------------------------------------------------ */

describe("logic grid generator + solver", () => {
  const cases: { seed: number; level: number }[] = [];
  for (let level = 1; level <= 4; level++) for (let seed = 1; seed <= 12; seed++) cases.push({ seed: seed * 37 + level, level });

  it("every generated puzzle has exactly one solution (full enumeration)", () => {
    for (const { seed, level } of cases) {
      const p = generateLogicGrid(seed, level);
      expect(countGridSolutions(p.categories.length, p.clues)).toBe(1);
    }
  });

  it("the propagation solver fully solves every puzzle and matches the secret solution", () => {
    for (const { seed, level } of cases) {
      const p = generateLogicGrid(seed, level);
      const trace = solveGridWithTrace(p);
      expect(trace.solved).toBe(true);
      expect(trace.assignments).toEqual(p.solution);
      expect(trace.steps.length).toBeGreaterThan(0);
    }
  });

  it("marking the solver's solution on the board counts as solved", () => {
    const p = generateLogicGrid(99, 3);
    const marks = emptyMarks(p);
    p.solution.forEach((row, c) =>
      row.forEach((v, person) => {
        marks[c][person][v] = "yes";
      })
    );
    expect(gridIsSolved(p, marks)).toBe(true);
  });

  it("puzzles keep a sensible clue count and level shape", () => {
    for (const { seed, level } of cases) {
      const p = generateLogicGrid(seed, level);
      expect(p.categories.length).toBe(level >= 3 ? 2 : 1);
      expect(p.clues.length).toBeGreaterThanOrEqual(2);
      expect(p.clueTexts.length).toBe(p.clues.length);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Sudoku
 * ------------------------------------------------------------------ */

describe("sudoku generator + solver", () => {
  const cases: { seed: number; level: number }[] = [];
  for (let level = 1; level <= SUDOKU_MAX_LEVEL; level++)
    for (let seed = 1; seed <= 5; seed++) cases.push({ seed: seed * 101 + level, level });

  it("every generated sudoku has exactly one solution", () => {
    for (const { seed, level } of cases) {
      const p = generateSudoku(seed, level);
      expect(countSudokuSolutions(p.givens, p.size, p.boxW, p.boxH, 2)).toBe(1);
    }
  });

  it("the singles solver reaches the stored solution (trace always available)", () => {
    for (const { seed, level } of cases) {
      const p = generateSudoku(seed, level);
      const trace = solveSudokuWithTrace(p.givens, p.size, p.boxW, p.boxH);
      expect(trace.solved).toBe(true);
      expect(trace.board).toEqual(p.solution);
    }
  });

  it("stored solutions are valid grids (rows, columns, boxes complete)", () => {
    for (const { seed, level } of cases) {
      const p = generateSudoku(seed, level);
      const want = Array.from({ length: p.size }, (_, i) => i + 1).join(",");
      for (let r = 0; r < p.size; r++) {
        const row = p.solution.slice(r * p.size, (r + 1) * p.size);
        expect([...row].sort((a, b) => a - b).join(",")).toBe(want);
      }
      for (let c = 0; c < p.size; c++) {
        const col = Array.from({ length: p.size }, (_, r) => p.solution[r * p.size + c]);
        expect(col.sort((a, b) => a - b).join(",")).toBe(want);
      }
      for (let r0 = 0; r0 < p.size; r0 += p.boxH) {
        for (let c0 = 0; c0 < p.size; c0 += p.boxW) {
          const box: number[] = [];
          for (let r = r0; r < r0 + p.boxH; r++)
            for (let c = c0; c < c0 + p.boxW; c++) box.push(p.solution[r * p.size + c]);
          expect(box.sort((a, b) => a - b).join(",")).toBe(want);
        }
      }
    }
  });
});

/* ------------------------------------------------------------------ *
 * Sequences
 * ------------------------------------------------------------------ */

function expectedNext(rule: SequenceRule, terms: number[]): number {
  const n = terms.length;
  switch (rule.kind) {
    case "arithmetic":
      return terms[n - 1] + rule.step;
    case "geometric":
      return terms[n - 1] * rule.ratio;
    case "alternating":
      return terms[n - 1] + ((n - 1) % 2 === 0 ? rule.stepA : rule.stepB);
    case "squares":
      return (rule.startN + n) * (rule.startN + n);
    case "fibonacci":
      return terms[n - 1] + terms[n - 2];
  }
}

describe("sequences", () => {
  const cases: { seed: number; level: number }[] = [];
  for (let level = 1; level <= SEQUENCE_MAX_LEVEL; level++)
    for (let seed = 1; seed <= 20; seed++) cases.push({ seed: seed * 53 + level, level });

  it("the answer always matches the rule (recomputed independently)", () => {
    for (const { seed, level } of cases) {
      const p = generateSequence(seed, level);
      expect(p.answer).toBe(expectedNext(p.rule, p.terms));
      p.terms.forEach((t, i) => expect(t).toBe(termAt(p.rule, i)));
    }
  });

  it("options contain the answer exactly once among four distinct choices", () => {
    for (const { seed, level } of cases) {
      const p = generateSequence(seed, level);
      expect(p.options).toHaveLength(4);
      expect(new Set(p.options).size).toBe(4);
      expect(p.options.filter((o) => o === p.answer)).toHaveLength(1);
    }
  });

  it("reasoning replay ends by naming the answer (post-solve only)", () => {
    for (const { seed, level } of cases) {
      const p = generateSequence(seed, level);
      expect(p.reasoning.length).toBeGreaterThan(0);
      expect(p.reasoning[p.reasoning.length - 1]).toContain(String(p.answer));
    }
  });
});

/* ------------------------------------------------------------------ *
 * Odd one out
 * ------------------------------------------------------------------ */

describe("odd-one-out authored items", () => {
  it("ships 30 structurally valid items", () => {
    expect(ODD_ONE_OUT_ITEMS).toHaveLength(30);
    const ids = new Set<string>();
    for (const item of ODD_ONE_OUT_ITEMS) {
      ids.add(item.id);
      expect(item.choices).toHaveLength(4);
      expect(new Set(item.choices).size).toBe(4);
      expect(item.oddIndex).toBeGreaterThanOrEqual(0);
      expect(item.oddIndex).toBeLessThan(4);
      expect(item.reasons).toHaveLength(3);
      expect(new Set(item.reasons).size).toBe(3);
      expect(item.correctReason).toBeGreaterThanOrEqual(0);
      expect(item.correctReason).toBeLessThan(3);
      expect(item.explanation.length).toBeGreaterThan(10);
    }
    expect(ids.size).toBe(30);
  });

  it("every difficulty band has at least a full round of items", () => {
    for (let level = 1; level <= ODD_MAX_LEVEL; level++) {
      expect(ODD_ONE_OUT_ITEMS.filter((i) => i.level === level).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("rounds shuffle choices and reasons but keep the correct pair intact", () => {
    for (let level = 1; level <= ODD_MAX_LEVEL; level++) {
      for (let seed = 1; seed <= 10; seed++) {
        for (const r of oddRounds(seed * 7 + level, level)) {
          const item = ODD_ONE_OUT_ITEMS.find((i) => i.id === r.id)!;
          expect(r.choices[r.oddIndex]).toBe(item.choices[item.oddIndex]);
          expect(r.reasons[r.correctReason]).toBe(item.reasons[item.correctReason]);
        }
      }
    }
  });
});

/* ------------------------------------------------------------------ *
 * Hint ladder — levels 1–2 never give the final answer
 * ------------------------------------------------------------------ */

describe("hint ladder never skips to the answer at levels 1–2", () => {
  it("logic grids: no positive assignment leaks before level 3", () => {
    for (let level = 1; level <= 4; level++) {
      for (let seed = 1; seed <= 8; seed++) {
        const p = generateLogicGrid(seed * 11 + level, level);
        // Fresh board and a partially-solved board both stay safe.
        const boards: CellMark[][][][] = [emptyMarks(p)];
        const partial = emptyMarks(p);
        const first = solveGridWithTrace(p).steps[0];
        if (first.kind === "eliminate") partial[first.cat][first.person][first.value] = "no";
        else partial[first.cat][first.person][first.value] = "yes";
        boards.push(partial);
        for (const marks of boards) {
          for (const lvl of [1, 2]) {
            const h = gridHint(p, marks, lvl);
            expect(h.givesAnswer).toBe(false);
            expect(h.text).not.toContain("must");
          }
          const h3 = gridHint(p, marks, 3);
          expect(h3.text.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("sudoku: the target cell's value is never stated before level 3", () => {
    for (let level = 1; level <= SUDOKU_MAX_LEVEL; level++) {
      for (let seed = 1; seed <= 4; seed++) {
        const p = generateSudoku(seed * 13 + level, level);
        const board = p.givens.slice();
        const next = solveSudokuWithTrace(p.givens, p.size, p.boxW, p.boxH).steps[0];
        for (const lvl of [1, 2]) {
          const h = sudokuHint(p, board, lvl);
          expect(h.givesAnswer).toBe(false);
          // The hint text must never carry the deduced digit as the payload.
          expect(h.text).not.toContain(`asking for a ${next.value}`);
          expect(h.text).not.toContain(`can go`);
        }
        const h3 = sudokuHint(p, board, 3);
        expect(h3.givesAnswer).toBe(true);
        expect(h3.text).toContain(String(next.value));
      }
    }
  });

  it("sequences: the answer never appears in level 1–2 hints", () => {
    for (let level = 1; level <= SEQUENCE_MAX_LEVEL; level++) {
      for (let seed = 1; seed <= 20; seed++) {
        const p = generateSequence(seed * 29 + level, level);
        const word = new RegExp(`\\b${p.answer}\\b`);
        for (const lvl of [1, 2]) {
          const h = sequenceHint(p, lvl);
          expect(h.givesAnswer).toBe(false);
          expect(word.test(h.text)).toBe(false);
        }
        expect(sequenceHint(p, 3).givesAnswer).toBe(true);
      }
    }
  });

  it("odd-one-out: the odd choice is never named in level 1–2 hints", () => {
    for (let level = 1; level <= ODD_MAX_LEVEL; level++) {
      for (let seed = 1; seed <= 10; seed++) {
        for (const round of oddRounds(seed * 3 + level, level)) {
          const odd = round.choices[round.oddIndex].toLowerCase();
          for (const lvl of [1, 2]) {
            const h = oddHint(round, lvl);
            expect(h.givesAnswer).toBe(false);
            expect(h.text.toLowerCase()).not.toContain(odd);
          }
          expect(oddHint(round, 3).text.toLowerCase()).toContain(odd);
        }
      }
    }
  });
});
