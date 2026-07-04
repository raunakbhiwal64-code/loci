/**
 * Abacus — technique catalogue (PRD 4.3, tracks 1–3).
 *
 * Pure logic, no React: lesson content, deterministic problem generators,
 * per-step explainers, and the adaptive-difficulty rule. Everything here is
 * computable offline; nothing is ever trusted from a model.
 */

/* ------------------------------------------------------------------ *
 * Deterministic randomness
 * ------------------------------------------------------------------ */

export type Rng = () => number;

/** mulberry32 — tiny deterministic PRNG, good enough for problem variety. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inclusive integer in [lo, hi]. */
export function randInt(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export type TechniqueId =
  | "complements"
  | "double-halve"
  | "estimate"
  | "left-to-right"
  | "compensation"
  | "nikhilam-sub"
  | "tables-patterns"
  | "times-11"
  | "squares-5"
  | "doubling-chains"
  | "near-base";

export const MAX_DIFFICULTY = 3;

export interface Problem {
  techniqueId: TechniqueId;
  difficulty: number;
  /** What the child sees, e.g. "47 + 99 = ?". */
  prompt: string;
  /** The one true answer (for choice problems, the value of the right choice). */
  answer: number;
  /** Deterministic step breakdown — the drill engine's own explanation. */
  steps: string[];
  /** Raw operands, so tests (and the error coach) can recompute the answer. */
  data: Record<string, number>;
  /** When present, render buttons instead of a number input. */
  choices?: { label: string; value: number }[];
}

export interface Technique {
  id: TechniqueId;
  track: 1 | 2 | 3;
  name: string;
  emoji: string;
  blurb: string;
  /** The Guide's one-liner that opens the lesson. */
  lessonIntro: string;
  /** A worked example, revealed line by line with the Next button. */
  lessonSteps: string[];
  generate(difficulty: number, rng: Rng): Problem;
}

export interface Track {
  track: 1 | 2 | 3;
  name: string;
  emoji: string;
}

export const TRACKS: Track[] = [
  { track: 1, name: "Number sense", emoji: "🔢" },
  { track: 2, name: "Add & subtract craft", emoji: "➕" },
  { track: 3, name: "Multiplication craft", emoji: "✖️" },
];

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

function clampDifficulty(d: number): number {
  return Math.max(1, Math.min(MAX_DIFFICULTY, Math.round(d)));
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/* ------------------------------------------------------------------ *
 * Track 1 — Number sense foundations
 * ------------------------------------------------------------------ */

const complements: Technique = {
  id: "complements",
  track: 1,
  name: "Number bonds",
  emoji: "🤝",
  blurb: "Find the friend that makes 10 or 100.",
  lessonIntro: "Every number has a best friend — together they make a round number. Spot the friend and sums get easy.",
  lessonSteps: [
    "Let's find the friend of 64 that makes 100.",
    "Trick: every digit reaches for 9 — except the last one, which reaches for 10.",
    "Tens digit: 6 needs 3 to make 9.",
    "Ones digit: 4 needs 6 to make 10.",
    "So the friend is 36. Check it: 64 + 36 = 100 ✓",
  ],
  generate(difficulty, rng) {
    const d = clampDifficulty(difficulty);
    if (d === 1) {
      const a = randInt(rng, 1, 9);
      return {
        techniqueId: "complements",
        difficulty: d,
        prompt: `${a} + ? = 10`,
        answer: 10 - a,
        steps: [`${a} and ${10 - a} are friends — together they make 10.`, `${a} + ${10 - a} = 10 ✓`],
        data: { a, base: 10 },
      };
    }
    if (d === 2) {
      const a = randInt(rng, 1, 19) * 5; // multiples of 5 up to 95
      const ans = 100 - a;
      return {
        techniqueId: "complements",
        difficulty: d,
        prompt: `${a} + ? = 100`,
        answer: ans,
        steps: [
          `Count up from ${a} to the next friendly stop, then to 100.`,
          a % 10 === 0
            ? `${a / 10} tens need ${ans / 10} more tens to make 10 tens.`
            : `${a} + 5 = ${a + 5}, then ${a + 5} + ${100 - a - 5} = 100.`,
          `${a} + ${ans} = 100 ✓`,
        ],
        data: { a, base: 100 },
      };
    }
    // d3: any two-digit number, last digit never 0 — the all-from-9 pattern shines
    const tens = randInt(rng, 1, 8);
    const ones = randInt(rng, 1, 9);
    const a = tens * 10 + ones;
    const ans = 100 - a;
    return {
      techniqueId: "complements",
      difficulty: d,
      prompt: `${a} + ? = 100`,
      answer: ans,
      steps: [
        "All from 9, the last from 10:",
        `Tens: 9 − ${tens} = ${9 - tens}`,
        `Ones: 10 − ${ones} = ${10 - ones}`,
        `${a} + ${ans} = 100 ✓`,
      ],
      data: { a, base: 100 },
    };
  },
};

const doubleHalve: Technique = {
  id: "double-halve",
  track: 1,
  name: "Doubling & halving",
  emoji: "🪞",
  blurb: "Double it, halve it — piece by piece.",
  lessonIntro: "To double a big number, double its pieces and glue them back together. Halving works the same in reverse.",
  lessonSteps: [
    "Let's double 47.",
    "Split it: 47 is 40 and 7.",
    "Double 40 = 80. Double 7 = 14.",
    "Glue: 80 + 14 = 94.",
    "Double 47 = 94 — no columns needed!",
  ],
  generate(difficulty, rng) {
    const d = clampDifficulty(difficulty);
    const doubling = rng() < 0.5;
    if (doubling) {
      const n = d === 1 ? randInt(rng, 6, 25) : d === 2 ? randInt(rng, 26, 99) : randInt(rng, 100, 499);
      const hi = Math.floor(n / 10) * 10;
      const lo = n - hi;
      return {
        techniqueId: "double-halve",
        difficulty: d,
        prompt: `Double ${n}`,
        answer: n * 2,
        steps: [
          `Split ${n} into ${hi} and ${lo}.`,
          `Double ${hi} = ${hi * 2}. Double ${lo} = ${lo * 2}.`,
          `${hi * 2} + ${lo * 2} = ${n * 2}`,
        ],
        data: { n, mode: 0 },
      };
    }
    const half = d === 1 ? randInt(rng, 3, 25) : d === 2 ? randInt(rng, 26, 99) : randInt(rng, 100, 499);
    const n = half * 2;
    const hiHalf = Math.floor(half / 10) * 10;
    const hi = hiHalf * 2;
    const lo = n - hi;
    return {
      techniqueId: "double-halve",
      difficulty: d,
      prompt: `Half of ${n}`,
      answer: half,
      steps: [
        `Split ${n} into ${hi} and ${lo}.`,
        `Half of ${hi} = ${hi / 2}. Half of ${lo} = ${lo / 2}.`,
        `${hi / 2} + ${lo / 2} = ${half}`,
      ],
      data: { n, mode: 1 },
    };
  },
};

const estimate: Technique = {
  id: "estimate",
  track: 1,
  name: "Rounding & estimation",
  emoji: "🔭",
  blurb: "Answer 'bigger or smaller?' before anyone finishes adding.",
  lessonIntro: "Sometimes you don't need the exact answer — just which side of a line it lands on. Round, add the easy numbers, decide.",
  lessonSteps: [
    "Is 268 + 314 bigger or smaller than 500?",
    "Round each one: 268 is close to 270, 314 is close to 310.",
    "Easy sum: 270 + 310 = 580.",
    "580 is well past 500 — so the real answer is bigger than 500.",
    "You decided without doing the hard sum. That's estimation power!",
  ],
  generate(difficulty, rng) {
    const d = clampDifficulty(difficulty);
    const target = d === 1 ? 100 : d === 2 ? 500 : 1000;
    let a = d === 1 ? randInt(rng, 21, 69) : d === 2 ? randInt(rng, 120, 380) : randInt(rng, 260, 740);
    let b = d === 1 ? randInt(rng, 21, 69) : d === 2 ? randInt(rng, 120, 380) : randInt(rng, 260, 740);
    if (a + b === target) b += 7; // never a tie — "bigger or smaller" must have one true answer
    const ra = Math.round(a / 10) * 10;
    const rb = Math.round(b / 10) * 10;
    const sum = a + b;
    const bigger = sum > target;
    const steps = [
      `Round: ${a} is close to ${ra}, ${b} is close to ${rb}.`,
      `Easy sum: ${ra} + ${rb} = ${ra + rb}.`,
    ];
    if (ra + rb === target) {
      steps.push(`Photo finish! Check exactly: ${a} + ${b} = ${sum}.`);
    }
    steps.push(`${sum} is ${bigger ? "bigger" : "smaller"} than ${target}.`);
    return {
      techniqueId: "estimate",
      difficulty: d,
      prompt: `Is ${a} + ${b} bigger or smaller than ${target}?`,
      answer: bigger ? 1 : 0,
      steps,
      data: { a, b, target },
      choices: [
        { label: `Smaller than ${target}`, value: 0 },
        { label: `Bigger than ${target}`, value: 1 },
      ],
    };
  },
};

/* ------------------------------------------------------------------ *
 * Track 2 — Addition & subtraction craft
 * ------------------------------------------------------------------ */

const leftToRight: Technique = {
  id: "left-to-right",
  track: 2,
  name: "Left-to-right addition",
  emoji: "➡️",
  blurb: "Add the big parts first, the way you read.",
  lessonIntro: "School says start from the right. Mental math says start from the left — big pieces first, then the small ones.",
  lessonSteps: [
    "Let's add 47 + 38, left to right.",
    "Tens first: 40 + 30 = 70.",
    "Now the ones: 7 + 8 = 15.",
    "Put them together: 70 + 15 = 85.",
    "47 + 38 = 85 — and you said the big part of the answer first!",
  ],
  generate(difficulty, rng) {
    const d = clampDifficulty(difficulty);
    if (d <= 2) {
      const a = d === 1 ? randInt(rng, 12, 49) : randInt(rng, 25, 99);
      const b = d === 1 ? randInt(rng, 12, 49) : randInt(rng, 25, 99);
      const at = Math.floor(a / 10) * 10;
      const bt = Math.floor(b / 10) * 10;
      const ao = a - at;
      const bo = b - bt;
      return {
        techniqueId: "left-to-right",
        difficulty: d,
        prompt: `${a} + ${b} = ?`,
        answer: a + b,
        steps: [
          `Tens first: ${at} + ${bt} = ${at + bt}.`,
          `Ones: ${ao} + ${bo} = ${ao + bo}.`,
          `${at + bt} + ${ao + bo} = ${a + b}`,
        ],
        data: { a, b },
      };
    }
    const a = randInt(rng, 111, 499);
    const b = randInt(rng, 111, 499);
    const ah = Math.floor(a / 100) * 100;
    const bh = Math.floor(b / 100) * 100;
    const at = Math.floor((a % 100) / 10) * 10;
    const bt = Math.floor((b % 100) / 10) * 10;
    const ao = a % 10;
    const bo = b % 10;
    const afterH = ah + bh;
    const afterT = afterH + at + bt;
    return {
      techniqueId: "left-to-right",
      difficulty: d,
      prompt: `${a} + ${b} = ?`,
      answer: a + b,
      steps: [
        `Hundreds first: ${ah} + ${bh} = ${afterH}.`,
        `Tens: ${at} + ${bt} = ${at + bt} → ${afterT}.`,
        `Ones: ${ao} + ${bo} = ${ao + bo} → ${a + b}.`,
      ],
      data: { a, b },
    };
  },
};

interface CompShape {
  b: number; // the awkward number, e.g. 99
  r: number; // the friendly round number it hides behind, e.g. 100
}

const compensation: Technique = {
  id: "compensation",
  track: 2,
  name: "Compensation",
  emoji: "🎭",
  blurb: "Adding 99? Add 100, give 1 back.",
  lessonIntro: "Numbers like 99 are round numbers in disguise. Use the round one, then fix the tiny difference.",
  lessonSteps: [
    "Let's do 47 + 99.",
    "99 is sneaky-close to 100.",
    "So add 100 instead: 47 + 100 = 147.",
    "But we added 1 too many — give it back: 147 − 1 = 146.",
    "47 + 99 = 146, done in your head!",
  ],
  generate(difficulty, rng) {
    const d = clampDifficulty(difficulty);
    const shapes: CompShape[] =
      d === 1
        ? [
            { b: 9, r: 10 },
            { b: 19, r: 20 },
          ]
        : d === 2
          ? [
              { b: 99, r: 100 },
              { b: 98, r: 100 },
            ]
          : [
              { b: 99, r: 100 },
              { b: 98, r: 100 },
              { b: 199, r: 200 },
            ];
    const { b, r } = pick(rng, shapes);
    const subtracting = d === 3 && rng() < 0.5;
    const diff = r - b;
    if (subtracting) {
      const a = randInt(rng, 250, 700);
      return {
        techniqueId: "compensation",
        difficulty: d,
        prompt: `${a} − ${b} = ?`,
        answer: a - b,
        steps: [
          `${b} hides behind ${r}.`,
          `Take away ${r} instead: ${a} − ${r} = ${a - r}.`,
          `We took ${diff} too many — hand ${diff} back: ${a - r} + ${diff} = ${a - b}.`,
        ],
        data: { a, b, sign: -1 },
      };
    }
    const a = d === 1 ? randInt(rng, 15, 85) : randInt(rng, 37, 460);
    return {
      techniqueId: "compensation",
      difficulty: d,
      prompt: `${a} + ${b} = ?`,
      answer: a + b,
      steps: [
        `${b} is sneaky-close to ${r}.`,
        `Add ${r} instead: ${a} + ${r} = ${a + r}.`,
        `We added ${diff} too many — give ${diff} back: ${a + r} − ${diff} = ${a + b}.`,
      ],
      data: { a, b, sign: 1 },
    };
  },
};

const nikhilamSub: Technique = {
  id: "nikhilam-sub",
  track: 2,
  name: "All from 9, last from 10",
  emoji: "🎩",
  blurb: "Subtract from 100, 1000, 10000 — instantly.",
  lessonIntro: "Subtracting from 1000 the school way means borrowing three times. The Vedic way: every digit from 9, the last from 10.",
  lessonSteps: [
    "Let's find 1000 − 647.",
    "Say it with me: all from 9, the last from 10.",
    "First digit: 9 − 6 = 3.",
    "Next digit: 9 − 4 = 5.",
    "Last digit: 10 − 7 = 3.",
    "1000 − 647 = 353. No borrowing, ever!",
  ],
  generate(difficulty, rng) {
    const d = clampDifficulty(difficulty);
    const digits = d + 1; // 2, 3, 4
    const base = 10 ** digits;
    // last digit never 0 so the "last from 10" rule always applies cleanly
    const lead = randInt(rng, 1, 8);
    let n = lead;
    for (let i = 1; i < digits - 1; i++) n = n * 10 + randInt(rng, 0, 9);
    n = n * 10 + randInt(rng, 1, 9);
    const ds = String(n).split("").map(Number);
    const steps: string[] = ["All from 9, the last from 10:"];
    ds.forEach((digit, i) => {
      const last = i === ds.length - 1;
      steps.push(last ? `Last digit: 10 − ${digit} = ${10 - digit}.` : `Digit: 9 − ${digit} = ${9 - digit}.`);
    });
    steps.push(`${base} − ${n} = ${base - n}`);
    return {
      techniqueId: "nikhilam-sub",
      difficulty: d,
      prompt: `${base} − ${n} = ?`,
      answer: base - n,
      steps,
      data: { base, n },
    };
  },
};

/* ------------------------------------------------------------------ *
 * Track 3 — Multiplication craft
 * ------------------------------------------------------------------ */

const tablesPatterns: Technique = {
  id: "tables-patterns",
  track: 3,
  name: "Tables as patterns",
  emoji: "🧩",
  blurb: "Don't chant tables — rebuild them from patterns.",
  lessonIntro: "You never need to memorise a whole table. ×9 is ×10 minus one. ×5 is half of ×10. Every fact is a short hop from one you know.",
  lessonSteps: [
    "Forgot 7 × 9? No problem.",
    "×9 is just ×10 with one taken away.",
    "7 × 10 = 70.",
    "Take one 7 away: 70 − 7 = 63.",
    "7 × 9 = 63 — rebuilt, not memorised.",
  ],
  generate(difficulty, rng) {
    const d = clampDifficulty(difficulty);
    const a = d === 1 ? randInt(rng, 2, 5) : d === 2 ? randInt(rng, 6, 9) : randInt(rng, 6, 9);
    const b = d === 3 ? randInt(rng, 6, 12) : randInt(rng, 3, 9);
    const ans = a * b;
    let steps: string[];
    if (b === 9) {
      steps = [`×9 is ×10 with one ${a} taken away.`, `${a} × 10 = ${a * 10}.`, `${a * 10} − ${a} = ${ans}.`];
    } else if (b === 5) {
      steps = [`×5 is half of ×10.`, `${a} × 10 = ${a * 10}.`, `Half of ${a * 10} = ${ans}.`];
    } else if (b === 11) {
      steps = [`×11 is ×10 plus one more ${a}.`, `${a} × 10 = ${a * 10}.`, `${a * 10} + ${a} = ${ans}.`];
    } else if (b === 12) {
      steps = [`×12 is ×10 plus ×2.`, `${a} × 10 = ${a * 10}, ${a} × 2 = ${a * 2}.`, `${a * 10} + ${a * 2} = ${ans}.`];
    } else if (b % 2 === 0) {
      steps = [
        `${a} × ${b} is ${a} × ${b / 2}, doubled.`,
        `${a} × ${b / 2} = ${(a * b) / 2}.`,
        `Double ${(a * b) / 2} = ${ans}.`,
      ];
    } else {
      steps = [
        `${a} × ${b} is ${a} × ${b - 1} plus one more ${a}.`,
        `${a} × ${b - 1} = ${a * (b - 1)}.`,
        `${a * (b - 1)} + ${a} = ${ans}.`,
      ];
    }
    return {
      techniqueId: "tables-patterns",
      difficulty: d,
      prompt: `${a} × ${b} = ?`,
      answer: ans,
      steps,
      data: { a, b },
    };
  },
};

const times11: Technique = {
  id: "times-11",
  track: 3,
  name: "The ×11 pattern",
  emoji: "1️⃣1️⃣",
  blurb: "Two-digit ×11 in one glance.",
  lessonIntro: "Multiplying by 11 has a secret: the answer is hiding inside the number already. Just make room in the middle.",
  lessonSteps: [
    "Let's do 45 × 11.",
    "Pull 45 apart: 4 _ 5.",
    "The middle is the two digits added: 4 + 5 = 9.",
    "Slot it in: 4 9 5.",
    "45 × 11 = 495. One glance!",
  ],
  generate(difficulty, rng) {
    const d = clampDifficulty(difficulty);
    let t: number;
    let o: number;
    if (d === 1) {
      // no carry: digit sum ≤ 9
      t = randInt(rng, 1, 4);
      o = randInt(rng, 0, 9 - t);
    } else if (d === 2) {
      t = randInt(rng, 1, 9);
      o = randInt(rng, 0, 9);
    } else {
      // carry guaranteed: digit sum ≥ 10
      t = randInt(rng, 2, 9);
      o = randInt(rng, Math.max(0, 10 - t), 9);
    }
    const n = t * 10 + o;
    const mid = t + o;
    const steps: string[] = [`Pull ${n} apart: ${t} _ ${o}.`, `Middle: ${t} + ${o} = ${mid}.`];
    if (mid >= 10) {
      steps.push(`${mid} spills over — carry the 1: front becomes ${t} + 1 = ${t + 1}, middle keeps ${mid - 10}.`);
    }
    steps.push(`${n} × 11 = ${n * 11}`);
    return {
      techniqueId: "times-11",
      difficulty: d,
      prompt: `${n} × 11 = ?`,
      answer: n * 11,
      steps,
      data: { n },
    };
  },
};

const squares5: Technique = {
  id: "squares-5",
  track: 3,
  name: "Squares ending in 5",
  emoji: "⭐",
  blurb: "35 × 35 in two seconds — really.",
  lessonIntro: "Any number ending in 5, times itself, follows one magic rule (the sages called it Ekadhikena — 'by one more').",
  lessonSteps: [
    "Let's square 35 — that's 35 × 35.",
    "Look at the front digit: 3.",
    "Multiply it by its next-door neighbour, one more: 3 × 4 = 12.",
    "Now stick 25 on the end: 12 → 1225.",
    "35 × 35 = 1225. Try saying it faster than a calculator!",
  ],
  generate(difficulty, rng) {
    const d = clampDifficulty(difficulty);
    const t = d === 1 ? randInt(rng, 1, 5) : d === 2 ? randInt(rng, 4, 9) : randInt(rng, 10, 12);
    const n = t * 10 + 5;
    const front = t * (t + 1);
    return {
      techniqueId: "squares-5",
      difficulty: d,
      prompt: `${n} × ${n} = ?`,
      answer: n * n,
      steps: [
        `${n} ends in 5 — magic rule time.`,
        `Front part ${t} × its next friend ${t + 1} = ${front}.`,
        `Stick 25 on the end: ${front} → ${n * n}.`,
      ],
      data: { t },
    };
  },
};

const doublingChains: Technique = {
  id: "doubling-chains",
  track: 3,
  name: "Doubling chains",
  emoji: "⛓️",
  blurb: "×4 is double-double. ×8 is double-double-double.",
  lessonIntro: "You already know how to double. So you already know ×4 and ×8 — they're just doubling more than once.",
  lessonSteps: [
    "Let's do 17 × 4.",
    "×4 means: double, then double again.",
    "Double 17 = 34.",
    "Double 34 = 68.",
    "17 × 4 = 68 — a chain of easy moves.",
  ],
  generate(difficulty, rng) {
    const d = clampDifficulty(difficulty);
    const times = d === 1 ? 2 : d === 2 ? (rng() < 0.5 ? 2 : 3) : 3;
    const factor = 2 ** times; // 4 or 8
    const n =
      times === 2
        ? d === 1
          ? randInt(rng, 6, 25)
          : randInt(rng, 26, 60)
        : d === 2
          ? randInt(rng, 6, 15)
          : randInt(rng, 16, 45);
    const steps: string[] = [`×${factor} means: ${times === 2 ? "double, double" : "double, double, double"}!`];
    let v = n;
    for (let i = 0; i < times; i++) {
      steps.push(`Double ${v} = ${v * 2}.`);
      v *= 2;
    }
    steps.push(`${n} × ${factor} = ${v}`);
    return {
      techniqueId: "doubling-chains",
      difficulty: d,
      prompt: `${n} × ${factor} = ?`,
      answer: n * factor,
      steps,
      data: { n, times },
    };
  },
};

const nearBase: Technique = {
  id: "near-base",
  track: 3,
  name: "Near-100 multiplication",
  emoji: "🏔️",
  blurb: "98 × 97 without writing anything down.",
  lessonIntro: "When both numbers camp near 100, Nikhilam multiplication turns a monster sum into two tiny ones.",
  lessonSteps: [
    "Let's do 98 × 97 — sounds scary, isn't.",
    "Both are near 100: 98 is 2 below, 97 is 3 below.",
    "Cross take-away: 98 − 3 = 95. (Try 97 − 2 — same answer. Always!)",
    "Multiply just the little gaps: 2 × 3 = 6.",
    "Glue: 95 and 06 → 9506.",
    "98 × 97 = 9506. Two tiny sums, one giant answer.",
  ],
  generate(difficulty, rng) {
    const d = clampDifficulty(difficulty);
    const lo = d === 1 ? 94 : d === 2 ? 89 : 85;
    const a = randInt(rng, lo, 99);
    const b = randInt(rng, lo, 99);
    const da = 100 - a;
    const db = 100 - b;
    const left = a - db;
    const prod = da * db;
    const ans = a * b;
    const glue =
      prod < 100
        ? `Glue: ${left} and ${pad2(prod)} → ${ans}.`
        : `${prod} spills past two digits: ${left}00 + ${prod} = ${ans}.`;
    return {
      techniqueId: "near-base",
      difficulty: d,
      prompt: `${a} × ${b} = ?`,
      answer: ans,
      steps: [
        `Both near 100: ${a} is ${da} below, ${b} is ${db} below.`,
        `Cross take-away: ${a} − ${db} = ${left}.`,
        `Multiply the gaps: ${da} × ${db} = ${prod}.`,
        glue,
      ],
      data: { a, b },
    };
  },
};

/* ------------------------------------------------------------------ *
 * Catalogue
 * ------------------------------------------------------------------ */

export const TECHNIQUES: Technique[] = [
  complements,
  doubleHalve,
  estimate,
  leftToRight,
  compensation,
  nikhilamSub,
  tablesPatterns,
  times11,
  squares5,
  doublingChains,
  nearBase,
];

export function techniqueById(id: TechniqueId): Technique {
  const t = TECHNIQUES.find((x) => x.id === id);
  if (!t) throw new Error(`unknown technique: ${id}`);
  return t;
}

export function techniquesInTrack(track: 1 | 2 | 3): Technique[] {
  return TECHNIQUES.filter((t) => t.track === track);
}

/* ------------------------------------------------------------------ *
 * Adaptive difficulty — hold success in the 70–85% flow band (PRD 4.3)
 * ------------------------------------------------------------------ */

export interface AdaptiveState {
  difficulty: number;
  /** Rolling window of recent outcomes, 1 = correct. */
  recent: number[];
}

export const FLOW_LOW = 0.7;
export const FLOW_HIGH = 0.85;
const WINDOW = 8;
const MIN_SAMPLES = 6;

export function freshAdaptive(): AdaptiveState {
  return { difficulty: 1, recent: [] };
}

/** Deterministic step rule: enough evidence + outside the flow band → move one notch. */
export function updateAdaptive(state: AdaptiveState, correct: boolean): AdaptiveState {
  const recent = [...state.recent, correct ? 1 : 0].slice(-WINDOW);
  if (recent.length >= MIN_SAMPLES) {
    const acc = recent.reduce((s, x) => s + x, 0) / recent.length;
    if (acc > FLOW_HIGH && state.difficulty < MAX_DIFFICULTY) {
      return { difficulty: state.difficulty + 1, recent: [] };
    }
    if (acc < FLOW_LOW && state.difficulty > 1) {
      return { difficulty: state.difficulty - 1, recent: [] };
    }
  }
  return { difficulty: state.difficulty, recent };
}
