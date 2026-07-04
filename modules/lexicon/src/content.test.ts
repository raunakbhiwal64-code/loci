import { describe, expect, it } from "vitest";
import { PACKS } from "./words.js";
import { ANALOGIES } from "./analogies.js";
import { ODD_ONE_OUT } from "./oddoneout.js";

describe("Lexicon word packs", () => {
  it("has no duplicate words across packs (PRD 4.6 acceptance criterion)", () => {
    const all = PACKS.flatMap((p) => p.words.map((w) => w.word.toLowerCase()));
    const unique = new Set(all);
    expect(unique.size).toBe(all.length);
  });

  it("carries a substantial starter collection per band", () => {
    for (const pack of PACKS) {
      expect(pack.words.length).toBeGreaterThanOrEqual(40);
    }
  });

  it("has every field non-empty on every entry", () => {
    for (const pack of PACKS) {
      for (const entry of pack.words) {
        expect(entry.word.trim(), `word in ${pack.band}`).not.toBe("");
        expect(entry.meaning.trim(), `meaning of ${entry.word}`).not.toBe("");
        expect(entry.emoji.trim(), `emoji of ${entry.word}`).not.toBe("");
        expect(entry.sentence.trim(), `sentence of ${entry.word}`).not.toBe("");
        expect(entry.useIt.trim(), `useIt of ${entry.word}`).not.toBe("");
        expect(entry.microStory, `microStory of ${entry.word}`).toHaveLength(2);
        expect(entry.microStory[0].trim(), `microStory[0] of ${entry.word}`).not.toBe("");
        expect(entry.microStory[1].trim(), `microStory[1] of ${entry.word}`).not.toBe("");
      }
    }
  });

  it("uses the word in its example sentence (the learn flow blanks it)", () => {
    for (const pack of PACKS) {
      for (const entry of pack.words) {
        expect(entry.sentence.toLowerCase(), `sentence of ${entry.word}`).toContain(entry.word.toLowerCase());
      }
    }
  });

  it("uses the word in context in its micro-story", () => {
    for (const pack of PACKS) {
      for (const entry of pack.words) {
        const story = entry.microStory.join(" ").toLowerCase();
        expect(story, `microStory of ${entry.word}`).toContain(entry.word.toLowerCase());
      }
    }
  });
});

describe("Lexicon analogies", () => {
  it("has a healthy authored set", () => {
    expect(ANALOGIES.length).toBeGreaterThanOrEqual(30);
  });

  it("includes the answer among the options exactly once", () => {
    for (const a of ANALOGIES) {
      const stem = `${a.a}:${a.b}::${a.c}`;
      expect(a.options, stem).toHaveLength(4);
      const hits = a.options.filter((o) => o === a.answer).length;
      expect(hits, stem).toBe(1);
    }
  });

  it("has non-empty terms, explanation, and a named relation", () => {
    for (const a of ANALOGIES) {
      for (const term of [a.a, a.b, a.c, a.answer, a.explain, a.relation]) {
        expect(term.trim()).not.toBe("");
      }
      for (const option of a.options) {
        expect(option.trim()).not.toBe("");
      }
    }
  });
});

describe("Lexicon odd-one-out", () => {
  it("has a healthy authored set", () => {
    expect(ODD_ONE_OUT.length).toBeGreaterThanOrEqual(20);
  });

  it("has a valid odd-word index and a valid correct-reason index on every item", () => {
    for (const item of ODD_ONE_OUT) {
      const label = item.words.join(", ");
      expect(item.words, label).toHaveLength(4);
      expect(item.odd, label).toBeGreaterThanOrEqual(0);
      expect(item.odd, label).toBeLessThan(item.words.length);
      expect(item.reasons, label).toHaveLength(3);
      expect(item.correctReason, label).toBeGreaterThanOrEqual(0);
      expect(item.correctReason, label).toBeLessThan(item.reasons.length);
    }
  });

  it("has non-empty words and reasons", () => {
    for (const item of ODD_ONE_OUT) {
      for (const word of item.words) expect(word.trim()).not.toBe("");
      for (const reason of item.reasons) expect(reason.trim()).not.toBe("");
    }
  });
});
