import React from "react";
import { createRoot } from "react-dom/client";
import type { LociModule } from "@loci/module-sdk";
import { AbacusApp } from "./AbacusApp.js";

export { TECHNIQUES, TRACKS, mulberry32, techniqueById } from "./techniques.js";

/**
 * Abacus — mental math and Vedic techniques (PRD 4.3) on the shared spine:
 * Technique Dojo (tracks 1–3), Sprint, Beat Your Ghost, adaptive difficulty,
 * SRS mixed review, and the per-technique mastery chart.
 */
export const abacus: LociModule = {
  id: "abacus",
  displayName: "Abacus",
  accentToken: "--accent-abacus",
  skillsAwarded: ["calculation-number-sense", "sustained-attention", "metacognition"],
  mount(container, ctx) {
    const root = createRoot(container);
    root.render(React.createElement(AbacusApp, { ctx }));
    return () => root.unmount();
  },
};
