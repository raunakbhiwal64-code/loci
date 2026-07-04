import type { ModuleStorageApi } from "@loci/module-sdk";

/**
 * Learn Anything data + list-mode logic — pure and on-device only. The child's
 * raw text NEVER leaves the device; only a single marked item may be sent to
 * ctx.ai for an optional image suggestion (see LearnAnything.tsx). This module
 * owns parsing, tap-to-mark round-tripping, the per-profile store, and the
 * recall option builder for list mode.
 */

/** Sanity caps so a pasted document can't explode into an unbounded drill. */
export const MAX_ITEMS = 100;
export const MAX_MARKED = 60;
export const MAX_TEXT_LENGTH = 20000;

export type Technique = "first-letter" | "line-buildup" | "loci" | "linking" | "peg";
export type LearnKind = "poem" | "list";

/**
 * On-device Learn Anything set. Mirrors the PRD UserContentItem (Appendix E),
 * excluded from sync by construction.
 */
export interface LearnSet {
  id: string;
  title: string;
  kind: LearnKind;
  /** The child's own text — device-local, never uploaded. */
  rawText: string;
  /** The items the child tapped to memorise (list entries or poem lines). */
  markedItems: string[];
  createdAt: number;
}

/**
 * A markable token drawn from the raw text. `text` is what's drilled; `marked`
 * is the tap state. For list mode one token per line/entry; for poem mode one
 * token per line (the child marks the lines to learn).
 */
export interface Markable {
  index: number;
  text: string;
  marked: boolean;
}

/**
 * Parse pasted text into list entries: split on newlines and commas, trim,
 * drop empties, dedupe (case-insensitive, first spelling wins), cap.
 */
export function parseListEntries(text: string): string[] {
  const parts = text
    .split(/[\n\r,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(part);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

/** Build the initial markable set from entries (all unmarked). */
export function toMarkables(entries: readonly string[]): Markable[] {
  return entries.map((text, index) => ({ index, text, marked: false }));
}

/** Toggle the marked state of one token by index (pure — returns a new array). */
export function toggleMark(markables: readonly Markable[], index: number): Markable[] {
  return markables.map((m) => (m.index === index ? { ...m, marked: !m.marked } : m));
}

/** The marked tokens' text, in order, capped at MAX_MARKED. */
export function markedItems(markables: readonly Markable[]): string[] {
  return markables
    .filter((m) => m.marked)
    .map((m) => m.text)
    .slice(0, MAX_MARKED);
}

/** The correct answer plus up to `count-1` distractors, order rotated by salt. */
export function listOptions(pool: readonly string[], correct: string, salt: number, count = 4): string[] {
  const others = pool.filter((x) => x !== correct);
  const picks: string[] = [];
  for (let j = 0; j < others.length && picks.length < count - 1; j++) {
    picks.push(others[(j + salt) % others.length]);
  }
  const unique = [correct, ...picks.filter((p, i) => picks.indexOf(p) === i)];
  const rotate = unique.length > 0 ? salt % unique.length : 0;
  return [...unique.slice(rotate), ...unique.slice(0, rotate)];
}

/* ---------------- per-profile store (ctx.storage) ---------------- */

/** Storage key — set-aside from the other Memora stores. */
export const STORAGE_KEY = "learn-anything";

export function loadLearnSets(storage: ModuleStorageApi): LearnSet[] {
  return storage.get<LearnSet[]>(STORAGE_KEY) ?? [];
}

export function saveLearnSet(
  storage: ModuleStorageApi,
  input: { title: string; kind: LearnKind; rawText: string; markedItems: string[] }
): LearnSet {
  const set: LearnSet = {
    id: `la${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    title: input.title.trim() || "My text",
    kind: input.kind,
    rawText: input.rawText.slice(0, MAX_TEXT_LENGTH),
    markedItems: input.markedItems.slice(0, MAX_MARKED),
    createdAt: Date.now(),
  };
  storage.set(STORAGE_KEY, [...loadLearnSets(storage), set]);
  return set;
}

export function deleteLearnSet(storage: ModuleStorageApi, id: string): void {
  storage.set(
    STORAGE_KEY,
    loadLearnSets(storage).filter((s) => s.id !== id)
  );
}

/** SRS payload ref for one marked item within a set: "learn:<setId>:<item>". */
export function srsRef(setId: string, item: string): string {
  return `learn:${setId}:${item}`;
}
