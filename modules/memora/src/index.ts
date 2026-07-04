import React from "react";
import { createRoot } from "react-dom/client";
import type { LociModule } from "@loci/module-sdk";
import { MemoraApp } from "./MemoraApp.js";

export { PALACES, DEFAULT_LIST } from "./palaces.js";

/**
 * Memora — the flagship memory module (PRD 4.1), refactored onto the shared
 * spine: shared profile, skill map, design components, the Guide, and the SRS
 * engine. It no longer owns its own account, look, or progression logic.
 */
export const memora: LociModule = {
  id: "memora",
  displayName: "Memora",
  accentToken: "--accent-memora",
  skillsAwarded: ["long-term-memory-technique", "working-memory"],
  contributesToDaily: true,
  mount(container, ctx) {
    const root = createRoot(container);
    root.render(React.createElement(MemoraApp, { ctx }));
    return () => root.unmount();
  },
};
