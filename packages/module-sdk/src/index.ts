/**
 * @loci/module-sdk — the contract every module implements and the shared
 * types the spine exposes to modules. Pure types, no runtime, no dependencies.
 *
 * See PRD Appendix C (module contract) and Appendix E (data model).
 */

/* ------------------------------------------------------------------ *
 * Cognitive skill taxonomy (PRD Appendix A)
 * ------------------------------------------------------------------ */

export type SkillId =
  | "working-memory"
  | "long-term-memory-technique"
  | "calculation-number-sense"
  | "pattern-recognition"
  | "deductive-reasoning"
  | "inductive-reasoning"
  | "planning-foresight"
  | "spatial-visualisation"
  | "verbal-reasoning"
  | "vocabulary"
  | "reading-comprehension"
  | "sustained-attention"
  | "metacognition";

export type AgeBand = "8-9" | "10-12";

/* ------------------------------------------------------------------ *
 * Core entities (PRD Appendix E — local-first v1)
 * ------------------------------------------------------------------ */

export interface Profile {
  id: string; // local uuid
  displayName: string; // parent-entered nickname
  avatarId: string;
  ageBand: AgeBand;
  createdAt: number;
  settings: {
    audioPrompts: boolean;
    reducedMotion: boolean;
  };
}

export interface SkillProgress {
  profileId: string;
  skillId: SkillId;
  xp: number; // deterministic, module-agnostic
  level: number;
  lastAwardedAt: number;
}

export interface SrsItem {
  id: string;
  profileId: string;
  moduleId: string;
  payloadRef: string; // content-store item
  ease: number;
  intervalDays: number;
  dueAt: number; // epoch ms
  history: { at: number; recalled: boolean }[];
}

export interface DailyChallengeResult {
  profileId: string;
  dateKey: string; // YYYY-MM-DD (local)
  challengeId: string;
  completed: boolean;
  scoreSummary: string; // precomputed glyph grid
  shared: boolean;
  streakAfter: number;
}

export interface ContentItem {
  id: string;
  moduleId: string;
  kind: "lesson" | "puzzle" | "passage" | "wordset" | "mnemonic";
  difficulty: number;
  packVersion: string;
  validated: true; // nothing unvalidated is storable
  body: unknown; // module-defined, schema-checked
}

/* ------------------------------------------------------------------ *
 * Spine service interfaces exposed to modules via ModuleContext
 * ------------------------------------------------------------------ */

export interface ProfileApi {
  current(): Profile;
}

export interface ProgressionApi {
  /** Award XP to one or more skills; deterministic, generous, non-punitive. */
  award(skill: SkillId, xp: number): void;
  /** Read the current child's progress for one skill. */
  get(skill: SkillId): SkillProgress;
  /** Read the whole skill map for the current child. */
  all(): SkillProgress[];
}

export type RecallGrade = "again" | "hard" | "good" | "easy";

export interface SrsApi {
  /** Schedule a new item (or reset an existing one) into the review ladder. */
  schedule(moduleId: string, payloadRef: string): SrsItem;
  /** Record a review outcome and reschedule (SM-2 class). */
  review(itemId: string, grade: RecallGrade): SrsItem;
  /** Items due now for the current child, optionally filtered by module. */
  due(moduleId?: string): SrsItem[];
}

/* ---- AI Gateway contract (PRD 5.5) -------------------------------- */

export interface ExplainRequest {
  task: string; // template id, never free-form child text
  context: Record<string, string | number | boolean>;
}
export interface HintRequest {
  task: string;
  level: number; // graduated: 1 = gentle nudge … higher = more explicit
  context: Record<string, string | number | boolean>;
}
export interface GenerateRequest {
  task: string;
  context: Record<string, string | number | boolean>;
}
export interface ReviewRequest {
  task: string;
  context: Record<string, string | number | boolean>;
}

export interface AIResult {
  /** Human-readable text, already passed through the safety filter. */
  text: string;
  /** Structured payload when the task template defines one. */
  data?: unknown;
  /** Which cost tier served this (PRD 5.6): 1 rule, 2 cache, 3 on-device, 4 self-hosted. */
  tier: 1 | 2 | 3 | 4;
  /** True when the safety filter replaced model output with safe content. */
  filtered: boolean;
}

export interface AIProvider {
  explain(req: ExplainRequest): Promise<AIResult>;
  hint(req: HintRequest): Promise<AIResult>;
  generateContent(req: GenerateRequest): Promise<AIResult>;
  review(req: ReviewRequest): Promise<AIResult>;
}

/* ---- Analytics contract (PRD Appendix B) -------------------------- */

export type AnalyticsEvent =
  | { kind: "session"; action: "start" | "end" | "module_opened"; moduleId?: string; deviceClass?: string }
  | {
      kind: "activity";
      action: "started" | "completed" | "abandoned";
      moduleId: string;
      skills?: SkillId[];
      difficulty?: number;
      success?: number; // 0..1 accuracy
      timeMs?: number;
      hints?: number;
    }
  | { kind: "progression"; action: "mastery" | "skill_award" | "streak"; moduleId?: string; skillId?: SkillId; value?: number }
  | { kind: "review"; action: "due" | "attempted" | "recalled" | "missed"; moduleId: string; intervalDays?: number }
  | { kind: "daily"; action: "served" | "completed" | "shared"; challengeId: string }
  | { kind: "ai"; action: "call"; tier: 1 | 2 | 3 | 4; latencyMs: number; cacheHit: boolean; guardrailTrigger: boolean }
  | { kind: "content"; action: "served" | "completed" | "validation"; itemId: string; pass?: boolean }
  | { kind: "wellbeing"; action: "long_session" | "frustration"; moduleId?: string };

export interface AnalyticsApi {
  /** Emit an event. Phase-1 rule: NEVER include child-produced personal content. */
  emit(event: AnalyticsEvent): void;
}

/* ---- Module storage contract -------------------------------------- */

/**
 * Per-module, per-profile persistent key/value storage (local-first, IndexedDB
 * write-through). For module-owned data like custom palaces, saved lists,
 * bot progress. Reads are synchronous from the in-memory snapshot.
 */
export interface ModuleStorageApi {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  remove(key: string): void;
  keys(): string[];
}

/* ---- Design system contract -------------------------------------- */

export interface DesignSystem {
  /** CSS custom-property name for a module accent, e.g. "--accent". */
  accentVar: string;
  /** Resolve a design token to its value. */
  token(name: string): string;
}

/* ------------------------------------------------------------------ *
 * The module contract (PRD Appendix C)
 * ------------------------------------------------------------------ */

export interface ModuleContext {
  profile: ProfileApi;
  progression: ProgressionApi;
  srs: SrsApi;
  ai: AIProvider;
  analytics: AnalyticsApi;
  design: DesignSystem;
  /** Module-owned persistent storage, scoped to (module, current profile). */
  storage: ModuleStorageApi;
}

export interface LociModule {
  id: string; // e.g. "memora"
  displayName: string;
  accentToken: string; // design-system accent token name
  skillsAwarded: SkillId[]; // from Appendix A
  contributesToDaily?: boolean; // feeds the daily challenge (memory, chess)
  /** Mount the module UI into the shell container. Returns a cleanup fn. */
  mount(container: Element, ctx: ModuleContext): void | (() => void);
}
