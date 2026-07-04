import type { LociModule } from "@loci/module-sdk";

/**
 * Module registry. Each module is lazy-loaded on entry (PRD 5.9 performance
 * budget) via dynamic import, so its code ships as a separate cached chunk and
 * never weighs down the Hub shell.
 */
export interface ModuleEntry {
  id: string;
  displayName: string;
  emoji: string;
  blurb: string;
  accentToken: string;
  load: () => Promise<LociModule>;
}

export const MODULES: ModuleEntry[] = [
  {
    id: "memora",
    displayName: "Memora",
    emoji: "🧠",
    blurb: "Build a memory palace and remember anything.",
    accentToken: "--accent-memora",
    load: () => import("@loci/memora").then((m) => m.memora),
  },
  {
    id: "placeholder",
    displayName: "Sparks",
    emoji: "✨",
    blurb: "A tiny demo module — proof a new module drops onto the spine.",
    accentToken: "--accent-placeholder",
    load: () => import("@loci/placeholder").then((m) => m.placeholder),
  },
];

export function findModule(id: string): ModuleEntry | undefined {
  return MODULES.find((m) => m.id === id);
}
