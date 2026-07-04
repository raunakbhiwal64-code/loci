import type { LociModule, ModuleContext, Profile } from "@loci/module-sdk";
import { LocalStore, uuid } from "@loci/data-local";
import { createProgression } from "@loci/core-progression";
import { createSrs } from "@loci/core-srs";
import { Analytics } from "@loci/analytics";
import { Gateway, StubAdapter } from "@loci/ai-gateway";
import { MODULE_ACCENTS, designSystemFor, applyTheme, DEFAULT_THEME, setCompanion } from "@loci/design-system";
import { detectAll as milestonesDetectAll, type Milestone } from "./milestones.js";

/**
 * The shared spine (PRD Phase 0). Owns the local store, analytics, and the AI
 * gateway, and manufactures a ModuleContext for any module bound to the current
 * child profile. This is the single seam every module plugs into.
 */

// Allowed AI task templates (input scoping, PRD 5.5). Modules use id-prefixed
// task keys; free-form child text is never a task.
export const KNOWN_TASKS = new Set<string>([
  // memora
  "memora.mnemonic",
  "memora.story",
  "memora.suggest",
  "memora.faces",
  "memora.number",
  "memora.review",
  // gambit — the model only PHRASES engine/taxonomy facts, never analyses
  "gambit.explain",
  "gambit.hint",
  "gambit.review",
  // abacus
  "abacus.explain",
  "abacus.hint",
  "abacus.wordproblem",
  // cortex
  "cortex.hint",
  "cortex.explain",
  // tangra
  "tangra.hint",
  // lexicon
  "lexicon.story",
  "lexicon.definition",
  "lexicon.hint",
  // focusread
  "focusread.review",
  // hub
  "daily.encourage",
  "placeholder.hint",
]);

export class Spine {
  readonly store = new LocalStore();
  readonly analytics = new Analytics();
  private listeners = new Set<() => void>();

  async init() {
    await this.store.init();
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  notify() {
    this.listeners.forEach((l) => l());
  }

  activeProfile(): Profile | undefined {
    return this.store.activeProfile();
  }

  /* ---- theme (kid-chosen, persisted per profile) ---- */
  getTheme(): string {
    const p = this.store.activeProfile();
    if (!p) return DEFAULT_THEME;
    return this.store.moduleStorage(p.id, "shell").get<string>("theme") ?? DEFAULT_THEME;
  }
  setTheme(id: string): void {
    const p = this.store.activeProfile();
    if (p) this.store.moduleStorage(p.id, "shell").set("theme", id);
    applyTheme(id);
    this.notify();
  }
  /** Apply the active profile's stored theme (or the default). Call on boot & profile switch. */
  applyActiveTheme(): void {
    applyTheme(this.getTheme());
  }

  /** Apply the active profile's chosen companion. Call on boot & profile switch. */
  applyActiveCompanion(): void {
    const p = this.store.activeProfile();
    setCompanion(p?.companionId, p?.companionName);
  }

  /** Change the active child's companion (kept, applied live, persisted). */
  setCompanionChoice(companionId: string, companionName?: string): void {
    const p = this.store.activeProfile();
    if (!p) return;
    this.store.updateProfile(p.id, { companionId, companionName: companionName ?? p.companionName });
    this.applyActiveCompanion();
    this.notify();
  }

  /** Apply both theme and companion for the active profile. */
  applyActivePrefs(): void {
    this.applyActiveTheme();
    this.applyActiveCompanion();
  }

  /**
   * Return milestones newly earned since last check, marking them celebrated so
   * each fires exactly once (persisted per profile). Drives the celebration.
   */
  checkMilestones(): Milestone[] {
    const profile = this.store.activeProfile();
    if (!profile) return [];
    const store = this.store.moduleStorage(profile.id, "shell");
    const all = milestonesDetectAll(this);
    const existing = store.get<string[]>("celebrated");
    // First check for this profile: baseline already-earned milestones silently
    // so we never retro-celebrate a burst of old achievements.
    if (existing === undefined) {
      store.set("celebrated", all.map((m) => m.key));
      return [];
    }
    const seen = new Set(existing);
    const fresh = all.filter((m) => !seen.has(m.key));
    if (fresh.length) {
      fresh.forEach((m) => seen.add(m.key));
      store.set("celebrated", [...seen]);
    }
    return fresh;
  }

  /** Progression for the current profile, for shell surfaces (Hub, skill map). */
  progression() {
    const profile = this.store.activeProfile();
    if (!profile) throw new Error("No active profile");
    return createProgression(this.store.progressionStore(), profile.id);
  }

  /** SRS for the current profile, for shell surfaces (Reviews). */
  srs() {
    const profile = this.store.activeProfile();
    if (!profile) throw new Error("No active profile");
    return createSrs(this.store.srsStore(), profile.id, { uuid });
  }

  /** Build the context a module receives when mounted (Appendix C). */
  contextFor(mod: LociModule): ModuleContext {
    const profile = this.store.activeProfile();
    if (!profile) throw new Error("No active profile");
    const accent = MODULE_ACCENTS[mod.id] ?? "--accent-memora";

    const progression = createProgression(this.store.progressionStore(), profile.id, {
      onSkillAward: (p) => {
        this.analytics.emit({ kind: "progression", action: "skill_award", skillId: p.skillId, value: p.xp });
        this.notify();
      },
      onLevelUp: (p) => this.analytics.emit({ kind: "progression", action: "mastery", skillId: p.skillId, value: p.level }),
    });

    const srs = createSrs(this.store.srsStore(), profile.id, { uuid });

    const gateway = new Gateway({
      adapter: new StubAdapter(),
      analytics: this.analytics,
      knownTasks: KNOWN_TASKS,
      // Only the display name is a profile field in v1; never allowed to echo
      // unless a template opts in (none do yet).
      safety: { profileFields: [profile.displayName], allowDisplayName: false },
      fallbackText: "Great thinking — let's keep going!",
    });

    return {
      profile: { current: () => profile },
      progression,
      srs,
      ai: gateway,
      analytics: this.analytics,
      design: designSystemFor(accent),
      storage: this.store.moduleStorage(profile.id, mod.id),
    };
  }
}
