import { mulberry32, pickOne, randInt, shuffle, type Rng } from "./random.js";
import type { Hint } from "./hints.js";

/**
 * Number sequences — deterministic generator with a rule engine.
 * The answer is always computed from the rule (never guessed), the four
 * options always contain the answer exactly once, and "show me the
 * reasoning" replays the rule step by step from the rule itself.
 */

export type SequenceRule =
  | { kind: "arithmetic"; start: number; step: number }
  | { kind: "geometric"; start: number; ratio: number }
  | { kind: "alternating"; start: number; stepA: number; stepB: number }
  | { kind: "squares"; startN: number }
  | { kind: "fibonacci"; a: number; b: number };

export interface SequencePuzzle {
  terms: number[]; // shown terms
  answer: number; // the next term
  options: number[]; // 4 options, answer included exactly once
  rule: SequenceRule;
  ruleText: string; // one-line description of the rule
  reasoning: string[]; // deterministic step-by-step replay
  level: number;
}

/** Compute term i (0-based) straight from the rule — the single source of truth. */
export function termAt(rule: SequenceRule, i: number): number {
  switch (rule.kind) {
    case "arithmetic":
      return rule.start + rule.step * i;
    case "geometric":
      return rule.start * Math.pow(rule.ratio, i);
    case "alternating": {
      let t = rule.start;
      for (let k = 0; k < i; k++) t += k % 2 === 0 ? rule.stepA : rule.stepB;
      return t;
    }
    case "squares":
      return (rule.startN + i) * (rule.startN + i);
    case "fibonacci": {
      let x = rule.a;
      let y = rule.b;
      if (i === 0) return x;
      if (i === 1) return y;
      for (let k = 2; k <= i; k++) {
        const z = x + y;
        x = y;
        y = z;
      }
      return y;
    }
  }
}

function buildTerms(rule: SequenceRule, count: number): number[] {
  return Array.from({ length: count }, (_, i) => termAt(rule, i));
}

function ruleTextFor(rule: SequenceRule): string {
  switch (rule.kind) {
    case "arithmetic":
      return rule.step >= 0
        ? `Each number grows by ${rule.step}.`
        : `Each number shrinks by ${-rule.step}.`;
    case "geometric":
      return `Each number is the one before it times ${rule.ratio}.`;
    case "alternating":
      return `The jumps take turns: +${rule.stepA}, then +${rule.stepB}, then +${rule.stepA} again.`;
    case "squares":
      return `They're the square numbers — each one is a number times itself.`;
    case "fibonacci":
      return `Add the two numbers before to get the next one.`;
  }
}

function reasoningFor(rule: SequenceRule, terms: number[], answer: number): string[] {
  const lines: string[] = [];
  const last = terms[terms.length - 1];
  switch (rule.kind) {
    case "arithmetic": {
      const s = rule.step;
      for (let i = 0; i + 1 < terms.length; i++) {
        lines.push(`${terms[i]} → ${terms[i + 1]}: that's ${s >= 0 ? "+" : "−"}${Math.abs(s)}.`);
      }
      lines.push(`The same jump every time — so the rule is ${s >= 0 ? "add" : "take away"} ${Math.abs(s)}.`);
      lines.push(`${last} ${s >= 0 ? "+" : "−"} ${Math.abs(s)} = ${answer}. That's the next number!`);
      break;
    }
    case "geometric": {
      for (let i = 0; i + 1 < terms.length; i++) {
        lines.push(`${terms[i]} × ${rule.ratio} = ${terms[i + 1]}.`);
      }
      lines.push(`Every number is ×${rule.ratio} the one before.`);
      lines.push(`${last} × ${rule.ratio} = ${answer}. That's the next number!`);
      break;
    }
    case "alternating": {
      for (let i = 0; i + 1 < terms.length; i++) {
        const jump = terms[i + 1] - terms[i];
        lines.push(`${terms[i]} → ${terms[i + 1]}: +${jump}.`);
      }
      lines.push(`The jumps take turns: +${rule.stepA}, +${rule.stepB}, +${rule.stepA}…`);
      const nextJump = answer - last;
      lines.push(`It's +${nextJump}'s turn: ${last} + ${nextJump} = ${answer}.`);
      break;
    }
    case "squares": {
      terms.forEach((t, i) => {
        const n = rule.startN + i;
        lines.push(`${n} × ${n} = ${t}.`);
      });
      const m = rule.startN + terms.length;
      lines.push(`So the next one is ${m} × ${m} = ${answer}.`);
      break;
    }
    case "fibonacci": {
      for (let i = 2; i < terms.length; i++) {
        lines.push(`${terms[i - 2]} + ${terms[i - 1]} = ${terms[i]}.`);
      }
      lines.push(`Each number is the two before it added together.`);
      lines.push(`${terms[terms.length - 2]} + ${last} = ${answer}. That's the next number!`);
      break;
    }
  }
  return lines;
}

/* ------------------------------------------------------------------ *
 * Options
 * ------------------------------------------------------------------ */

