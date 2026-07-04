/**
 * progress — how a reader climbs the shelves.
 *
 * We keep a small, honest record per level: how many passages were tried and
 * how accurately the comprehension questions were answered. A level opens the
 * next shelf once the reader has answered warmly (≥80%) across at least three
 * passages. Nothing here is punitive — a shelf never re-locks.
 */

import type { ModuleStorageApi } from "@loci/module-sdk";
import { ALL_LEVELS, type Level } from "./passages.js";

/** Fraction (0..1) a reader must average to open the next shelf. */
export const UNLOCK_THRESHOLD = 0.8;
/** How many passages must be attempted at a level before it can unlock the next. */
export const UNLOCK_MIN_PASSAGES = 3;

export interface LevelRecord {
  /** Questions answered correctly across all attempts at this level. */
  correct: number;
  /** Questions asked across all attempts at this level. */
  asked: number;
  /** Distinct passage ids the reader has answered questions on. */
  passages: string[];
}

const STORAGE_KEY = "focusread.levels.v1";

type LevelMap = Partial<Record<Level, LevelRecord>>;

function emptyRecord(): LevelRecord {
  return { correct: 0, asked: 0, passages: [] };
}

function loadMap(storage: ModuleStorageApi): LevelMap {
  return storage.get<LevelMap>(STORAGE_KEY) ?? {};
}

function saveMap(storage: ModuleStorageApi, map: LevelMap): void {
  storage.set(STORAGE_KEY, map);
}

/** Read one level's record (never undefined). */
export function levelRecord(storage: ModuleStorageApi, level: Level): LevelRecord {
  return loadMap(storage)[level] ?? emptyRecord();
}

/** Accuracy at a level as a 0..1 fraction (0 when nothing asked yet). */
export function levelAccuracy(rec: LevelRecord): number {
  return rec.asked === 0 ? 0 : rec.correct / rec.asked;
}

/** A level counts as "warmly read" once it has enough attempts at ≥ threshold. */
export function levelUnlocksNext(rec: LevelRecord): boolean {
  return rec.passages.length >= UNLOCK_MIN_PASSAGES && levelAccuracy(rec) >= UNLOCK_THRESHOLD;
}

/**
 * The highest level a reader has reached. Level 1 is always open; each level
 * opens the next when it has been read warmly.
 */
export function reachedLevel(storage: ModuleStorageApi): Level {
  const map = loadMap(storage);
  let reached: Level = 1;
  for (const level of ALL_LEVELS) {
    const rec = map[level] ?? emptyRecord();
    if (level > reached) break;
    if (levelUnlocksNext(rec) && level < 4) {
      reached = (level + 1) as Level;
    }
  }
  return reached;
}

/** Is this level open for reading? */
export function isLevelUnlocked(storage: ModuleStorageApi, level: Level): boolean {
  return level <= reachedLevel(storage);
}

export interface RecordResult {
  /** The reader's reached level after saving. */
  reached: Level;
  /** True when this result just opened a new shelf. */
  unlockedNew: boolean;
}

/**
 * Fold a comprehension result into a level's record and persist it.
 * `correct`/`asked` are the questions from a single passage attempt.
 */
export function recordComprehension(
  storage: ModuleStorageApi,
  level: Level,
  passageId: string,
  correct: number,
  asked: number
): RecordResult {
  const before = reachedLevel(storage);
  const map = loadMap(storage);
  const rec = map[level] ?? emptyRecord();
  rec.correct += correct;
  rec.asked += asked;
  if (!rec.passages.includes(passageId)) rec.passages.push(passageId);
  map[level] = rec;
  saveMap(storage, map);
  const after = reachedLevel(storage);
  return { reached: after, unlockedNew: after > before };
}
