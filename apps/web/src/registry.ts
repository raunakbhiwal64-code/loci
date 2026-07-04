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
    blurb: "Memory palaces, story chains and number tricks.",
    accentToken: "--accent-memora",
    load: () => import("@loci/memora").then((m) => m.memora),
  },
  {
    id: "gambit",
    displayName: "Gambit",
    emoji: "♟️",
    blurb: "Chess: tactics, checkmates and thinking ahead.",
    accentToken: "--accent-gambit",
    load: () => import("@loci/gambit").then((m) => m.gambit),
  },
  {
    id: "abacus",
    displayName: "Abacus",
    emoji: "🧮",
    blurb: "Mental-math tricks and speed sprints.",
    accentToken: "--accent-abacus",
    load: () => import("@loci/abacus").then((m) => m.abacus),
  },
  {
    id: "cortex",
    displayName: "Cortex",
    emoji: "🧩",
    blurb: "Logic puzzles: deduce, spot patterns, crack codes.",
    accentToken: "--accent-cortex",
    load: () => import("@loci/cortex").then((m) => m.cortex),
  },
  {
    id: "tangra",
    displayName: "Tangra",
    emoji: "🔷",
    blurb: "Shapes, rotations, mazes and mirror drawings.",
    accentToken: "--accent-tangra",
    load: () => import("@loci/tangra").then((m) => m.tangra),
  },
  {
    id: "lexicon",
    displayName: "Lexicon",
    emoji: "📚",
    blurb: "Collect brilliant words and win with them.",
    accentToken: "--accent-lexicon",
    load: () => import("@loci/lexicon").then((m) => m.lexicon),
  },
  {
    id: "focusread",
    displayName: "FocusRead",
    emoji: "📖",
    blurb: "Read closely, find the details, follow the story.",
    accentToken: "--accent-focusread",
    load: () => import("@loci/focusread").then((m) => m.focusread),
  },
];

export function findModule(id: string): ModuleEntry | undefined {
  return MODULES.find((m) => m.id === id);
}
