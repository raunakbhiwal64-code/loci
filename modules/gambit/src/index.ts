import { createRoot } from "react-dom/client";
import { createElement } from "react";
import type { LociModule } from "@loci/module-sdk";
import { GambitApp } from "./GambitApp.js";

export { PUZZLES, dailyPuzzle } from "./puzzles.js";
export { PERSONAS } from "./personas.js";

/**
 * Gambit — kids' chess and strategic thinking (PRD 4.2), on the shared spine.
 * Warm, non-shaming, deterministic-first: a client-side engine + a mistake
 * taxonomy power the "why was that move bad?" tutor. The AI only phrases verified
 * facts. Belts 1–5, Play the Bot, Daily Puzzle, pass-and-play, post-game review.
 */
export const gambit: LociModule = {
  id: "gambit",
  displayName: "Gambit",
  accentToken: "--accent-gambit",
  skillsAwarded: ["planning-foresight", "pattern-recognition", "metacognition"],
  contributesToDaily: true,
  mount(container, ctx) {
    const root = createRoot(container);
    root.render(createElement(GambitApp, { ctx }));
    return () => root.unmount();
  },
};
