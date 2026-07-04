import { mulberry32, shuffle } from "./random.js";
import type { Hint } from "./hints.js";

/**
 * Logic grids ("who owns the parrot?") — deterministic generator + solver.
 *
 * Generation: pick a random secret assignment, list every clue consistent
 * with it (direct, negative, relational links between categories), then
 * greedily remove clues while the puzzle stays BOTH unique (checked by full
 * enumeration — the ground truth) AND solvable by the step-by-step
 * constraint-propagation solver (so the deduction trace and hint ladder
 * always work). Nothing unsolvable or multi-solution can ever ship.
 */

export interface GridValue {
  /** Short label for the grid column, e.g. "parrot". */
  short: string;
  /** Phrase used inside clue sentences, e.g. "the parrot". */
  clue: string;
  emoji: string;
}

export interface GridCategory {
  name: string; // "Pet"
  verb: string; // "owns"
  verbBase: string; // "own"
  values: GridValue[]; // exactly 3
}

export type GridClue =
  | { kind: "direct"; cat: number; person: number; value: number }
  | { kind: "negative"; cat: number; person: number; value: number }
  | { kind: "link"; catA: number; valueA: number; catB: number; valueB: number }
  | { kind: "notLink"; catA: number; valueA: number; catB: number; valueB: number };

export interface LogicGridPuzzle {
  people: string[]; // 3 names
  categories: GridCategory[]; // 1 (levels 1–2) or 2 (levels 3+)
  clues: GridClue[];
  clueTexts: string[];
  /** solution[cat][person] = value index (a permutation per category). */
  solution: number[][];
  level: number;
}

export type CellMark = "none" | "yes" | "no";

export interface DeductionStep {
  kind: "assign" | "eliminate";
  cat: number;
  person: number;
  value: number;
  clueIndex?: number;
  text: string;
}

/* ------------------------------------------------------------------ *
 * Content pools
 * ------------------------------------------------------------------ */

const PEOPLE = ["Maya", "Ben", "Zoe", "Aarav", "Lily", "Sam", "Nina", "Omar"];

