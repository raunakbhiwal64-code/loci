/**
 * Review + Puzzle-Path selection (spec §3, §4, §6). Pure, deterministic, and
 * unit-testable — no React, no ctx side effects here (callers read ctx and pass
 * the derived inputs in).
 *
 * Two ideas combine:
 *  1. DUE SRS themes — patterns whose review is due now (ctx.srs.due). We pull
 *     FRESH puzzles of that theme, never the same position twice.
 *  2. WEAKNESS bias — the child's weakest taxonomy categories map to puzzle
 *     types (weakness.puzzleTypesForCategory); selection is weighted toward them.
 */
import type { Puzzle, PuzzleType } from "../puzzles.js";
import { PUZZLES } from "../puzzles.js";
import type { WeaknessCategory } from "../weakness.js";
import { puzzleTypesForCategory } from "../weakness.js";

/** Parse a theme out of an SRS payloadRef like "gambit:tactic:fork". */
export function themeFromRef(ref: string): PuzzleType | null {
  const m = /^gambit:tactic:(.+)$/.exec(ref);
  if (!m) return null;
  const theme = m[1] as PuzzleType;
  return PUZZLE_TYPES.has(theme) ? theme : null;
}

const PUZZLE_TYPES = new Set<PuzzleType>([
  "capture",
  "mate1",
  "mate2",
  "escape",
  "fork",
  "pin",
  "skewer",
  "discovered",
]);

export interface SelectionInput {
  /** payloadRefs of SRS items due now for gambit (from ctx.srs.due("gambit")). */
  dueRefs: string[];
  /** The child's weakest categories, heaviest first (from weakestCategories). */
  weakest: WeaknessCategory[];
  /** Puzzle ids already solved/seen — deprioritised so reviews stay fresh. */
  seenIds?: Set<string>;
  /** How many puzzles to return. */
  count?: number;
}

/**
 * Choose a review set. Deterministic given the same inputs and puzzle library.
 * Order of preference within the pool:
 *   1. due-theme puzzles the child has NOT seen,
 *   2. weakness-theme puzzles the child has NOT seen,
 *   3. any due/weak-theme puzzle (fallback if all fresh ones are exhausted),
 *   4. anything, so a session is never empty.
 */
export function selectReviewPuzzles(input: SelectionInput): Puzzle[] {
  const { dueRefs, weakest, seenIds = new Set(), count = 6 } = input;

  const dueThemes = dedupe(dueRefs.map(themeFromRef).filter((t): t is PuzzleType => t !== null));
  const weakThemes = dedupe(weakest.flatMap(puzzleTypesForCategory));

  const inThemes = (p: Puzzle, themes: PuzzleType[]) => themes.includes(p.type);
  const fresh = (p: Puzzle) => !seenIds.has(p.id);

  const tiers: Puzzle[][] = [
    PUZZLES.filter((p) => inThemes(p, dueThemes) && fresh(p)),
    PUZZLES.filter((p) => inThemes(p, weakThemes) && fresh(p) && !inThemes(p, dueThemes)),
    PUZZLES.filter((p) => (inThemes(p, dueThemes) || inThemes(p, weakThemes)) && !fresh(p)),
    PUZZLES.filter(fresh),
    PUZZLES,
  ];

  const out: Puzzle[] = [];
  const chosen = new Set<string>();
  for (const tier of tiers) {
    for (const p of tier) {
      if (out.length >= count) break;
      if (chosen.has(p.id)) continue;
      chosen.add(p.id);
      out.push(p);
    }
    if (out.length >= count) break;
  }
  return out;
}

/** The distinct themes a review session will cover, for the header/summary. */
export function sessionThemes(input: SelectionInput): PuzzleType[] {
  return dedupe(selectReviewPuzzles(input).map((p) => p.type));
}

function dedupe<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}
