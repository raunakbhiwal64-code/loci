/**
 * Review selection (spec §4, §6): returns due/weak-theme puzzles, prefers fresh
 * (unseen) positions, and is never empty.
 */
import { describe, it, expect } from "vitest";
import { selectReviewPuzzles, themeFromRef, sessionThemes } from "./selection.js";
import { PUZZLES } from "../puzzles.js";

describe("review selection", () => {
  it("parses theme refs", () => {
    expect(themeFromRef("gambit:tactic:fork")).toBe("fork");
    expect(themeFromRef("gambit:tactic:mate1")).toBe("mate1");
    expect(themeFromRef("gambit:pattern:hung-piece")).toBe(null);
    expect(themeFromRef("nonsense")).toBe(null);
  });

  it("returns puzzles of the due theme first", () => {
    const picks = selectReviewPuzzles({
      dueRefs: ["gambit:tactic:fork"],
      weakest: [],
      count: 3,
    });
    expect(picks.length).toBeGreaterThan(0);
    // The library has fork puzzles, so at least the first pick is a fork.
    expect(picks[0].type).toBe("fork");
  });

  it("falls back to weakness themes when nothing is due", () => {
    const picks = selectReviewPuzzles({
      dueRefs: [],
      weakest: ["missed-mate"], // → mate1 / mate2
      count: 4,
    });
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.every((p) => p.type === "mate1" || p.type === "mate2")).toBe(true);
  });

  it("prefers fresh puzzles the child hasn't seen", () => {
    const forks = PUZZLES.filter((p) => p.type === "fork");
    const seen = new Set([forks[0].id]);
    const picks = selectReviewPuzzles({
      dueRefs: ["gambit:tactic:fork"],
      weakest: [],
      seenIds: seen,
      count: 2,
    });
    // The seen fork should not appear before unseen forks.
    const ids = picks.map((p) => p.id);
    if (forks.length > 1) {
      expect(ids[0]).not.toBe(forks[0].id);
    }
  });

  it("is never empty even with no due items and no weakness", () => {
    const picks = selectReviewPuzzles({ dueRefs: [], weakest: [], count: 5 });
    expect(picks.length).toBe(5);
  });

  it("reports the themes a session will cover", () => {
    const themes = sessionThemes({
      dueRefs: ["gambit:tactic:pin"],
      weakest: [],
      count: 3,
    });
    expect(themes).toContain("pin");
  });
});
