import React from "react";
import { createRoot } from "react-dom/client";
import type { LociModule } from "@loci/module-sdk";
import { CortexApp } from "./CortexApp.js";

/**
 * Cortex — logic and reasoning (PRD 4.4). Logic grids, number sequences,
 * odd-one-out-with-reason, and Sudoku. Every puzzle is generator+solver
 * validated; the graduated hint ladder never skips to the answer.
 */
export const cortex: LociModule = {
  id: "cortex",
  displayName: "Cortex",
  accentToken: "--accent-cortex",
  skillsAwarded: ["deductive-reasoning", "inductive-reasoning", "pattern-recognition", "metacognition"],
  mount(container, ctx) {
    const root = createRoot(container);
    root.render(React.createElement(CortexApp, { ctx }));
    return () => root.unmount();
  },
};