const CATEGORY_POOL: GridCategory[] = [
  {
    name: "Pet",
    verb: "owns",
    verbBase: "own",
    values: [
      { short: "parrot", clue: "the parrot", emoji: "🦜" },
      { short: "cat", clue: "the cat", emoji: "🐱" },
      { short: "dog", clue: "the dog", emoji: "🐶" },
      { short: "rabbit", clue: "the rabbit", emoji: "🐰" },
      { short: "turtle", clue: "the turtle", emoji: "🐢" },
    ],
  },
  {
    name: "Drink",
    verb: "drinks",
    verbBase: "drink",
    values: [
      { short: "mango juice", clue: "the mango juice", emoji: "🥭" },
      { short: "milk", clue: "the milk", emoji: "🥛" },
      { short: "lemonade", clue: "the lemonade", emoji: "🍋" },
      { short: "cocoa", clue: "the cocoa", emoji: "☕" },
    ],
  },
  {
    name: "Sport",
    verb: "plays",
    verbBase: "play",
    values: [
      { short: "chess", clue: "chess", emoji: "♟️" },
      { short: "football", clue: "football", emoji: "⚽" },
      { short: "tennis", clue: "tennis", emoji: "🎾" },
      { short: "badminton", clue: "badminton", emoji: "🏸" },
    ],
  },
  {
    name: "Fruit",
    verb: "likes",
    verbBase: "like",
    values: [
      { short: "apple", clue: "the apple", emoji: "🍎" },
      { short: "banana", clue: "the banana", emoji: "🍌" },
      { short: "orange", clue: "the orange", emoji: "🍊" },
      { short: "grapes", clue: "the grapes", emoji: "🍇" },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Clue text
 * ------------------------------------------------------------------ */

export function clueText(p: LogicGridPuzzle, clue: GridClue): string {
  switch (clue.kind) {
    case "direct": {
      const cat = p.categories[clue.cat];
      return `${p.people[clue.person]} ${cat.verb} ${cat.values[clue.value].clue}.`;
    }
    case "negative": {
      const cat = p.categories[clue.cat];
      return `${p.people[clue.person]} does not ${cat.verbBase} ${cat.values[clue.value].clue}.`;
    }
    case "link": {
      const a = p.categories[clue.catA];
      const b = p.categories[clue.catB];
      return `The child who ${a.verb} ${a.values[clue.valueA].clue} also ${b.verb} ${b.values[clue.valueB].clue}.`;
    }
    case "notLink": {
      const a = p.categories[clue.catA];
      const b = p.categories[clue.catB];
      return `The child who ${a.verb} ${a.values[clue.valueA].clue} does not ${b.verbBase} ${b.values[clue.valueB].clue}.`;
    }
  }
}

/* ------------------------------------------------------------------ *
 * Ground-truth uniqueness check: full enumeration (3! or 3!×3! worlds)
 * ------------------------------------------------------------------ */

const PERMS3: readonly (readonly number[])[] = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

function clueHolds(clue: GridClue, assign: readonly (readonly number[])[]): boolean {
  switch (clue.kind) {
    case "direct":
      return assign[clue.cat][clue.person] === clue.value;
    case "negative":
      return assign[clue.cat][clue.person] !== clue.value;
    case "link": {
      const person = assign[clue.catA].indexOf(clue.valueA);
      return assign[clue.catB][person] === clue.valueB;
    }
    case "notLink": {
      const person = assign[clue.catA].indexOf(clue.valueA);
      return assign[clue.catB][person] !== clue.valueB;
    }
  }
}

export function countGridSolutions(catCount: number, clues: GridClue[]): number {
  let count = 0;
  if (catCount === 1) {
    for (const a of PERMS3) if (clues.every((c) => clueHolds(c, [a]))) count++;
  } else {
    for (const a of PERMS3)
      for (const b of PERMS3) if (clues.every((c) => clueHolds(c, [a, b]))) count++;
  }
  return count;
}

/* ------------------------------------------------------------------ *
 * Constraint-propagation solver with a human-readable deduction trace
 * ------------------------------------------------------------------ */

export interface GridTrace {
  solved: boolean;
  steps: DeductionStep[];
  /** assignments[cat][person] = value index, or -1 if the solver got stuck. */
  assignments: number[][];
}

export function solveGridWithTrace(p: LogicGridPuzzle): GridTrace {
  const nc = p.categories.length;
  const poss: boolean[][][] = Array.from({ length: nc }, () =>
    Array.from({ length: 3 }, () => [true, true, true])
  );
  const assigned: number[][] = Array.from({ length: nc }, () => [-1, -1, -1]);
  const steps: DeductionStep[] = [];

  const eliminate = (cat: number, person: number, value: number, text: string, clueIndex?: number): boolean => {
    if (!poss[cat][person][value] || assigned[cat][person] === value) return false;
    poss[cat][person][value] = false;
    steps.push({ kind: "eliminate", cat, person, value, clueIndex, text });
    return true;
  };

  const assign = (cat: number, person: number, value: number, text: string, clueIndex?: number): boolean => {
    if (assigned[cat][person] !== -1) return false;
    assigned[cat][person] = value;
    for (let v = 0; v < 3; v++) if (v !== value) poss[cat][person][v] = false;
    for (let q = 0; q < 3; q++) if (q !== person) poss[cat][q][value] = false;
    steps.push({ kind: "assign", cat, person, value, clueIndex, text });
    return true;
  };

  let changed = true;
  let guard = 0;
  while (changed && guard++ < 300) {
    changed = false;

    p.clues.forEach((clue, ci) => {
      const n = ci + 1;
      switch (clue.kind) {
        case "direct": {
          const cat = p.categories[clue.cat];
          changed =
            assign(
              clue.cat,
              clue.person,
              clue.value,
              `Clue ${n} says it straight: ${p.people[clue.person]} ${cat.verb} ${cat.values[clue.value].clue}.`,
              ci
            ) || changed;
          break;
        }
        case "negative": {
          const cat = p.categories[clue.cat];
          changed =
            eliminate(
              clue.cat,
              clue.person,
              clue.value,
              `Clue ${n} rules one out: ${p.people[clue.person]} doesn't ${cat.verbBase} ${cat.values[clue.value].clue}. Cross it off.`,
              ci
            ) || changed;
          break;
        }
        case "link": {
          const a = p.categories[clue.catA];
          const b = p.categories[clue.catB];
          const vA = a.values[clue.valueA].clue;
          const vB = b.values[clue.valueB].clue;
          for (let q = 0; q < 3; q++) {
            const name = p.people[q];
            if (!poss[clue.catA][q][clue.valueA])
              changed =
                eliminate(
                  clue.catB,
                  q,
                  clue.valueB,
                  `Clue ${n} ties ${vA} to ${vB}. ${name} can't have ${vA}, so cross off ${vB} for ${name} too.`,
                  ci
                ) || changed;
            if (!poss[clue.catB][q][clue.valueB])
              changed =
                eliminate(
                  clue.catA,
                  q,
                  clue.valueA,
                  `Clue ${n} ties ${vA} to ${vB}. ${name} can't have ${vB}, so cross off ${vA} for ${name} too.`,
                  ci
                ) || changed;
            if (assigned[clue.catA][q] === clue.valueA)
              changed =
                assign(
                  clue.catB,
                  q,
                  clue.valueB,
                  `${name} has ${vA}, and clue ${n} ties it to ${vB} — so ${name} ${b.verb} ${vB} as well!`,
                  ci
                ) || changed;
            if (assigned[clue.catB][q] === clue.valueB)
              changed =
                assign(
                  clue.catA,
                  q,
                  clue.valueA,
                  `${name} has ${vB}, and clue ${n} ties it to ${vA} — so ${name} ${a.verb} ${vA} as well!`,
                  ci
                ) || changed;
          }
          break;
        }
        case "notLink": {
          const a = p.categories[clue.catA];
          const b = p.categories[clue.catB];
          const vA = a.values[clue.valueA].clue;
          const vB = b.values[clue.valueB].clue;
          for (let q = 0; q < 3; q++) {
            const name = p.people[q];
            if (assigned[clue.catA][q] === clue.valueA)
              changed =
                eliminate(
                  clue.catB,
                  q,
                  clue.valueB,
                  `Clue ${n}: the child with ${vA} doesn't ${b.verbBase} ${vB}. That's ${name} — cross off ${vB}.`,
                  ci
                ) || changed;
            if (assigned[clue.catB][q] === clue.valueB)
              changed =
                eliminate(
                  clue.catA,
                  q,
                  clue.valueA,
                  `Clue ${n}: the child with ${vA} doesn't ${b.verbBase} ${vB}. ${name} has ${vB}, so cross off ${vA}.`,
                  ci
                ) || changed;
          }
          break;
        }
      }
    });

    // Row singles: a person with only one open value must have it.
    for (let c = 0; c < nc; c++) {
      const cat = p.categories[c];
      for (let q = 0; q < 3; q++) {
        if (assigned[c][q] !== -1) continue;
        const open = [0, 1, 2].filter((v) => poss[c][q][v]);
        if (open.length === 1) {
          changed =
            assign(
              c,
              q,
              open[0],
              `${p.people[q]}'s row has one box left — ${p.people[q]} must ${cat.verbBase} ${cat.values[open[0]].clue}!`
            ) || changed;
        }
      }
      // Column singles: a value that fits only one person must be theirs.
      for (let v = 0; v < 3; v++) {
        if (assigned[c].includes(v)) continue;
        const fits = [0, 1, 2].filter((q) => poss[c][q][v]);
        if (fits.length === 1 && assigned[c][fits[0]] === -1) {
          changed =
            assign(
              c,
              fits[0],
              v,
              `No one else can have ${cat.values[v].clue} — it must be ${p.people[fits[0]]}'s!`
            ) || changed;
        }
      }
    }
  }

  const solved = assigned.every((row) => row.every((v) => v !== -1));
  return { solved, steps, assignments: assigned };
}

/* ------------------------------------------------------------------ *
 * Generator: random solution → candidate clues → greedy minimisation
 * ------------------------------------------------------------------ */

export function generateLogicGrid(seed: number, level: number): LogicGridPuzzle {
  const rng = mulberry32(seed);
  const people = shuffle(rng, PEOPLE).slice(0, 3);
  const catCount = level >= 3 ? 2 : 1;
  const categories = shuffle(rng, CATEGORY_POOL)
    .slice(0, catCount)
    .map((d) => ({ ...d, values: shuffle(rng, d.values).slice(0, 3) }));
  const solution = categories.map(() => shuffle(rng, [0, 1, 2]));

  // Every clue consistent with the secret solution.
  const candidates: GridClue[] = [];
  categories.forEach((_, c) => {
    for (let q = 0; q < 3; q++) {
      candidates.push({ kind: "direct", cat: c, person: q, value: solution[c][q] });
      for (let v = 0; v < 3; v++)
        if (v !== solution[c][q]) candidates.push({ kind: "negative", cat: c, person: q, value: v });
    }
  });
  if (catCount === 2) {
    for (let q = 0; q < 3; q++) {
      candidates.push({ kind: "link", catA: 0, valueA: solution[0][q], catB: 1, valueB: solution[1][q] });
      for (let r = 0; r < 3; r++)
        if (r !== q)
          candidates.push({ kind: "notLink", catA: 0, valueA: solution[0][q], catB: 1, valueB: solution[1][r] });
    }
  }

  // Removal priority tunes the flavour per level: level 1 keeps friendly
  // direct clues; higher levels shed directs first, leaving negatives/links.
  const removalRank = (c: GridClue): number => {
    if (level <= 1) return c.kind === "negative" ? 0 : c.kind === "direct" ? 1 : 2;
    if (c.kind === "direct") return 0;
    if (level >= 4 && c.kind === "negative") return 1;
    return 2;
  };
  let clues = shuffle(rng, candidates).sort((a, b) => removalRank(a) - removalRank(b));

  const stillGood = (cs: GridClue[]): boolean => {
    if (countGridSolutions(catCount, cs) !== 1) return false;
    const probe: LogicGridPuzzle = { people, categories, clues: cs, clueTexts: [], solution, level };
    return solveGridWithTrace(probe).solved;
  };

  // Greedy minimisation: drop each clue if the rest stays unique + traceable.
  for (let i = 0; i < clues.length; ) {
    const rest = clues.slice(0, i).concat(clues.slice(i + 1));
    if (stillGood(rest)) clues = rest;
    else i++;
  }

  clues = shuffle(rng, clues); // present in a neutral order
  const puzzle: LogicGridPuzzle = { people, categories, clues, clueTexts: [], solution, level };
  puzzle.clueTexts = clues.map((c) => clueText(puzzle, c));
  return puzzle;
}

/* ------------------------------------------------------------------ *
 * Hint ladder — computed from the solver's actual next deduction
 * ------------------------------------------------------------------ */

export function emptyMarks(p: LogicGridPuzzle): CellMark[][][] {
  return p.categories.map(() => Array.from({ length: 3 }, () => ["none", "none", "none"] as CellMark[]));
}

export function gridHint(p: LogicGridPuzzle, marks: CellMark[][][], level: number): Hint {
  const lvl = Math.max(1, Math.min(3, level));

  // First, gently fix wrong marks — hints never build on a mistake.
  for (let c = 0; c < p.categories.length; c++) {
    for (let q = 0; q < 3; q++) {
      for (let v = 0; v < 3; v++) {
        const truth = p.solution[c][q] === v;
        const m = marks[c][q][v];
        if ((m === "yes" && !truth) || (m === "no" && truth)) {
          const cat = p.categories[c];
          if (lvl === 1)
            return {
              level: lvl,
              givesAnswer: false,
              text: `Hmm — one of your marks doesn't match the clues. Peek at ${p.people[q]}'s row in the ${cat.name} grid.`,
            };
          return {
            level: lvl,
            givesAnswer: false,
            text: `Try clearing the mark for ${p.people[q]} and ${cat.values[v].short}, then read the clues again — something sneaky is hiding there.`,
          };
        }
      }
    }
  }

  const { steps } = solveGridWithTrace(p);
  const next = steps.find((s) =>
    s.kind === "eliminate" ? marks[s.cat][s.person][s.value] !== "no" : marks[s.cat][s.person][s.value] !== "yes"
  );
  if (!next) {
    return { level: lvl, givesAnswer: false, text: "You've already worked everything out — press Check!" };
  }

  const cat = p.categories[next.cat];
  const person = p.people[next.person];
  const val = cat.values[next.value];

  if (lvl === 1) {
    return {
      level: 1,
      givesAnswer: false,
      text:
        next.clueIndex !== undefined
          ? `Read clue ${next.clueIndex + 1} again, nice and slow — it's hiding your next move.`
          : `Look at ${person}'s row in the ${cat.name} grid and count how many boxes are still open.`,
    };
  }

  if (lvl === 2) {
    if (next.kind === "eliminate") {
      return {
        level: 2,
        givesAnswer: false,
        text: `Here's a nudge: ${person} can't ${cat.verbBase} ${val.clue}. Cross that box off and see what happens.`,
      };
    }
    const others = p.people.filter((_, i) => i !== next.person);
    return {
      level: 2,
      givesAnswer: false,
      text: `Think about ${val.clue}: it can't be ${others[0]}'s, and it can't be ${others[1]}'s… so whose is it?`,
    };
  }

  return { level: 3, givesAnswer: next.kind === "assign", text: next.text };
}

/** Did the child's ✓ marks exactly match the secret solution? */
export function gridIsSolved(p: LogicGridPuzzle, marks: CellMark[][][]): boolean {
  for (let c = 0; c < p.categories.length; c++) {
    for (let q = 0; q < 3; q++) {
      for (let v = 0; v < 3; v++) {
        const want = p.solution[c][q] === v;
        if (want && marks[c][q][v] !== "yes") return false;
        if (!want && marks[c][q][v] === "yes") return false;
      }
    }
  }
  return true;
}
