/**
 * Weakness profile (spec §4): more errors in a category raise its selection
 * weight, and weights decay over time so the profile tracks RECENT play.
 */
import { describe, it, expect } from "vitest";
import { makeTestCtx } from "./testCtx.js";
import {
  logMistake,
  categoryWeight,
  weakestCategories,
  topWeakness,
  weaknessMap,
  playerChessProfile,
  adjustRating,
  internalRating,
  HALF_LIFE_DAYS,
  puzzleTypesForCategory,
} from "./weakness.js";

const DAY = 24 * 60 * 60 * 1000;

describe("weakness profile", () => {
  it("starts empty", () => {
    const ctx = makeTestCtx();
    expect(categoryWeight(ctx, "hung-piece")).toBe(0);
    expect(topWeakness(ctx)).toBe(null);
  });

  it("more errors in a category raise its weight", () => {
    const now = 1_000_000_000_000;
    const ctx = makeTestCtx(now);
    logMistake(ctx, "hung-piece", now);
    const one = categoryWeight(ctx, "hung-piece", now);
    logMistake(ctx, "hung-piece", now);
    logMistake(ctx, "hung-piece", now);
    const three = categoryWeight(ctx, "hung-piece", now);
    expect(three).toBeGreaterThan(one);
  });

  it("weights decay over time (a half-life halves a hit)", () => {
    const now = 1_000_000_000_000;
    const ctx = makeTestCtx(now);
    logMistake(ctx, "walked-into-fork", now);
    const fresh = categoryWeight(ctx, "walked-into-fork", now);
    const later = categoryWeight(ctx, "walked-into-fork", now + HALF_LIFE_DAYS * DAY);
    expect(later).toBeCloseTo(fresh / 2, 5);
    // Much later → nearly gone.
    const muchLater = categoryWeight(ctx, "walked-into-fork", now + 10 * HALF_LIFE_DAYS * DAY);
    expect(muchLater).toBeLessThan(fresh / 100);
  });

  it("the weakest category is the one with the most recent errors", () => {
    const now = 1_000_000_000_000;
    const ctx = makeTestCtx(now);
    logMistake(ctx, "missed-mate", now);
    logMistake(ctx, "hung-piece", now);
    logMistake(ctx, "hung-piece", now);
    expect(topWeakness(ctx, now)).toBe("hung-piece");
    expect(weakestCategories(ctx, now)[0]).toBe("hung-piece");
  });

  it("a category that stops erring is overtaken by a fresher one", () => {
    const now = 1_000_000_000_000;
    const ctx = makeTestCtx(now);
    // Old, heavy errors in hung-piece...
    logMistake(ctx, "hung-piece", now);
    logMistake(ctx, "hung-piece", now);
    logMistake(ctx, "hung-piece", now);
    // ...then a fresh error a long time later in another category.
    const much = now + 5 * HALF_LIFE_DAYS * DAY;
    logMistake(ctx, "missed-capture", much);
    expect(topWeakness(ctx, much)).toBe("missed-capture");
  });

  it("weaknessMap enumerates every category", () => {
    const ctx = makeTestCtx();
    const map = weaknessMap(ctx);
    expect(Object.keys(map).length).toBe(6);
  });

  it("internal rating rises on solve, dips (floored) on miss", () => {
    const ctx = makeTestCtx();
    const base = internalRating(ctx);
    adjustRating(ctx, true);
    expect(internalRating(ctx)).toBeGreaterThan(base);
    const high = internalRating(ctx);
    adjustRating(ctx, false);
    expect(internalRating(ctx)).toBeLessThan(high);
    // Never drops below the base floor.
    for (let i = 0; i < 20; i++) adjustRating(ctx, false);
    expect(internalRating(ctx)).toBeGreaterThanOrEqual(base);
  });

  it("player profile bundles rating, weakness and blunder-check usage", () => {
    const now = 1_000_000_000_000;
    const ctx = makeTestCtx(now);
    logMistake(ctx, "bad-trade", now);
    const p = playerChessProfile(ctx, now);
    expect(p.internalRating).toBeGreaterThan(0);
    expect(p.weakness["bad-trade"]).toBeGreaterThan(0);
    expect(p.blunderCheckUsage).toBe(0);
  });

  it("maps every category to at least one drill puzzle type", () => {
    for (const c of [
      "hung-piece",
      "missed-capture",
      "missed-mate",
      "walked-into-fork",
      "ignored-threat",
      "bad-trade",
    ] as const) {
      expect(puzzleTypesForCategory(c).length).toBeGreaterThan(0);
    }
  });
});
