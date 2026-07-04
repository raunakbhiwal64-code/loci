import type { ModuleContext } from "@loci/module-sdk";

/**
 * Per-type difficulty ladders + persistence (ctx.storage, scoped to the
 * current child). Two wins at your current level unlock the next one.
 * Hint-free solves are tracked per type (PRD 4.4 primary metric).
 */

export type PuzzleTypeId = "logicgrid" | "sequences" | "oddoneout" | "sudoku";

export interface TypeProgress {
  level: number; // highest unlocked level (1-based)
  wins: number; // wins at the current level, resets on level-up
  solved: number; // lifetime solves
  hintFree: number; // lifetime hint-free solves
}

export type CortexProgress = Record<PuzzleTypeId, TypeProgress>;

export const MAX_LEVEL: Record<PuzzleTypeId, number> = {
  logicgrid: 4,
  sequences: 5,
  oddoneout: 3,
  sudoku: 4,
};

export const WINS_TO_LEVEL_UP = 2;

const KEY = "progress";

function freshType(): TypeProgress {
  return { level: 1, wins: 0, solved: 0, hintFree: 0 };
}

export function loadProgress(ctx: ModuleContext): CortexProgress {
  const raw = ctx.storage.get<Partial<CortexProgress>>(KEY) ?? {};
  const out = {} as CortexProgress;
  (Object.keys(MAX_LEVEL) as PuzzleTypeId[]).forEach((t) => {
    const saved = raw[t];
    out[t] = saved
      ? {
          level: Math.max(1, Math.min(MAX_LEVEL[t], saved.level ?? 1)),
          wins: saved.wins ?? 0,
          solved: saved.solved ?? 0,
          hintFree: saved.hintFree ?? 0,
        }
      : freshType();
  });
  return out;
}

export interface SolveOutcome {
  progress: CortexProgress;
  leveledUp: boolean;
}

export function recordSolve(ctx: ModuleContext, type: PuzzleTypeId, level: number, hintFree: boolean): SolveOutcome {
  const progress = loadProgress(ctx);
  const t = progress[type];
  t.solved++;
  if (hintFree) t.hintFree++;

  let leveledUp = false;
  if (level >= t.level && t.level < MAX_LEVEL[type]) {
    t.wins++;
    if (t.wins >= WINS_TO_LEVEL_UP) {
      t.level++;
      t.wins = 0;
      leveledUp = true;
    }
  }
  ctx.storage.set(KEY, progress);
  return { progress, leveledUp };
}
