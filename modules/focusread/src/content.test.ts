import { describe, expect, it } from "vitest";
import {
  ALL_LEVELS,
  LEVEL_BANDS,
  PASSAGES,
  passagesForLevel,
  splitSentences,
  wordCount,
} from "./passages.js";

/**
 * Content validation harness (PRD 4.7 acceptance criteria): every passage
 * carries a validated reading level and answerable questions — answers are
 * verified against the passage text by construction.
 */

describe("passage catalogue shape", () => {
  it("has unique ids", () => {
    const ids = PASSAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has three passages at every level, and only levels 1–4", () => {
    for (const level of ALL_LEVELS) {
      expect(passagesForLevel(level)).toHaveLength(3);
    }
    for (const p of PASSAGES) {
      expect(ALL_LEVELS).toContain(p.level);
    }
  });

  it("mixes fiction and non-fiction", () => {
    expect(PASSAGES.some((p) => p.kind === "fiction")).toBe(true);
    expect(PASSAGES.some((p) => p.kind === "nonfiction")).toBe(true);
  });
});

describe("questions", () => {
  it.each(PASSAGES.map((p) => [p.id, p] as const))(
    "%s has exactly 3 questions — one literal, one inferential, one detail — with valid correct indices",
    (_id, p) => {
      expect(p.questions).toHaveLength(3);
      const kinds = p.questions.map((q) => q.kind).sort();
      expect(kinds).toEqual(["detail", "inferential", "literal"]);
      for (const q of p.questions) {
        expect(q.options).toHaveLength(3);
        expect(new Set(q.options).size).toBe(3); // options are distinct
        expect(Number.isInteger(q.correct)).toBe(true);
        expect(q.correct).toBeGreaterThanOrEqual(0);
        expect(q.correct).toBeLessThan(q.options.length);
        expect(q.prompt.trim().length).toBeGreaterThan(0);
      }
    }
  );

  it.each(PASSAGES.map((p) => [p.id, p] as const))(
    "%s: the literal question's key phrase appears verbatim in the text",
    (_id, p) => {
      const literal = p.questions.find((q) => q.kind === "literal")!;
      expect(literal.evidence, "literal question must carry an evidence phrase").toBeTruthy();
      expect(p.text.toLowerCase()).toContain(literal.evidence!.toLowerCase());
    }
  );

  it.each(PASSAGES.map((p) => [p.id, p] as const))(
    "%s: the detail question's phrase appears in the text, inside a single tappable sentence",
    (_id, p) => {
      const detail = p.questions.find((q) => q.kind === "detail")!;
      expect(detail.findPhrase, "detail question must carry a findPhrase").toBeTruthy();
      const needle = detail.findPhrase!.toLowerCase();
      expect(p.text.toLowerCase()).toContain(needle);
      const sentences = splitSentences(p.text);
      const holders = sentences.filter((s) => s.toLowerCase().includes(needle));
      expect(holders.length, "phrase must live inside at least one whole sentence").toBeGreaterThanOrEqual(1);
    }
  );
});

describe("story order (fiction)", () => {
  const fiction = PASSAGES.filter((p) => p.kind === "fiction");

  it("every fiction passage carries story-order events", () => {
    for (const p of fiction) {
      expect(p.storyOrder, `${p.id} is fiction and needs storyOrder`).toBeTruthy();
    }
  });

  it.each(fiction.map((p) => [p.id, p] as const))(
    "%s has exactly 4 events and a correct order that is a permutation of 0..3",
    (_id, p) => {
      const so = p.storyOrder!;
      expect(so.events).toHaveLength(4);
      expect(new Set(so.events).size).toBe(4);
      expect([...so.correctOrder].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
    }
  );

  it("non-fiction passages do not carry story order", () => {
    for (const p of PASSAGES.filter((x) => x.kind === "nonfiction")) {
      expect(p.storyOrder).toBeUndefined();
    }
  });
});

describe("reading levels", () => {
  it.each(PASSAGES.map((p) => [p.id, p] as const))(
    "%s word count fits its level band",
    (_id, p) => {
      const band = LEVEL_BANDS[p.level];
      const words = wordCount(p.text);
      expect(words, `${p.id} has ${words} words; level ${p.level} wants ${band.min}–${band.max}`).toBeGreaterThanOrEqual(band.min);
      expect(words).toBeLessThanOrEqual(band.max);
    }
  );

  it("levels get longer on average as they rise", () => {
    const avg = (lvl: 1 | 2 | 3 | 4) => {
      const ps = passagesForLevel(lvl);
      return ps.reduce((s, p) => s + wordCount(p.text), 0) / ps.length;
    };
    expect(avg(1)).toBeLessThan(avg(2));
    expect(avg(2)).toBeLessThan(avg(3));
    expect(avg(3)).toBeLessThan(avg(4));
  });
});

describe("copy discipline (PRD 4.7 — reading practice, framed joyfully)", () => {
  it("no clinical or attention-disorder vocabulary anywhere in authored content", () => {
    const forbidden = /adhd|attention[- ]deficit|treatment|therap|diagnos|disorder|clinic|symptom/i;
    for (const p of PASSAGES) {
      const blob = [
        p.title,
        p.text,
        ...p.questions.flatMap((q) => [q.prompt, ...q.options]),
        ...(p.storyOrder?.events ?? []),
      ].join(" ");
      expect(blob).not.toMatch(forbidden);
    }
  });
});
