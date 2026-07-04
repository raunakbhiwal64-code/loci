/**
 * Poem-mode memory techniques — pure, deterministic, unit-testable. No model
 * calls, no storage, no child text leaves the device. Two classic methods:
 *
 *  - first-letter method: each line is reduced to its words' initial letters
 *    ("Twinkle twinkle little star" → "T t l s"); the child recites the line
 *    from the crutch, then the crutch is progressively removed word-by-word.
 *  - progressive line build-up: recite line 1, then lines 1–2, then 1–2–3…
 *    so the poem is rehearsed cumulatively from the top each round.
 */

/** Hard caps keep a pasted document from turning into a giant drill. */
export const MAX_POEM_LINES = 60;
export const MAX_LINE_LENGTH = 240;

/** Split raw text into trimmed, non-empty lines, capped for sanity. */
export function parsePoemLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, MAX_POEM_LINES)
    .map((l) => (l.length > MAX_LINE_LENGTH ? l.slice(0, MAX_LINE_LENGTH) : l));
}

/**
 * First-letter reduction of a single line: keep each word's first character
 * (a letter or digit), space-joined. Punctuation-only tokens are dropped.
 * "The quick, brown fox!" → "T q b f".
 */
export function firstLetters(line: string): string {
  const words = line.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) ?? [];
  return words.map((w) => w[0]).join(" ");
}

/** First-letter reduction across every line of a poem. */
export function firstLetterCrutch(lines: readonly string[]): string[] {
  return lines.map(firstLetters);
}

/**
 * Progressively remove the first-letter crutch for one line. `revealed` is how
 * many words at the FRONT are already fully hidden (memorised); those show a
 * blank, the rest keep their first-letter hint. At revealed >= word count the
 * whole line is blanks — no crutch left.
 *
 * step 0: "T q b f"   (full crutch)
 * step 1: "_ q b f"
 * step 2: "_ _ b f"   … and so on.
 */
export function fadeLine(line: string, revealed: number): string {
  const words = line.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) ?? [];
  const clamped = Math.max(0, Math.min(revealed, words.length));
  return words.map((w, i) => (i < clamped ? "_" : w[0])).join(" ");
}

/** Number of fade steps for a line: one per word plus the all-hidden finish. */
export function fadeSteps(line: string): number {
  const words = line.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) ?? [];
  return words.length + 1;
}

/**
 * Progressive line build-up sequence: round r (1-indexed) reveals the first r
 * lines. Returns the cumulative slices [ [l1], [l1,l2], [l1,l2,l3], … ].
 */
export function buildUpSequence(lines: readonly string[]): string[][] {
  const out: string[][] = [];
  for (let i = 1; i <= lines.length; i++) out.push(lines.slice(0, i));
  return out;
}

/** Total rounds in a build-up drill (one per line). */
export function buildUpRounds(lines: readonly string[]): number {
  return lines.length;
}
