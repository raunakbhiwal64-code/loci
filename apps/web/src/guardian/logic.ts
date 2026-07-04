import { dateKey } from "@loci/data-local";
import type { Spine } from "../spine.js";
import { QUESTS, SAFETY_FACTS, SCENARIOS, WISDOM_CARDS, type Quest, type Scenario, type WisdomCard } from "./content.js";

/**
 * Guardian mechanics (PRD 6.4): one wisdom card max per day at the natural
 * "finished" moment, sequenced through the curriculum; a weekly scenario
 * (Saturdays the scenario IS the daily challenge); safety facts on the shared
 * SRS; a weekly Real-World Quest. All state in shell-level module storage.
 */

const GUARDIAN = "guardian";

function gstore(spine: Spine) {
  const profile = spine.activeProfile();
  if (!profile) throw new Error("No active profile");
  return spine.store.moduleStorage(profile.id, GUARDIAN);
}

/** ISO-ish week key, local time (year + week number). */
export function weekKey(d = new Date()): string {
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.floor((d.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000));
  return `${d.getFullYear()}-w${week}`;
}

/* ---- Wisdom cards ---- */

export function todaysWisdomCard(spine: Spine): WisdomCard | undefined {
  const s = gstore(spine);
  const shownToday = s.get<string>("wisdom-day");
  const idx = s.get<number>("wisdom-idx") ?? 0;
  if (shownToday === dateKey()) return undefined; // one per day max
  return WISDOM_CARDS[idx % WISDOM_CARDS.length];
}

export function markWisdomShown(spine: Spine): void {
  const s = gstore(spine);
  const idx = s.get<number>("wisdom-idx") ?? 0;
  s.set("wisdom-idx", idx + 1);
  s.set("wisdom-day", dateKey());
  spine.analytics.emit({ kind: "activity", action: "completed", moduleId: GUARDIAN, skills: [] });
}

/* ---- Scenarios ---- */

export function isScenarioDay(d = new Date()): boolean {
  return d.getDay() === 6; // Saturday: the scenario IS the daily challenge
}

export function scenarioOfWeek(d = new Date()): Scenario {
  const wk = weekKey(d);
  const seed = [...wk].reduce((a, c) => a + c.charCodeAt(0), 0);
  return SCENARIOS[seed % SCENARIOS.length];
}

/* ---- Real-World Quests ---- */

export interface QuestState {
  quest: Quest;
  done: boolean;
}

export function questOfWeek(spine: Spine, d = new Date()): QuestState {
  const wk = weekKey(d);
  const seed = [...wk].reduce((a, c) => a + c.charCodeAt(0), 0);
  const quest = QUESTS[seed % QUESTS.length];
  const done = gstore(spine).get<string>("quest-done") === wk;
  return { quest, done };
}

export function completeQuest(spine: Spine): void {
  gstore(spine).set("quest-done", weekKey());
  // Quests award real skill-map progress — the only no-screen progress source.
  spine.progression().award("metacognition", 40);
  spine.analytics.emit({ kind: "progression", action: "skill_award", moduleId: GUARDIAN, skillId: "metacognition", value: 40 });
  spine.notify();
}

/* ---- Safety facts on the SRS ---- */

/** Parent-entered facts stay LOCAL ONLY (device storage), never sent anywhere. */
export function setSafetySetup(spine: Spine, key: "phone" | "address", value: string): void {
  gstore(spine).set(`setup:${key}`, value.trim());
  ensureSafetyFactsScheduled(spine);
}

export function getSafetySetup(spine: Spine, key: "phone" | "address"): string {
  return gstore(spine).get<string>(`setup:${key}`) ?? "";
}

/** Schedule every available safety fact onto the shared SRS (idempotent). */
export function ensureSafetyFactsScheduled(spine: Spine): void {
  const srs = spine.srs();
  for (const f of SAFETY_FACTS) {
    if (f.needsSetup && !getSafetySetup(spine, f.needsSetup)) continue; // not set up yet
    srs.schedule(GUARDIAN, `safety:${f.key}`);
  }
}

/** Resolve a guardian SRS payloadRef to a child-friendly prompt + answer. */
export function resolveSafetyRef(spine: Spine, payloadRef: string): { prompt: string; answer: string } | undefined {
  if (!payloadRef.startsWith("safety:")) return undefined;
  const key = payloadRef.slice("safety:".length);
  const fact = SAFETY_FACTS.find((f) => f.key === key);
  if (!fact) return undefined;
  const answer = fact.fixed ?? (fact.needsSetup ? getSafetySetup(spine, fact.needsSetup) : "");
  return { prompt: fact.prompt, answer };
}
