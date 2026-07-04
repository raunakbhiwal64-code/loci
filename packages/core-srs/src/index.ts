import type { RecallGrade, SrsApi, SrsItem } from "@loci/module-sdk";

/**
 * Shared spaced-repetition engine (PRD 5.9 / 7). SM-2 class, fully
 * deterministic — no model call. Reused by Memora, Lexicon and any
 * retained-content module. Always available offline.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;

/** Pure SM-2 step. Returns the next scheduling fields for an item. */
export function schedule(
  item: Pick<SrsItem, "ease" | "intervalDays" | "history">,
  grade: RecallGrade,
  now: number
): { ease: number; intervalDays: number; dueAt: number; recalled: boolean } {
  const q = { again: 0, hard: 3, good: 4, easy: 5 }[grade];
  const recalled = q >= 3;

  let ease = item.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ease < MIN_EASE) ease = MIN_EASE;

  let intervalDays: number;
  if (!recalled) {
    intervalDays = 1; // lapse → relearn tomorrow (gentle, no shaming)
  } else {
    const reps = item.history.filter((h) => h.recalled).length;
    if (reps === 0) intervalDays = 1;
    else if (reps === 1) intervalDays = 3;
    else intervalDays = Math.round(item.intervalDays * ease);
    if (grade === "hard") intervalDays = Math.max(1, Math.round(intervalDays * 0.6));
  }

  return { ease, intervalDays, dueAt: now + intervalDays * DAY_MS, recalled };
}

/** Persistence port implemented by @loci/data-local (or an in-memory stub). */
export interface SrsStore {
  read(itemId: string): SrsItem | undefined;
  write(item: SrsItem): void;
  readDue(profileId: string, now: number, moduleId?: string): SrsItem[];
  findByRef(profileId: string, moduleId: string, payloadRef: string): SrsItem | undefined;
}

export interface SrsDeps {
  now?: () => number;
  uuid: () => string;
}

export function createSrs(store: SrsStore, profileId: string, deps: SrsDeps): SrsApi {
  const now = deps.now ?? (() => Date.now());
  return {
    schedule(moduleId, payloadRef) {
      const existing = store.findByRef(profileId, moduleId, payloadRef);
      if (existing) return existing;
      const item: SrsItem = {
        id: deps.uuid(),
        profileId,
        moduleId,
        payloadRef,
        ease: 2.5,
        intervalDays: 0,
        dueAt: now(), // due immediately on first sight
        history: [],
      };
      store.write(item);
      return item;
    },
    review(itemId, grade) {
      const item = store.read(itemId);
      if (!item) throw new Error(`SRS item not found: ${itemId}`);
      const t = now();
      const step = schedule(item, grade, t);
      const updated: SrsItem = {
        ...item,
        ease: step.ease,
        intervalDays: step.intervalDays,
        dueAt: step.dueAt,
        history: [...item.history, { at: t, recalled: step.recalled }],
      };
      store.write(updated);
      return updated;
    },
    due(moduleId) {
      return store.readDue(profileId, now(), moduleId);
    },
  };
}
