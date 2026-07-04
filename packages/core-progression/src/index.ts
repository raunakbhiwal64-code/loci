import type { ProgressionApi, SkillId, SkillProgress } from "@loci/module-sdk";
import { SKILLS } from "./skills.js";

export { SKILLS, ALL_SKILLS } from "./skills.js";
export type { SkillMeta } from "./skills.js";

/**
 * Deterministic level curve. Generous and non-punitive (PRD 6.2): levels come
 * steadily, XP never decreases, and there is no loss framing. Each level costs
 * a little more than the last.
 */
export function levelForXp(xp: number): number {
  // level n reached at cumulative XP = 50 * n * (n + 1) / 2  →  invert.
  if (xp <= 0) return 0;
  return Math.floor((-1 + Math.sqrt(1 + (8 * xp) / 50)) / 2) + 1;
}

export function xpForLevel(level: number): number {
  if (level <= 0) return 0;
  return (50 * (level - 1) * level) / 2;
}

/** Persistence port implemented by @loci/data-local (or an in-memory stub). */
export interface ProgressionStore {
  read(profileId: string, skillId: SkillId): SkillProgress | undefined;
  write(progress: SkillProgress): void;
  readAll(profileId: string): SkillProgress[];
}

function blank(profileId: string, skillId: SkillId): SkillProgress {
  return { profileId, skillId, xp: 0, level: 0, lastAwardedAt: 0 };
}

export interface ProgressionEvents {
  onSkillAward?: (p: SkillProgress) => void;
  onLevelUp?: (p: SkillProgress, from: number) => void;
}

export function createProgression(
  store: ProgressionStore,
  profileId: string,
  events: ProgressionEvents = {}
): ProgressionApi {
  return {
    award(skill, xp) {
      if (xp <= 0) return; // never punitive
      const cur = store.read(profileId, skill) ?? blank(profileId, skill);
      const fromLevel = cur.level;
      const next: SkillProgress = {
        ...cur,
        xp: cur.xp + xp,
        level: levelForXp(cur.xp + xp),
        lastAwardedAt: Date.now(),
      };
      store.write(next);
      events.onSkillAward?.(next);
      if (next.level > fromLevel) events.onLevelUp?.(next, fromLevel);
    },
    get(skill) {
      return store.read(profileId, skill) ?? blank(profileId, skill);
    },
    all() {
      const existing = store.readAll(profileId);
      const seen = new Set(existing.map((p) => p.skillId));
      // Present every taxonomy skill, even at zero, so the map is complete.
      const zeros = (Object.keys(SKILLS) as SkillId[])
        .filter((id) => !seen.has(id))
        .map((id) => blank(profileId, id));
      return [...existing, ...zeros];
    },
  };
}
