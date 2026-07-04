/**
 * The Path (spec §2) — the structured learning ladder. Nine levels L0–L8, each
 * gated by demonstrated mastery. A child cannot skip ahead by clicking; they
 * advance by PROVING the skill.
 *
 * Each level has: id, title, kid-friendly concept summary, lessons (Learn, from
 * lessons.ts), drill puzzle-themes (mapped to existing puzzles.ts PuzzleTypes),
 * a boss persona (from personas.ts), and gate criteria.
 *
 * Mastery gate (spec §2 table + §3):
 *   - solve the level's pattern set at ≥ 80% first-try, AND
 *   - from L2 on, the child has used the blunder-check unprompted ≥ 1 time
 *     (reuses guided/blunderCheck usage).
 * Levels are LOCKED until the previous is cleared. Progress is persisted
 * per-profile in ctx.storage (unlocked level + per-level solve stats).
 *
 * Pure of React so gate logic is unit-testable; the screens live in path/*.
 */
import type { ModuleContext } from "@loci/module-sdk";
import type { PuzzleType, Puzzle } from "./puzzles.js";
import { PUZZLES } from "./puzzles.js";
import { blunderCheckUses } from "./guided/blunderCheck.js";
import { LESSONS, type Lesson } from "./lessons.js";

export interface PathLevel {
  id: string;
  /** 0..8 */
  index: number;
  title: string;
  emoji: string;
  /** Kid-friendly one-line summary of the concept. */
  summary: string;
  /** Puzzle themes (existing PuzzleTypes) drilled at this level. */
  drillThemes: PuzzleType[];
  /** The boss persona id (from personas.ts) for this level's Apply step. */
  bossPersonaId: string;
  /** Whether this level requires an unprompted blunder-check to clear (L2+). */
  requiresBlunderCheck: boolean;
}

/** The ladder. Order is the progression order (index === array position). */
export const PATH_LEVELS: PathLevel[] = [
  {
    id: "l0",
    index: 0,
    title: "Board & Pieces",
    emoji: "♟️",
    summary: "How each piece moves, and how much it's worth.",
    drillThemes: ["capture"],
    bossPersonaId: "pip",
    requiresBlunderCheck: false,
  },
  {
    id: "l1",
    index: 1,
    title: "The Rules",
    emoji: "📜",
    summary: "Check, castling, promotion, and getting out of check.",
    drillThemes: ["escape", "capture"],
    bossPersonaId: "pip",
    requiresBlunderCheck: false,
  },
  {
    id: "l2",
    index: 2,
    title: "Piece Safety + Blunder-Check",
    emoji: "🛡️",
    summary: "Is it safe? What's the threat? The habit that wins games.",
    drillThemes: ["capture", "escape"],
    bossPersonaId: "pip",
    requiresBlunderCheck: true,
  },
  {
    id: "l3",
    index: 3,
    title: "Basic Tactics",
    emoji: "⚔️",
    summary: "Fork, pin, skewer, and discovered attack.",
    drillThemes: ["fork", "pin", "skewer", "discovered"],
    bossPersonaId: "rex",
    requiresBlunderCheck: true,
  },
  {
    id: "l4",
    index: 4,
    title: "Checkmates",
    emoji: "👑",
    summary: "Back-rank, mate in 1 and 2, and king + queen.",
    drillThemes: ["mate1", "mate2"],
    bossPersonaId: "rex",
    requiresBlunderCheck: true,
  },
  {
    id: "l5",
    index: 5,
    title: "Advanced Tactics",
    emoji: "🎯",
    summary: "Double attack, deflection, decoy, remove-the-defender, overload.",
    drillThemes: ["fork", "skewer", "discovered"],
    bossPersonaId: "rex",
    requiresBlunderCheck: true,
  },
  {
    id: "l6",
    index: 6,
    title: "Opening Principles",
    emoji: "🚀",
    summary: "Grab the centre, develop your pieces, and castle early.",
    drillThemes: ["capture", "fork"],
    bossPersonaId: "vizier",
    requiresBlunderCheck: true,
  },
  {
    id: "l7",
    index: 7,
    title: "Endgames",
    emoji: "🏁",
    summary: "Opposition, key squares, the square of the pawn, promotion.",
    drillThemes: ["mate1", "capture"],
    bossPersonaId: "vizier",
    requiresBlunderCheck: true,
  },
  {
    id: "l8",
    index: 8,
    title: "Strategy",
    emoji: "🧭",
    summary: "Weak squares, outposts, good vs bad bishop, activity, planning.",
    drillThemes: ["fork", "pin", "skewer"],
    bossPersonaId: "vizier",
    requiresBlunderCheck: true,
  },
];