function makeOptions(rng: Rng, answer: number, terms: number[]): number[] {
  const last = terms[terms.length - 1];
  const diff = answer - last;
  const pool = new Set<number>();
  const add = (n: number) => {
    if (Number.isInteger(n) && n > 0 && n !== answer && !terms.includes(n)) pool.add(n);
  };
  add(answer + diff);
  add(answer - diff);
  add(answer + 1);
  add(answer - 1);
  add(answer + 2);
  add(answer - 2);
  add(last + 1);
  add(answer + 10);
  const distractors = shuffle(rng, [...pool]).slice(0, 3);
  let bump = 3;
  while (distractors.length < 3) {
    const filler = answer + bump++;
    if (!distractors.includes(filler) && filler !== answer) distractors.push(filler);
  }
  return shuffle(rng, [answer, ...distractors]);
}

/* ------------------------------------------------------------------ *
 * Generator with per-level rule ladder
 * ------------------------------------------------------------------ */

export const SEQUENCE_MAX_LEVEL = 5;

function ruleForLevel(rng: Rng, level: number): { rule: SequenceRule; shown: number } {
  switch (Math.max(1, Math.min(SEQUENCE_MAX_LEVEL, level))) {
    case 1:
      return { rule: { kind: "arithmetic", start: randInt(rng, 1, 10), step: randInt(rng, 2, 5) }, shown: 4 };
    case 2: {
      const descending = rng() < 0.4;
      if (descending) {
        const step = -randInt(rng, 3, 6);
        const start = randInt(rng, 45, 60);
        return { rule: { kind: "arithmetic", start, step }, shown: 5 };
      }
      return { rule: { kind: "arithmetic", start: randInt(rng, 3, 20), step: randInt(rng, 4, 9) }, shown: 5 };
    }
    case 3: {
      const a = randInt(rng, 2, 5);
      let b = randInt(rng, 2, 6);
      if (b === a) b = a + 1;
      return { rule: { kind: "alternating", start: randInt(rng, 1, 10), stepA: a, stepB: b }, shown: 5 };
    }
    case 4: {
      if (rng() < 0.5) {
        return { rule: { kind: "geometric", start: randInt(rng, 1, 4), ratio: pickOne(rng, [2, 3]) }, shown: 4 };
      }
      return { rule: { kind: "squares", startN: randInt(rng, 1, 3) }, shown: 4 };
    }
    default: {
      const a = randInt(rng, 1, 4);
      return { rule: { kind: "fibonacci", a, b: a + randInt(rng, 0, 3) }, shown: 5 };
    }
  }
}

export function generateSequence(seed: number, level: number): SequencePuzzle {
  const rng = mulberry32(seed);
  // Retry a few times so hint texts (levels 1–2) can never contain the answer
  // as a standalone number — the ladder must not leak the final answer.
  for (let attempt = 0; attempt < 25; attempt++) {
    const { rule, shown } = ruleForLevel(rng, level);
    const terms = buildTerms(rule, shown);
    const answer = termAt(rule, shown);
    if (answer <= 0 || answer > 999) continue;
    const puzzle: SequencePuzzle = {
      terms,
      answer,
      options: makeOptions(rng, answer, terms),
      rule,
      ruleText: ruleTextFor(rule),
      reasoning: reasoningFor(rule, terms, answer),
      level,
    };
    const word = new RegExp(`\\b${answer}\\b`);
    if (!word.test(sequenceHint(puzzle, 1).text) && !word.test(sequenceHint(puzzle, 2).text)) {
      return puzzle;
    }
  }
  // Deterministic safe fallback (cannot leak: hints mention only the step).
  const rule: SequenceRule = { kind: "arithmetic", start: 2, step: 3 };
  const terms = buildTerms(rule, 4);
  const answer = termAt(rule, 4);
  return {
    terms,
    answer,
    options: makeOptions(mulberry32(seed + 1), answer, terms),
    rule,
    ruleText: ruleTextFor(rule),
    reasoning: reasoningFor(rule, terms, answer),
    level,
  };
}

/* ------------------------------------------------------------------ *
 * Hint ladder
 * ------------------------------------------------------------------ */

export function sequenceHint(p: SequencePuzzle, level: number): Hint {
  const lvl = Math.max(1, Math.min(3, level));
  if (lvl === 1) {
    const opener =
      p.rule.kind === "squares"
        ? "Try multiplying small numbers by themselves — do any of the answers look familiar?"
        : p.rule.kind === "fibonacci"
          ? "Look at three numbers in a row. How could the first two make the third?"
          : `Compare each number with the one before it. What happens from ${p.terms[0]} to ${p.terms[1]}?`;
    return { level: 1, givesAnswer: false, text: opener };
  }
  if (lvl === 2) {
    return { level: 2, givesAnswer: false, text: `${p.ruleText} Check that it works for every jump!` };
  }
  // Level 3: the single next step — the final line of the reasoning replay.
  return { level: 3, givesAnswer: true, text: p.reasoning[p.reasoning.length - 1] };
}
