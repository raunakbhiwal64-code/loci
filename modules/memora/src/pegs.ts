/**
 * Number–shape peg system (belt 3) and the digit images Number Ninja reuses
 * (belt 5). Each number looks like its peg — that visual rhyme is what lets a
 * child jump straight to "item 3" without reciting the list.
 */

export interface Peg {
  n: number;
  word: string;
  emoji: string;
  /** Why the number looks like the peg — the teach line. */
  line: string;
}

export const PEGS: Peg[] = [
  { n: 1, word: "candle", emoji: "🕯️", line: "A 1 stands tall and straight, like a candle." },
  { n: 2, word: "swan", emoji: "🦢", line: "A 2 curves its neck, like a swan gliding by." },
  { n: 3, word: "heart", emoji: "❤️", line: "Tip a 3 on its side — it's the top of a heart." },
  { n: 4, word: "sail", emoji: "⛵", line: "A 4 is a little boat with a triangle sail." },
  { n: 5, word: "hook", emoji: "🪝", line: "A 5 curls round at the bottom, like a hook." },
  { n: 6, word: "elephant's trunk", emoji: "🐘", line: "A 6 curls down and around, like an elephant's trunk." },
  { n: 7, word: "cliff", emoji: "🪨", line: "A 7 drops straight down, like the edge of a cliff." },
  { n: 8, word: "snowman", emoji: "⛄", line: "An 8 is two snowballs stacked — a snowman!" },
  { n: 9, word: "balloon", emoji: "🎈", line: "A 9 is a balloon on a string." },
  { n: 10, word: "bat and ball", emoji: "🏏", line: "A 1 and a 0 — a bat and a ball!" },
];

export function pegFor(n: number): Peg {
  const peg = PEGS.find((p) => p.n === n);
  return peg ?? PEGS[0];
}

/**
 * Digit → image for Number Ninja. 1–9 reuse the pegs the child already knows;
 * 0 is an egg (it looks like one).
 */
export const DIGIT_PEGS: Record<string, { word: string; emoji: string }> = {
  "0": { word: "egg", emoji: "🥚" },
  "1": { word: "candle", emoji: "🕯️" },
  "2": { word: "swan", emoji: "🦢" },
  "3": { word: "heart", emoji: "❤️" },
  "4": { word: "sail", emoji: "⛵" },
  "5": { word: "hook", emoji: "🪝" },
  "6": { word: "elephant's trunk", emoji: "🐘" },
  "7": { word: "cliff", emoji: "🪨" },
  "8": { word: "snowman", emoji: "⛄" },
  "9": { word: "balloon", emoji: "🎈" },
};
