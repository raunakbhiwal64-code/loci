/**
 * Small shared helpers: shuffling, quiz options, and the deterministic
 * fallbacks that keep every mode working with zero model calls — and that
 * handle ALL child-entered content (which never goes to ctx.ai).
 */

export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function sample<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/** The correct answer plus up to three distractors from the pool, shuffled. */
export function optionsFor(pool: readonly string[], correct: string, count = 4): string[] {
  const others = shuffle(pool.filter((x) => x !== correct)).slice(0, count - 1);
  return shuffle([correct, ...others]);
}

const CONNECTORS = [
  "bumped into",
  "tripped over",
  "juggled",
  "sat on",
  "danced with",
  "hid inside",
  "raced past",
  "gave a piggyback to",
  "sneezed at",
  "high-fived",
];

/**
 * Deterministic linking story: template chaining, item i linked to item i+1
 * by a connector picked from the item's own letters. Works offline, works for
 * child-entered lists, always silly.
 */
export function linkStoryFallback(items: readonly string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return `Picture a giant ${items[0]} waving at you. That's the whole list!`;
  const parts: string[] = [];
  for (let i = 0; i < items.length - 1; i++) {
    const verb = CONNECTORS[(hashString(items[i]) + i) % CONNECTORS.length];
    parts.push(i === 0 ? `The ${items[0]} ${verb} the ${items[1]}` : `which ${verb} the ${items[i + 1]}`);
  }
  return `${parts.join(", ")}. What a party!`;
}

const CRITTERS = ["a giggling dragon", "a giant purple octopus", "a robot penguin", "a sleepy tiger", "a bouncing kangaroo", "a very polite crocodile"];

/**
 * Deterministic mnemonic coach line — used instead of ctx.ai whenever the
 * item or place is child-entered (custom lists, photo-palace spots).
 */
export function localMnemonic(item: string, place: string): string {
  const critter = CRITTERS[Math.abs(hashString(item + place)) % CRITTERS.length];
  return `Picture ${critter} holding ${item} right at ${place}. Make it huge, silly and colourful!`;
}

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Kid-safe noun pool for Speed Recall flashes. */
export const WORD_POOL = [
  "apple", "drum", "kite", "lion", "rocket", "spoon", "umbrella", "zebra",
  "cloud", "brick", "torch", "mango", "balloon", "robot", "pencil", "ladder",
  "teacup", "tiger", "boat", "crown", "guitar", "penguin", "sandal", "whistle",
  "anchor", "biscuit", "camel", "dinosaur", "feather", "hammer", "island", "jacket",
];
