import type { LociModule, ModuleContext, Profile } from "@loci/module-sdk";
import { LocalStore, uuid } from "@loci/data-local";
import { createProgression } from "@loci/core-progression";
import { createSrs } from "@loci/core-srs";
import { Analytics } from "@loci/analytics";
import { Gateway, StubAdapter } from "@loci/ai-gateway";
import { MODULE_ACCENTS, designSystemFor } from "@loci/design-system";

/**
 * The shared spine (PRD Phase 0). Owns the local store, analytics, and the AI
 * gateway, and manufactures a ModuleContext for any module bound to the current
 * child profile. This is the single seam every module plugs into.
 */

// Allowed AI task templates (input scoping, PRD 5.5). Modules use id-prefixed
// task keys; free-form child text is never a task.
export const KNOWN_TASKS = new Set<string>([
  "memora.mnemonic",
  "memora.review",
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
    };
  }
}
