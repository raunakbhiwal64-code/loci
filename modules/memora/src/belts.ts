import type { ModuleStorageApi } from "@loci/module-sdk";

/**
 * The belt curriculum (PRD 4.1): five techniques, each unlocked by
 * demonstrated recall on the one before. Progress is per-profile via
 * ctx.storage — completions plus the best recall score (0..1).
 */

export type BeltId = "linking" | "palace" | "pegs" | "faces" | "numbers";

export interface Belt {
  id: BeltId;
  order: number;
  name: string;
  emoji: string;
  /** Belt colour, martial-arts style. */
  color: string;
  blurb: string;
}

export const BELTS: Belt[] = [
  { id: "linking", order: 0, name: "Linking stories", emoji: "🔗", color: "#e8e6df", blurb: "Chain things into one silly story." },
  { id: "palace", order: 1, name: "Memory palace", emoji: "🏰", color: "#f2c94c", blurb: "Hide things around a place you know." },
  { id: "pegs", order: 2, name: "Peg systems", emoji: "🕯️", color: "#6fcf97", blurb: "Numbers become shapes that hold things." },
  { id: "faces", order: 3, name: "Names & faces", emoji: "🎉", color: "#f2994a", blurb: "Link names to what you can see." },
  { id: "numbers", order: 4, name: "Number systems", emoji: "🥷", color: "#4f4a44", blurb: "Turn digits into pictures." },
];

export function beltFor(id: BeltId): Belt {
  return BELTS.find((b) => b.id === id) ?? BELTS[0];
}

/** Recall score needed to count as "demonstrated" and unlock the next belt. */
export const PASS_MARK = 0.6;

export interface BeltProgress {
  completions: number;
  /** Best recall accuracy so far, 0..1. */
  best: number;
}

export type BeltProgressMap = Partial<Record<BeltId, BeltProgress>>;

const KEY = "belt-progress";

export function loadBeltProgress(storage: ModuleStorageApi): BeltProgressMap {
  return storage.get<BeltProgressMap>(KEY) ?? {};
}

export function recordBeltResult(storage: ModuleStorageApi, belt: BeltId, correct: number, total: number): BeltProgressMap {
  const map = loadBeltProgress(storage);
  const prev = map[belt] ?? { completions: 0, best: 0 };
  const score = total > 0 ? correct / total : 0;
  const next: BeltProgressMap = {
    ...map,
    [belt]: { completions: prev.completions + 1, best: Math.max(prev.best, score) },
  };
  storage.set(KEY, next);
  return next;
}

/** A belt is earned once the child has demonstrated recall at the pass mark. */
export function isBeltEarned(progress: BeltProgressMap, belt: BeltId): boolean {
  return (progress[belt]?.best ?? 0) >= PASS_MARK;
}

/** The first belt is always open; each later belt opens when the previous is earned. */
export function isBeltUnlocked(progress: BeltProgressMap, belt: BeltId): boolean {
  const idx = BELTS.findIndex((b) => b.id === belt);
  if (idx <= 0) return true;
  return isBeltEarned(progress, BELTS[idx - 1].id);
}
