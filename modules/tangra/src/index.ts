import React from "react";
import { createRoot } from "react-dom/client";
import type { LociModule } from "@loci/module-sdk";
import { TangraApp } from "./TangraApp.js";

/**
 * Tangra — spatial reasoning (PRD 4.5). Rotation match, mazes, block-count and
 * symmetry draw. Deterministic geometry, minimal AI — the economy module.
 */
export const tangra: LociModule = {
  id: "tangra",
  displayName: "Tangra",
  accentToken: "--accent-tangra",
  skillsAwarded: ["spatial-visualisation", "metacognition"],
  mount(container, ctx) {
    const root = createRoot(container);
    root.render(React.createElement(TangraApp, { ctx }));
    return () => root.unmount();
  },
};
