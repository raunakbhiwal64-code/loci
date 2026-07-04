/**
 * Property-style checks for every Abacus problem generator: across all
 * difficulties and many seeds, the stored answer must equal an independent
 * recomputation from the raw operands, and the problem must be well-formed.
 */

import { describe, expect, it } from "vitest";
import {
  FLOW_HIGH,
  FLOW_LOW,
  MAX_DIFFICULTY,
  TECHNIQUES,
  freshAdaptive,
  mulberry32,
  techniqueById,
  updateAdaptive,
  type Problem,
  type TechniqueId,
} from "./techniques.js";

const SEEDS_PER_CASE = 250;

/** Independent recomputation of the expected answer from raw operands. */
const recompute: Record<TechniqueId, (data: Record<string, number>) => number> = {
  complements: (d) => d.base - d.a,
  "double-halve": (d) => (d.mode === 0 ? d.n * 2 : d.n / 2),
  estimate: (d) => (d.a + d.b > d.target ? 1 : 0),
  "left-to-right": (d) => d.a + d.b,
  compensation: (d) => (d.sign === 1 ? d.a + d.b : d.a - d.b),
  "nikhilam-sub": (d) => d.base - d.n,
  "tables-patterns": (d) => d.a * d.b,
  "times-11": (d) => d.n * 11,
  "squares-5": (d) => (10 * d.t + 5) * (10 * d.t + 5),
  "doubling-chains": (d) => d.n * 2 ** d.times,
  "near-base": (d) => d.a * d.b,
};

function generateOne(id: TechniqueId, difficulty: number, seed: number): Problem {
  return techniqueById(id).generate(difficulty, mulberry32(seed));
}

describe("every generator's stored answer matches recomputation", () => {
  for (const technique of TECHNIQUES) {
    describe(technique.id, () => {
      for (let difficulty = 1; difficulty <= MAX_DIFFICULTY; difficulty++) {
        it(`difficulty ${difficulty}: ${SEEDS_PER_CASE} seeded problems check out`, () => {
          for (let seed = 1; seed <= SEEDS_PER_CASE; seed++) {
            const p = generateOne(technique.id, difficulty, seed * 7919 + difficulty);
            const expected = recompute[technique.id](p.data);
            expect(p.answer, `${technique.id} d${difficulty} seed ${seed}: ${p.prompt}`).toBe(expected);
            expect(Number.isInteger(p.answer)).toBe(true);
            expect(p.techniqueId).toBe(technique.id);
            expect(p.difficulty).toBe(difficulty);
            expect(p.prompt.length).toBeGreaterThan(0);
            expect(p.steps.length).toBeGreaterThan(0);
          }
        });
      }
    });
  }
});

describe("generators are deterministic for a given seed", () => {
  for (const technique of TECHNIQUES) {
    it(technique.id, () => {
      for (let difficulty = 1; difficulty <= MAX_DIFFICULTY; difficulty++) {
        const a = generateOne(technique.id, difficulty, 42);
        const b = generateOne(technique.id, difficulty, 42);
        expect(a).toEqual(b);
      }
    });
  }
});

describe("technique-specific shape guarantees", () => {
  it("estimate: never a tie, and choices always contain the answer", () => {
    for (let d = 1; d <= MAX_DIFFICULTY; d++) {
      for (let seed = 1; seed <= SEEDS_PER_CASE; seed++) {
        const p = generateOne("estimate", d, seed);
        expect(p.data.a + p.data.b).not.toBe(p.data.target);
        expect(p.choices?.some((c) => c.value === p.answer)).toBe(true);
      }
    }
  });

  it("nikhilam-sub: minuend digit count always matches the base's zeros", () => {
    for (let d = 1; d <= MAX_DIFFICULTY; d++) {
      for (let seed = 1; seed <= SEEDS_PER_CASE; seed++) {
        const p = generateOne("nikhilam-sub", d, seed);
        expect(String(p.data.n).length).toBe(String(p.data.base).length - 1);
        expect(p.data.n % 10).not.toBe(0); // "last from 10" must always apply
      }
    }
  });

  it("double-halve: halving problems always start from an even number", () => {
    for (let d = 1; d <= MAX_DIFFICULTY; d++) {
      for (let seed = 1; seed <= SEEDS_PER_CASE; seed++) {
        const p = generateOne("double-halve", d, seed);
        if (p.data.mode === 1) expect(p.data.n % 2).toBe(0);
      }
    }
  });

  it("near-base: both factors stay within the near-100 window", () => {
    for (let d = 1; d <= MAX_DIFFICULTY; d++) {
      for (let seed = 1; seed <= SEEDS_PER_CASE; seed++) {
        const p = generateOne("near-base", d, seed);
        expect(p.data.a).toBeGreaterThanOrEqual(85);
        expect(p.data.a).toBeLessThanOrEqual(99);
        expect(p.data.b).toBeGreaterThanOrEqual(85);
        expect(p.data.b).toBeLessThanOrEqual(99);
      }
    }
  });

  it("compensation: subtraction problems never go negative", () => {
    for (let d = 1; d <= MAX_DIFFICULTY; d++) {
      for (let seed = 1; seed <= SEEDS_PER_CASE; seed++) {
        const p = generateOne("compensation", d, seed);
        expect(p.answer).toBeGreaterThan(0);
      }
    }
  });
});

describe("adaptive difficulty holds the 70–85% flow band deterministically", () => {
  it("steps up after sustained success", () => {
    let s = freshAdaptive();
    for (let i = 0; i < 6; i++) s = updateAdaptive(s, true);
    expect(s.difficulty).toBe(2);
    expect(s.recent).toEqual([]); // window resets on a step
  });

  it("steps down after sustained struggle, never below 1", () => {
    let s = { difficulty: 2, recent: [] as number[] };
    for (let i = 0; i < 8; i++) s = updateAdaptive(s, false);
    expect(s.difficulty).toBe(1);
    for (let i = 0; i < 12; i++) s = updateAdaptive(s, false);
    expect(s.difficulty).toBe(1);
  });

  it("holds steady inside the flow band", () => {
    // 3 correct out of every 4 = 75%, inside [FLOW_LOW, FLOW_HIGH];
    // the T,T,F,T phrasing keeps every rolling window inside the band too.
    expect(FLOW_LOW).toBeLessThan(0.75);
    expect(FLOW_HIGH).toBeGreaterThan(0.75);
    let s = freshAdaptive();
    const pattern = [true, true, false, true];
    for (let i = 0; i < 40; i++) s = updateAdaptive(s, pattern[i % 4]);
    expect(s.difficulty).toBe(1);
  });

  it("never exceeds MAX_DIFFICULTY", () => {
    let s = freshAdaptive();
    for (let i = 0; i < 100; i++) s = updateAdaptive(s, true);
    expect(s.difficulty).toBe(MAX_DIFFICULTY);
  });
});
