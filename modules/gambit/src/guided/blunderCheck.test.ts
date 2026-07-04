/**
 * The blunder-check scaffold must FADE for real and PERSIST: as guided games are
 * completed the overlay goes full → reminder → off, and the counts survive in
 * ctx.storage. This uses a tiny in-memory storage stub matching the SDK contract.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { ModuleContext, ModuleStorageApi } from "@loci/module-sdk";
import {
  scaffoldLevel,
  completeGuidedGame,
  guidedGamesPlayed,
  blunderCheckUses,
  recordBlunderCheckUse,
  gamesUntilNextFade,
  BLUNDER_CHECK,
} from "./blunderCheck.js";

function makeStorage(): ModuleStorageApi {
  const map = new Map<string, unknown>();
  return {
    get: <T = unknown>(k: string) => map.get(k) as T | undefined,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
    keys: () => [...map.keys()],
  };
}

/** Minimal ctx with real storage + no-op analytics (enough for these units). */
function makeCtx(storage: ModuleStorageApi): ModuleContext {
  return {
    storage,
    analytics: { emit: () => {} },
    // The rest are unused by blunderCheck.ts; cast keeps the test focused.
  } as unknown as ModuleContext;
}

describe("blunder-check scaffold fade", () => {
  let ctx: ModuleContext;
  beforeEach(() => {
    ctx = makeCtx(makeStorage());
  });

  it("has the four routine questions", () => {
    expect(BLUNDER_CHECK).toHaveLength(4);
    for (const q of BLUNDER_CHECK) expect(q.question.length).toBeGreaterThan(5);
  });

  it("starts at the full scaffold", () => {
    expect(scaffoldLevel(ctx)).toBe("full");
    expect(guidedGamesPlayed(ctx)).toBe(0);
  });

  it("fades full → reminder → off as guided games complete, and persists", () => {
    // 1st, 2nd, 3rd game complete → still full for games 1-2, reminder after 3.
    completeGuidedGame(ctx); // played = 1
    expect(scaffoldLevel(ctx)).toBe("full");
    completeGuidedGame(ctx); // played = 2
    expect(scaffoldLevel(ctx)).toBe("full");
    completeGuidedGame(ctx); // played = 3
    expect(scaffoldLevel(ctx)).toBe("reminder");

    completeGuidedGame(ctx); // 4
    completeGuidedGame(ctx); // 5
    expect(scaffoldLevel(ctx)).toBe("reminder");
    completeGuidedGame(ctx); // 6
    expect(scaffoldLevel(ctx)).toBe("off");

    // Persisted count is real.
    expect(guidedGamesPlayed(ctx)).toBe(6);
  });

  it("reports how many games until the next fade", () => {
    expect(gamesUntilNextFade(ctx)).toBe(3); // full → reminder at 3
    completeGuidedGame(ctx);
    completeGuidedGame(ctx);
    completeGuidedGame(ctx);
    expect(gamesUntilNextFade(ctx)).toBe(3); // reminder → off at 6 (6-3)
    completeGuidedGame(ctx);
    completeGuidedGame(ctx);
    completeGuidedGame(ctx);
    expect(gamesUntilNextFade(ctx)).toBe(0); // already off
  });

  it("tracks active checklist uses and persists them", () => {
    expect(blunderCheckUses(ctx)).toBe(0);
    recordBlunderCheckUse(ctx);
    recordBlunderCheckUse(ctx);
    expect(blunderCheckUses(ctx)).toBe(2);
  });

  it("fade state survives a fresh ctx over the same storage (real persistence)", () => {
    const storage = makeStorage();
    const ctxA = makeCtx(storage);
    completeGuidedGame(ctxA);
    completeGuidedGame(ctxA);
    completeGuidedGame(ctxA);
    // New ctx, same storage — like reopening the app.
    const ctxB = makeCtx(storage);
    expect(guidedGamesPlayed(ctxB)).toBe(3);
    expect(scaffoldLevel(ctxB)).toBe("reminder");
  });
});
