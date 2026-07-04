/**
 * Abacus storage — thin typed wrapper over ctx.storage (already scoped to
 * module + profile by the spine). Mastery, adaptive difficulty, sprint run
 * history, and ghost bests all live here.
 */

import type { ModuleStorageApi } from "@loci/module-sdk";
import { freshAdaptive, updateAdaptive, type AdaptiveState, type TechniqueId } from "./techniques.js";

export interface TechniqueMastery {
  /** Watched the worked example to the end. */
  lesson: boolean;
  /** Guided problems completed (drill unlocks at GUIDED_TARGET). */
  guided: number;
  /** Finished the first drill (sprint) — technique joins SRS mixed review. */
  drill: boolean;
}

export const GUIDED_TARGET = 5;

export type SprintScope = TechniqueId | "mixed";

export interface SprintRun {
  at: number; // epoch ms
  scope: SprintScope;
  durationSec: number;
  attempted: number;
  correct: number;
  /** Problems per minute at the run's accuracy — the parent artefact metric. */
  ppm: number;
  accuracy: number; // 0..1
}

export interface GhostBest {
  at: number;
  correct: number;
  attempted: number;
  ppm: number;
  /** Cumulative correct count at each elapsed second — the ghost's racing line. */
  timeline: number[];
}

export interface LastVisited {
  techniqueId: TechniqueId;
}

const K = {
  mastery: (id: TechniqueId) => `mastery.v1:${id}`,
  adaptive: (id: TechniqueId) => `adaptive.v1:${id}`,
  runs: "runs.v1",
  best: (scope: SprintScope, durationSec: number) => `ghost.v1:${scope}:${durationSec}`,
  last: "last.v1",
};

const MAX_RUNS = 200;

export class AbacusStore {
  constructor(private readonly storage: ModuleStorageApi) {}

  /* ---- mastery ---- */

  mastery(id: TechniqueId): TechniqueMastery {
    return this.storage.get<TechniqueMastery>(K.mastery(id)) ?? { lesson: false, guided: 0, drill: false };
  }

  setMastery(id: TechniqueId, m: TechniqueMastery): void {
    this.storage.set(K.mastery(id), m);
  }

  stage(id: TechniqueId): "new" | "learning" | "drill-ready" | "mastered" {
    const m = this.mastery(id);
    if (m.drill) return "mastered";
    if (m.guided >= GUIDED_TARGET) return "drill-ready";
    if (m.lesson || m.guided > 0) return "learning";
    return "new";
  }

  /* ---- adaptive difficulty ---- */

  adaptive(id: TechniqueId): AdaptiveState {
    return this.storage.get<AdaptiveState>(K.adaptive(id)) ?? freshAdaptive();
  }

  /** Record one outcome, step difficulty deterministically, persist, return new state. */
  recordOutcome(id: TechniqueId, correct: boolean): AdaptiveState {
    const next = updateAdaptive(this.adaptive(id), correct);
    this.storage.set(K.adaptive(id), next);
    return next;
  }

  /* ---- sprint runs (mastery chart data) ---- */

  runs(): SprintRun[] {
    return this.storage.get<SprintRun[]>(K.runs) ?? [];
  }

  addRun(run: SprintRun): void {
    const all = [...this.runs(), run].slice(-MAX_RUNS);
    this.storage.set(K.runs, all);
  }

  /* ---- ghost bests ---- */

  best(scope: SprintScope, durationSec: number): GhostBest | undefined {
    return this.storage.get<GhostBest>(K.best(scope, durationSec));
  }

  setBest(scope: SprintScope, durationSec: number, best: GhostBest): void {
    this.storage.set(K.best(scope, durationSec), best);
  }

  /** Any ghost recorded at all? (Enables the Beat Your Ghost tile.) */
  hasAnyGhost(): boolean {
    return this.storage.keys().some((k) => k.startsWith("ghost.v1:"));
  }

  /* ---- continue where you left off ---- */

  lastVisited(): LastVisited | undefined {
    return this.storage.get<LastVisited>(K.last);
  }

  setLastVisited(techniqueId: TechniqueId): void {
    this.storage.set(K.last, { techniqueId });
  }
}
