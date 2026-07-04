/**
 * Adaptivity — the weakness profile (spec §4, §8 PlayerChessProfile).
 *
 * Every mistake the deterministic tutor diagnoses (tutor.ts TutorLabel) is
 * logged, by taxonomy CATEGORY, to a local, per-profile weakness profile in
 * ctx.storage. Recent errors weigh more than old ones: each log decays existing
 * weights by a half-life before adding the new hit, so a category the child has
 * stopped getting wrong quietly fades. Puzzle/Review selection then biases toward
 * the child's heaviest (weakest) categories.
 *
 * Local-first & PII-free: only the child's own in-Loci play feeds this; nothing
 * is ever sent anywhere. Pure of React so it is trivially unit-testable.
 */
import type { ModuleContext } from "@loci/module-sdk";
import type { TutorLabel } from "./tutor.js";
import { blunderCheckUses } from "./guided/blunderCheck.js";

/**
 * The mistake categories we track. These mirror the tutor's TutorLabel minus
 * "good" (a good move is not a weakness). Kept as a plain string map so it is
 * forward-compatible with new taxonomy labels.
 */
export type WeaknessCategory = Exclude<TutorLabel, "good">;

export const WEAKNESS_CATEGORIES: WeaknessCategory[] = [
  "hung-piece",
  "missed-capture",
  "missed-mate",
  "walked-into-fork",
  "ignored-threat",
  "bad-trade",
];

/** Stored shape: category -> { weight, at } where `at` is the last-update ms. */
interface WeaknessState {
  weights: Record<string, { weight: number; at: number }>;
}

const WEAKNESS_KEY = "weakness:profile";

/** Half-life of an error's weight, in days. After this long a hit counts half. */
export const HALF_LIFE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function readState(ctx: ModuleContext): WeaknessState {
  return ctx.storage.get<WeaknessState>(WEAKNESS_KEY) ?? { weights: {} };
}

/** Exponential decay factor for an elapsed time given the half-life. */
function decayFactor(elapsedMs: number): number {
  if (elapsedMs <= 0) return 1;
  return Math.pow(0.5, elapsedMs / (HALF_LIFE_DAYS * DAY_MS));
}

/**
 * Current decayed weight of one category as of `now` — pure read, does not
 * mutate storage. Older hits are worth exponentially less.
 */
export function categoryWeight(ctx: ModuleContext, category: WeaknessCategory, now = Date.now()): number {
  const entry = readState(ctx).weights[category];
  if (!entry) return 0;
  return entry.weight * decayFactor(now - entry.at);
}

/**
 * Log one diagnosed mistake. Decays the category's existing weight to `now`,
 * then adds 1. `severityBoost` lets blunders count a little more than slips.
 */
export function logMistake(
  ctx: ModuleContext,
  category: WeaknessCategory,
  now = Date.now(),
  severityBoost = 1,
): void {
  const state = readState(ctx);
  const prev = state.weights[category];
  const decayed = prev ? prev.weight * decayFactor(now - prev.at) : 0;
  state.weights[category] = { weight: decayed + severityBoost, at: now };
  ctx.storage.set(WEAKNESS_KEY, state);
}

/**
 * The full weakness map (category -> decayed weight) as of `now`. Categories the
 * child has never erred in are present with weight 0, so selection can always
 * enumerate the taxonomy.
 */
export function weaknessMap(ctx: ModuleContext, now = Date.now()): Record<WeaknessCategory, number> {
  const out = {} as Record<WeaknessCategory, number>;
  for (const c of WEAKNESS_CATEGORIES) out[c] = categoryWeight(ctx, c, now);
  return out;
}

/** The categories sorted heaviest-first (the child's weakest areas first). */
export function weakestCategories(ctx: ModuleContext, now = Date.now()): WeaknessCategory[] {
  const map = weaknessMap(ctx, now);
  return [...WEAKNESS_CATEGORIES].sort((a, b) => map[b] - map[a]);
}

/**
 * The single weakest category with a positive weight, or null if the child has
 * no logged mistakes yet. Used to name a "practise this" focus for Review.
 */
export function topWeakness(ctx: ModuleContext, now = Date.now()): WeaknessCategory | null {
  const sorted = weakestCategories(ctx, now);
  const first = sorted[0];
  return first && categoryWeight(ctx, first, now) > 0 ? first : null;
}

/* ------------------------------------------------------------------ *
 * The PlayerChessProfile (spec §8) — a small, derived, on-device view.
 * ------------------------------------------------------------------ */

export interface PlayerChessProfile {
  /** Kept deliberately simple: derived from puzzles solved + games, not Elo. */
  internalRating: number;
  /** category -> recent (decayed) error weight. */
  weakness: Record<WeaknessCategory, number>;
  /** How many times the child has run the blunder-check unprompted. */
  blunderCheckUsage: number;
}

const RATING_KEY = "profile:internalRating";
const BASE_RATING = 400;

/** The child's current internal rating (simple, derived, persisted). */
export function internalRating(ctx: ModuleContext): number {
  return ctx.storage.get<number>(RATING_KEY) ?? BASE_RATING;
}

/**
 * Nudge the internal rating after an attempt. Solved → small gain; missed →
 * small (smaller) dip, floored at the base so it never feels punishing. Kept
 * simple on purpose (spec: "keep simple/derived").
 */
export function adjustRating(ctx: ModuleContext, solved: boolean): number {
  const next = solved ? internalRating(ctx) + 12 : Math.max(BASE_RATING, internalRating(ctx) - 5);
  ctx.storage.set(RATING_KEY, next);
  return next;
}

/** Assemble the derived PlayerChessProfile for display/selection. */
export function playerChessProfile(ctx: ModuleContext, now = Date.now()): PlayerChessProfile {
  return {
    internalRating: internalRating(ctx),
    weakness: weaknessMap(ctx, now),
    blunderCheckUsage: blunderCheckUses(ctx),
  };
}

/* ------------------------------------------------------------------ *
 * Category ↔ puzzle-theme bridge (used by Puzzle Path / Review).
 * ------------------------------------------------------------------ */

import type { PuzzleType } from "./puzzles.js";

/**
 * Which puzzle types best drill a given weakness category. A child who keeps
 * hanging pieces or ignoring threats needs "counting"/capture practice; someone
 * who walks into forks needs fork puzzles; missed mates → mate puzzles.
 */
export function puzzleTypesForCategory(category: WeaknessCategory): PuzzleType[] {
  switch (category) {
    case "hung-piece":
    case "bad-trade":
    case "ignored-threat":
      return ["capture", "escape"];
    case "missed-capture":
      return ["capture"];
    case "missed-mate":
      return ["mate1", "mate2"];
    case "walked-into-fork":
      return ["fork", "pin", "skewer", "discovered"];
  }
}
