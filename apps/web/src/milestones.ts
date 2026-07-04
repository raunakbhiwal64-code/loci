import { SKILLS } from "@loci/core-progression";
import type { SkillId } from "@loci/module-sdk";
import type { Spine } from "./spine.js";

/**
 * Genuine milestones (PRD 6.6): real, earned moments worth a full-screen
 * celebration + shareable certificate. Detected from actual progress — never
 * manufactured. Each is celebrated once (tracked per profile).
 */
export interface Milestone {
  key: string;
  emoji: string;
  title: string;
  blurb: string;
}

const STREAK_MILESTONES: { n: number; emoji: string; title: string }[] = [
  { n: 3, emoji: "🔥", title: "3-day streak!" },
  { n: 7, emoji: "🗓️", title: "A whole week!" },
  { n: 14, emoji: "⭐", title: "Two weeks strong!" },
  { n: 30, emoji: "🏆", title: "A 30-day journey!" },
];

/** Every milestone the child has currently earned (achieved-or-not is caller's job). */
export function detectAll(spine: Spine): Milestone[] {
  const profile = spine.activeProfile();
  if (!profile) return [];
  const out: Milestone[] = [];

  const skills = spine.progression().all();
  const totalXp = skills.reduce((s, p) => s + p.xp, 0);

  // First-ever activity
  if (totalXp > 0) {
    out.push({ key: "first-step", emoji: "🌱", title: "Your very first step!", blurb: "You started your thinking adventure. This is where great things begin." });
  }

  // Skill belts: Explorer at level 3, Master at level 5
  for (const p of skills) {
    const label = SKILLS[p.skillId as SkillId]?.label ?? "a skill";
    if (p.level >= 3) out.push({ key: `skill-${p.skillId}-l3`, emoji: "🎖️", title: `${label}: Explorer!`, blurb: `You reached Level 3 in ${label}. Your practice is really paying off.` });
    if (p.level >= 5) out.push({ key: `skill-${p.skillId}-l5`, emoji: "👑", title: `${label}: Master!`, blurb: `Level 5 in ${label} — that's serious skill, earned move by move.` });
  }

  // Forgiving streaks
  const streak = spine.store.streak(profile.id);
  for (const s of STREAK_MILESTONES) {
    if (streak >= s.n) out.push({ key: `streak-${s.n}`, emoji: s.emoji, title: s.title, blurb: `You came back ${s.n} days in a row. Showing up is the real superpower.` });
  }

  return out;
}
