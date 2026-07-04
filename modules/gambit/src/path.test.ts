/**
 * The Path gate logic (spec §2): a level clears only at ≥80% first-try over its
 * drill set AND (from L2) an unprompted blunder-check; locked levels stay locked;
 * unlocking is monotonic; SRS theme scheduling uses fresh-position payload refs.
 */
import { describe, it, expect } from "vitest";
import { makeTestCtx } from "./testCtx.js";
import { recordBlunderCheckUse } from "./guided/blunderCheck.js";
import {
  PATH_LEVELS,
  MASTERY_THRESHOLD,
  levelByIndex,
  drillPuzzlesForLevel,
  isLevelUnlocked,
  isGateCleared,
  masteryRatio,
  recordDrillAttempt,
  recordBossBeaten,
  scheduleLevelThemes,
  themeSrsRef,
  readPathState,
} from "./path.js";

/** Solve `count` distinct drill puzzles of a level first-try. */
function solveFirstTry(ctx: ReturnType<typeof makeTestCtx>, levelIndex: number, count: number) {
  const level = levelByIndex(levelIndex)!;
  const puzzles = drillPuzzlesForLevel(level);
  for (let i = 0; i < count && i < puzzles.length; i++) {
    recordDrillAttempt(ctx, level.id, puzzles[i].id, true);
  }
}

describe("The Path", () => {
  it("has nine levels L0–L8 in order", () => {
    expect(PATH_LEVELS.length).toBe(9);
    PATH_LEVELS.forEach((l, i) => expect(l.index).toBe(i));
  });

  it("every level has a non-empty drill set", () => {
    for (const l of PATH_LEVELS) {
      expect(drillPuzzlesForLevel(l).length, `${l.id} has drills`).toBeGreaterThan(0);
    }
  });

  it("only L0 is unlocked at the start; the rest are locked", () => {
    const ctx = makeTestCtx();
    expect(isLevelUnlocked(ctx, 0)).toBe(true);
    for (let i = 1; i < PATH_LEVELS.length; i++) {
      expect(isLevelUnlocked(ctx, i), `L${i} locked at start`).toBe(false);
    }
  });

  it("clearing L0 (≥80% first-try) unlocks L1", () => {
    const ctx = makeTestCtx();
    const l0 = levelByIndex(0)!;
    const total = drillPuzzlesForLevel(l0).length;
    const need = Math.ceil(total * MASTERY_THRESHOLD);
    // Solve just below threshold → still locked.
    solveFirstTry(ctx, 0, need - 1);
    expect(masteryRatio(ctx, l0)).toBeLessThan(MASTERY_THRESHOLD);
    expect(isLevelUnlocked(ctx, 1)).toBe(false);
    // Solve enough → clears, unlocks L1. (L0 has no blunder-check requirement.)
    solveFirstTry(ctx, 0, need);
    expect(masteryRatio(ctx, l0)).toBeGreaterThanOrEqual(MASTERY_THRESHOLD);
    expect(isGateCleared(ctx, l0)).toBe(true);
    expect(isLevelUnlocked(ctx, 1)).toBe(true);
  });

  it("wrong first tries do not count toward mastery", () => {
    const ctx = makeTestCtx();
    const l0 = levelByIndex(0)!;
    const puzzles = drillPuzzlesForLevel(l0);
    // Attempt all, but never first-try → ratio stays 0.
    for (const p of puzzles) recordDrillAttempt(ctx, l0.id, p.id, false);
    expect(masteryRatio(ctx, l0)).toBe(0);
    expect(isLevelUnlocked(ctx, 1)).toBe(false);
  });

  it("from L2, the gate also needs an unprompted blunder-check", () => {
    const ctx = makeTestCtx();
    // Unlock through to L2 by clearing L0 and L1 (neither needs blunder-check).
    solveFirstTry(ctx, 0, drillPuzzlesForLevel(levelByIndex(0)!).length);
    solveFirstTry(ctx, 1, drillPuzzlesForLevel(levelByIndex(1)!).length);
    expect(isLevelUnlocked(ctx, 2)).toBe(true);

    const l2 = levelByIndex(2)!;
    // Solve the whole L2 set first-try, but WITHOUT any blunder-check use.
    solveFirstTry(ctx, 2, drillPuzzlesForLevel(l2).length);
    expect(masteryRatio(ctx, l2)).toBeGreaterThanOrEqual(MASTERY_THRESHOLD);
    expect(isGateCleared(ctx, l2)).toBe(false); // blunder-check still missing
    expect(isLevelUnlocked(ctx, 3)).toBe(false);

    // Now use the blunder-check → gate clears, L3 unlocks.
    recordBlunderCheckUse(ctx);
    expect(isGateCleared(ctx, l2)).toBe(true);
    // Re-record an attempt to trigger the unlock check.
    const anyPuzzle = drillPuzzlesForLevel(l2)[0];
    recordDrillAttempt(ctx, l2.id, anyPuzzle.id, true);
    expect(isLevelUnlocked(ctx, 3)).toBe(true);
  });

  it("unlocking is monotonic — a later miss never re-locks a level", () => {
    const ctx = makeTestCtx();
    solveFirstTry(ctx, 0, drillPuzzlesForLevel(levelByIndex(0)!).length);
    expect(isLevelUnlocked(ctx, 1)).toBe(true);
    // A failed attempt afterwards must not drop the unlocked pointer.
    recordDrillAttempt(ctx, "l0", drillPuzzlesForLevel(levelByIndex(0)!)[0].id, false);
    expect(isLevelUnlocked(ctx, 1)).toBe(true);
    expect(readPathState(ctx).unlocked).toBeGreaterThanOrEqual(1);
  });

  it("boss-beaten is recorded", () => {
    const ctx = makeTestCtx();
    recordBossBeaten(ctx, "l0");
    expect(readPathState(ctx).levels["l0"].bossBeaten).toBe(true);
  });

  it("scheduling level themes uses theme-keyed SRS refs (fresh positions)", () => {
    const ctx = makeTestCtx();
    const l3 = levelByIndex(3)!;
    scheduleLevelThemes(ctx, l3);
    for (const theme of l3.drillThemes) {
      const ref = themeSrsRef(theme);
      expect(ref).toBe(`gambit:tactic:${theme}`);
      expect([...ctx.srsItems.values()].some((i) => i.payloadRef === ref)).toBe(true);
    }
  });
});
