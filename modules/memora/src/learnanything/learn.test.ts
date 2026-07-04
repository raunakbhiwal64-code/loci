import { describe, expect, it } from "vitest";
import type { ModuleStorageApi } from "@loci/module-sdk";
import {
  buildUpRounds,
  buildUpSequence,
  fadeLine,
  fadeSteps,
  firstLetterCrutch,
  firstLetters,
  MAX_LINE_LENGTH,
  MAX_POEM_LINES,
  parsePoemLines,
} from "./poem.js";
import {
  deleteLearnSet,
  listOptions,
  loadLearnSets,
  markedItems,
  MAX_ITEMS,
  MAX_MARKED,
  parseListEntries,
  saveLearnSet,
  srsRef,
  toggleMark,
  toMarkables,
} from "./list.js";

/** Minimal in-memory ModuleStorageApi for round-trip tests. */
function memStorage(): ModuleStorageApi {
  const map = new Map<string, unknown>();
  return {
    get: <T = unknown>(k: string) => map.get(k) as T | undefined,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
    keys: () => [...map.keys()],
  };
}

describe("poem — first-letter method", () => {
  it("reduces a line to its words' initial letters", () => {
    expect(firstLetters("Twinkle twinkle little star")).toBe("T t l s");
  });

  it("ignores punctuation and keeps digits", () => {
    expect(firstLetters("The quick, brown fox!")).toBe("T q b f");
    expect(firstLetters("4 legs, 2 wings")).toBe("4 l 2 w");
  });

  it("reduces every line of a poem", () => {
    const lines = ["Roses are red", "Violets are blue"];
    expect(firstLetterCrutch(lines)).toEqual(["R a r", "V a b"]);
  });

  it("returns an empty crutch for a line with no words", () => {
    expect(firstLetters("--- !!!")).toBe("");
  });
});

describe("poem — progressive crutch fade", () => {
  const line = "Twinkle twinkle little star"; // 4 words

  it("step 0 shows the full first-letter crutch", () => {
    expect(fadeLine(line, 0)).toBe("T t l s");
  });

  it("hides words from the front as steps advance", () => {
    expect(fadeLine(line, 1)).toBe("_ t l s");
    expect(fadeLine(line, 2)).toBe("_ _ l s");
    expect(fadeLine(line, 3)).toBe("_ _ _ s");
  });

  it("fully hides the line at the last step and clamps beyond", () => {
    expect(fadeLine(line, 4)).toBe("_ _ _ _");
    expect(fadeLine(line, 99)).toBe("_ _ _ _");
  });

  it("reports one fade step per word plus the all-hidden finish", () => {
    expect(fadeSteps(line)).toBe(5);
    expect(fadeSteps("")).toBe(1);
  });
});

describe("poem — progressive line build-up", () => {
  const lines = ["one", "two", "three"];

  it("builds cumulatively from the top", () => {
    expect(buildUpSequence(lines)).toEqual([
      ["one"],
      ["one", "two"],
      ["one", "two", "three"],
    ]);
  });

  it("has one round per line", () => {
    expect(buildUpRounds(lines)).toBe(3);
    expect(buildUpRounds([])).toBe(0);
  });
});

describe("poem — line parsing + caps", () => {
  it("trims and drops blank lines", () => {
    expect(parsePoemLines("  a \n\n  b  \n")).toEqual(["a", "b"]);
  });

  it("caps the number of lines", () => {
    const many = Array.from({ length: MAX_POEM_LINES + 20 }, (_, i) => `line ${i}`).join("\n");
    expect(parsePoemLines(many)).toHaveLength(MAX_POEM_LINES);
  });

  it("caps an over-long single line", () => {
    const long = "x".repeat(MAX_LINE_LENGTH + 50);
    expect(parsePoemLines(long)[0].length).toBe(MAX_LINE_LENGTH);
  });
});

describe("list — parsing + marking round-trip", () => {
  it("splits on newlines and commas, trims, dedupes case-insensitively", () => {
    expect(parseListEntries("apple, Banana\napple\nCherry")).toEqual(["apple", "Banana", "Cherry"]);
  });

  it("caps the entry count", () => {
    const many = Array.from({ length: MAX_ITEMS + 30 }, (_, i) => `item${i}`).join("\n");
    expect(parseListEntries(many)).toHaveLength(MAX_ITEMS);
  });

  it("marking round-trips: toggle on, then off", () => {
    let m = toMarkables(["a", "b", "c"]);
    expect(markedItems(m)).toEqual([]);
    m = toggleMark(m, 0);
    m = toggleMark(m, 2);
    expect(markedItems(m)).toEqual(["a", "c"]);
    m = toggleMark(m, 0);
    expect(markedItems(m)).toEqual(["c"]);
  });

  it("caps the marked set at MAX_MARKED", () => {
    let m = toMarkables(Array.from({ length: MAX_MARKED + 10 }, (_, i) => `w${i}`));
    m = m.map((x) => ({ ...x, marked: true }));
    expect(markedItems(m)).toHaveLength(MAX_MARKED);
  });
});

describe("list — recall options", () => {
  const pool = ["Mercury", "Venus", "Earth", "Mars", "Jupiter"];

  it("always contains the correct answer", () => {
    expect(listOptions(pool, "Earth", 0)).toContain("Earth");
  });

  it("never duplicates the answer among distractors", () => {
    const opts = listOptions(pool, "Earth", 3);
    expect(opts.filter((o) => o === "Earth")).toHaveLength(1);
  });

  it("returns at most `count` options", () => {
    expect(listOptions(pool, "Earth", 1, 4).length).toBeLessThanOrEqual(4);
  });

  it("handles a tiny pool without crashing", () => {
    expect(listOptions(["solo"], "solo", 0)).toEqual(["solo"]);
  });
});

describe("list — per-profile store round-trip", () => {
  it("saves, loads and deletes a set unchanged in shape", () => {
    const storage = memStorage();
    const saved = saveLearnSet(storage, {
      title: "Planets",
      kind: "list",
      rawText: "Mercury\nVenus\nEarth",
      markedItems: ["Mercury", "Earth"],
    });
    const loaded = loadLearnSets(storage);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject({
      title: "Planets",
      kind: "list",
      markedItems: ["Mercury", "Earth"],
    });
    deleteLearnSet(storage, saved.id);
    expect(loadLearnSets(storage)).toEqual([]);
  });

  it("falls back to a friendly title and caps stored size", () => {
    const storage = memStorage();
    const saved = saveLearnSet(storage, {
      title: "   ",
      kind: "poem",
      rawText: "x".repeat(100000),
      markedItems: Array.from({ length: MAX_MARKED + 5 }, (_, i) => `m${i}`),
    });
    expect(saved.title).toBe("My text");
    expect(saved.markedItems).toHaveLength(MAX_MARKED);
    expect(saved.rawText.length).toBeLessThanOrEqual(20000);
  });

  it("builds a stable SRS payload ref", () => {
    expect(srsRef("set1", "Earth")).toBe("learn:set1:Earth");
  });
});
