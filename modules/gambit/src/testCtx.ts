/**
 * Test-only in-memory ModuleContext (imported by *.test.ts). Implements just
 * enough of the spine contract for the structured-learning units: synchronous
 * key/value storage, an SM-2-ish SRS with due filtering, no-op progression,
 * analytics capture, and a deterministic AI stub. Not shipped in the UI.
 */
import type {
  ModuleContext,
  SrsItem,
  RecallGrade,
  AnalyticsEvent,
  SkillProgress,
  SkillId,
  Profile,
  AIResult,
} from "@loci/module-sdk";

export interface TestCtx extends ModuleContext {
  /** Captured analytics events, for assertions. */
  events: AnalyticsEvent[];
  /** Direct view of the storage map. */
  store: Map<string, unknown>;
  /** Direct view of scheduled SRS items. */
  srsItems: Map<string, SrsItem>;
}

const DAY = 24 * 60 * 60 * 1000;

/** Build a fresh in-memory context. `now` seeds a stable clock for SRS due-ness. */
export function makeTestCtx(now = Date.now()): TestCtx {
  const store = new Map<string, unknown>();
  const srsItems = new Map<string, SrsItem>();
  const events: AnalyticsEvent[] = [];

  const profile: Profile = {
    id: "test",
    displayName: "Tester",
    avatarId: "a",
    ageBand: "8-9",
    createdAt: now,
    settings: { audioPrompts: false, reducedMotion: false },
  };

  const aiResult = (text: string): Promise<AIResult> =>
    Promise.resolve({ text, tier: 1, filtered: false });

  const ctx: TestCtx = {
    events,
    store,
    srsItems,
    profile: { current: () => profile },
    progression: {
      award: () => {},
      get: (skill: SkillId): SkillProgress => ({
        profileId: profile.id,
        skillId: skill,
        xp: 0,
        level: 0,
        lastAwardedAt: now,
      }),
      all: () => [],
    },
    srs: {
      schedule: (moduleId: string, payloadRef: string): SrsItem => {
        const id = `${moduleId}:${payloadRef}`;
        // A newly scheduled item is due immediately (dueAt <= now).
        const item: SrsItem = {
          id,
          profileId: profile.id,
          moduleId,
          payloadRef,
          ease: 2.5,
          intervalDays: 0,
          dueAt: now,
          history: [],
        };
        srsItems.set(id, item);
        return item;
      },
      review: (itemId: string, grade: RecallGrade): SrsItem => {
        const item = srsItems.get(itemId)!;
        const recalled = grade !== "again";
        const interval = recalled ? Math.max(1, item.intervalDays * 2 || 1) : 0;
        const next: SrsItem = {
          ...item,
          intervalDays: interval,
          dueAt: now + interval * DAY,
          history: [...item.history, { at: now, recalled }],
        };
        srsItems.set(itemId, next);
        return next;
      },
      due: (moduleId?: string): SrsItem[] =>
        [...srsItems.values()].filter(
          (i) => i.dueAt <= now && (!moduleId || i.moduleId === moduleId),
        ),
    },
    ai: {
      explain: (r) => aiResult(String(r.context.label ?? "")),
      hint: (r) => aiResult(`hint ${r.level}`),
      generateContent: () => aiResult(""),
      review: (r) => aiResult(String(r.context.label ?? "")),
    },
    analytics: { emit: (e) => events.push(e) },
    design: { accentVar: "--accent-gambit", token: () => "" },
    storage: {
      get: <T = unknown>(key: string) => store.get(key) as T | undefined,
      set: (key: string, value: unknown) => {
        store.set(key, value);
      },
      remove: (key: string) => {
        store.delete(key);
      },
      keys: () => [...store.keys()],
    },
  };
  return ctx;
}