/** The share of the drill set that must be solved first-try to clear the gate. */
export const MASTERY_THRESHOLD = 0.8;

export function levelByIndex(index: number): PathLevel | undefined {
  return PATH_LEVELS.find((l) => l.index === index);
}

/** The lessons (Learn) authored for a level (may be empty for higher levels). */
export function lessonsForPathLevel(level: PathLevel): Lesson[] {
  return LESSONS.filter((l) => l.level === level.index);
}

/** The drill puzzles for a level: puzzles whose type is one of the level themes. */
export function drillPuzzlesForLevel(level: PathLevel): Puzzle[] {
  return PUZZLES.filter((p) => level.drillThemes.includes(p.type));
}

/* ------------------------------------------------------------------ *
 * Persisted per-profile progress (spec §2: current unlocked level +
 * per-level solve stats).
 * ------------------------------------------------------------------ */

interface LevelStats {
  /** Puzzle ids attempted at this level (any outcome). */
  attempted: string[];
  /** Puzzle ids solved on the FIRST try (the mastery numerator). */
  firstTry: string[];
  /** True once the boss game for this level has been beaten. */
  bossBeaten: boolean;
}

interface PathState {
  /** Highest level index the child has UNLOCKED (0-based). */
  unlocked: number;
  /** Per-level stats keyed by level id. */
  levels: Record<string, LevelStats>;
}

const PATH_KEY = "path:progress";

function emptyStats(): LevelStats {
  return { attempted: [], firstTry: [], bossBeaten: false };
}

export function readPathState(ctx: ModuleContext): PathState {
  const s = ctx.storage.get<PathState>(PATH_KEY);
  if (!s) return { unlocked: 0, levels: {} };
  return { unlocked: s.unlocked ?? 0, levels: s.levels ?? {} };
}

function writePathState(ctx: ModuleContext, state: PathState): void {
  ctx.storage.set(PATH_KEY, state);
}

function statsFor(state: PathState, levelId: string): LevelStats {
  return state.levels[levelId] ?? emptyStats();
}

/** Is this level unlocked (playable)? Level 0 always is. */
export function isLevelUnlocked(ctx: ModuleContext, index: number): boolean {
  if (index <= 0) return true;
  return readPathState(ctx).unlocked >= index;
}

/**
 * Record a drill attempt at a level. `firstTry` means the child solved it with
 * no wrong guess first. Attempts are idempotent per puzzle for the mastery
 * numerator (a puzzle counts once toward first-try; re-solving later won't
 * inflate the ratio, and a later re-attempt never REMOVES an earned first-try).
 */
export function recordDrillAttempt(
  ctx: ModuleContext,
  levelId: string,
  puzzleId: string,
  firstTry: boolean,
): void {
  const state = readPathState(ctx);
  const stats = { ...statsFor(state, levelId) };
  stats.attempted = stats.attempted.includes(puzzleId) ? stats.attempted : [...stats.attempted, puzzleId];
  if (firstTry && !stats.firstTry.includes(puzzleId)) {
    stats.firstTry = [...stats.firstTry, puzzleId];
  }
  state.levels = { ...state.levels, [levelId]: stats };
  writePathState(ctx, state);
  maybeUnlockNext(ctx, levelId);
}

