/**
 * The blunder-check thinking routine (screen 21, PRD 4.2) — the highest-value
 * beginner habit. A scaffolded pre-move checklist the child internalises. It is
 * shown as an overlay in the Guided Game, celebrated when used, and — crucially —
 * FADES as the child internalises it: after enough guided games the overlay
 * reduces from a full checklist, to a single reminder, to off. The fade is real
 * and persisted in ctx.storage (deliberate-practice scaffold removal).
 */
import type { ModuleContext } from "@loci/module-sdk";

/** The four questions of the routine (Levy Rozman's beginner blunder-check). */
export const BLUNDER_CHECK: { id: string; emoji: string; question: string }[] = [
  { id: "safe", emoji: "🛡️", question: "Is the piece I'm moving safe where it lands?" },
  { id: "threats", emoji: "👀", question: "What can my opponent capture or threaten next?" },
  { id: "undefended", emoji: "🔓", question: "Am I leaving anything undefended?" },
  { id: "better", emoji: "✨", question: "Is there a better, more active move?" },
];

/** How the overlay currently appears — it collapses as competence grows. */
export type ScaffoldLevel = "full" | "reminder" | "off";

const GUIDED_GAMES_KEY = "blundercheck:guidedGames"; // number of guided games finished
const USES_KEY = "blundercheck:uses"; // number of times the child actively used the checklist

/** Thresholds (in guided games completed) at which the scaffold fades. */
const REMINDER_AFTER = 3; // after 3 guided games → shrink to a single reminder
const OFF_AFTER = 6; // after 6 guided games → the child is trusted to do it alone

export function guidedGamesPlayed(ctx: ModuleContext): number {
  return ctx.storage.get<number>(GUIDED_GAMES_KEY) ?? 0;
}

export function blunderCheckUses(ctx: ModuleContext): number {
  return ctx.storage.get<number>(USES_KEY) ?? 0;
}

/** The scaffold level for the CURRENT guided game, based on games completed. */
export function scaffoldLevel(ctx: ModuleContext): ScaffoldLevel {
  const played = guidedGamesPlayed(ctx);
  if (played >= OFF_AFTER) return "off";
  if (played >= REMINDER_AFTER) return "reminder";
  return "full";
}

/** How many more guided games until the scaffold next fades (0 = already off). */
export function gamesUntilNextFade(ctx: ModuleContext): number {
  const played = guidedGamesPlayed(ctx);
  if (played >= OFF_AFTER) return 0;
  if (played >= REMINDER_AFTER) return OFF_AFTER - played;
  return REMINDER_AFTER - played;
}

/** Record that the child actively ran the checklist (for celebration + metrics). */
export function recordBlunderCheckUse(ctx: ModuleContext): void {
  ctx.storage.set(USES_KEY, blunderCheckUses(ctx) + 1);
  ctx.analytics.emit({
    kind: "progression",
    action: "skill_award",
    moduleId: "gambit",
    skillId: "metacognition",
    value: 1,
  });
}

/**
 * Record that a guided game finished — this is what actually advances the fade.
 * Returns the scaffold level that will apply to the NEXT guided game, so callers
 * can celebrate a fade milestone ("you're ready to try it on your own!").
 */
export function completeGuidedGame(ctx: ModuleContext): ScaffoldLevel {
  const next = guidedGamesPlayed(ctx) + 1;
  ctx.storage.set(GUIDED_GAMES_KEY, next);
  return scaffoldLevel(ctx);
}
