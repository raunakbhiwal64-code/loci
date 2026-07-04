/** Small pure helpers shared across Lexicon modes. */

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Random sample of up to n items (no repeats). */
export function sample<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/** Replace the first occurrence of `word` in `sentence` with a blank. */
export function blankWord(sentence: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return sentence.replace(new RegExp(escaped, "i"), "_____");
}

/** payloadRef helpers — SRS items are stored as "word:<word>". */
export function toPayloadRef(word: string): string {
  return `word:${word}`;
}
export function fromPayloadRef(ref: string): string | null {
  return ref.startsWith("word:") ? ref.slice(5) : null;
}