/** Record that the level's boss game was beaten. */
export function recordBossBeaten(ctx: ModuleContext, levelId: string): void {
  const state = readPathState(ctx);
  const stats = { ...statsFor(state, levelId), bossBeaten: true };
  state.levels = { ...state.levels, [levelId]: stats };
  writePathState(ctx, state);
  maybeUnlockNext(ctx, levelId);
}

/** The first-try mastery ratio for a level (0..1) over its full drill set. */
export function masteryRatio(ctx: ModuleContext, level: PathLevel): number {
  const total = drillPuzzlesForLevel(level).length;
  if (total === 0) return 0;
  const stats = statsFor(readPathState(ctx), level.id);
  // Only count first-try solves of puzzles that actually belong to this level's set.
  const setIds = new Set(drillPuzzlesForLevel(level).map((p) => p.id));
  const solved = stats.firstTry.filter((id) => setIds.has(id)).length;
  return solved / total;
}

/**
 * Is the level's mastery GATE cleared? Requires:
 *   - first-try ratio ≥ MASTERY_THRESHOLD over the drill set, AND
 *   - (L2+) the child has used the blunder-check unprompted ≥ 1 time.
 * The boss step is part of "Apply"; beating it is encouraged and unlocks too,
 * but the measurable mastery gate is the pattern-set ratio + blunder-check.
 */
export function isGateCleared(ctx: ModuleContext, level: PathLevel): boolean {
  const ratioOk = masteryRatio(ctx, level) >= MASTERY_THRESHOLD;
  if (!ratioOk) return false;
  if (level.requiresBlunderCheck && blunderCheckUses(ctx) < 1) return false;
  return true;
}

/**
 * If the given level's gate is now cleared, unlock the NEXT level. Idempotent
 * and monotonic — the unlocked pointer only ever moves forward.
 */
function maybeUnlockNext(ctx: ModuleContext, levelId: string): void {
  const level = PATH_LEVELS.find((l) => l.id === levelId);
  if (!level) return;
  if (!isGateCleared(ctx, level)) return;
  const state = readPathState(ctx);
  const next = level.index + 1;
  if (next < PATH_LEVELS.length && state.unlocked < next) {
    state.unlocked = next;
    writePathState(ctx, state);
  }
}

/** Convenience view for the ladder UI. */
export interface LevelStatus {
  level: PathLevel;
  unlocked: boolean;
  gateCleared: boolean;
  masteryRatio: number;
  bossBeaten: boolean;
}

export function levelStatuses(ctx: ModuleContext): LevelStatus[] {
  const state = readPathState(ctx);
  return PATH_LEVELS.map((level) => ({
    level,
    unlocked: isLevelUnlocked(ctx, level.index),
    gateCleared: isGateCleared(ctx, level),
    masteryRatio: masteryRatio(ctx, level),
    bossBeaten: statsFor(state, level.id).bossBeaten,
  }));
}

/* ------------------------------------------------------------------ *
 * SRS mastery for chess (spec §3, §6) — schedule a learned/drilled
 * pattern onto the shared SRS so it becomes automatic. payloadRef is
 * keyed by THEME so reviews pull FRESH positions of that theme, not the
 * same position twice.
 * ------------------------------------------------------------------ */

/** The SRS payloadRef for a puzzle theme, e.g. "gambit:tactic:fork". */
export function themeSrsRef(theme: PuzzleType): string {
  return `gambit:tactic:${theme}`;
}

/** Schedule every drill theme of a level onto the SRS (patterns, not positions). */
export function scheduleLevelThemes(ctx: ModuleContext, level: PathLevel): void {
  for (const theme of level.drillThemes) {
    ctx.srs.schedule("gambit", themeSrsRef(theme));
  }
}
