import React from "react";
import { createRoot } from "react-dom/client";
import type { LociModule } from "@loci/module-sdk";
import { FocusReadApp } from "./FocusReadApp.js";

export { PASSAGES } from "./passages.js";

/**
 * FocusRead — reading comprehension and attention practice (PRD 4.7).
 * Levelled passages, find-the-detail, story-order, and listen mode. Framed
 * strictly as joyful reading practice; never clinical language.
 */
export const focusread: LociModule = {
  id: "focusread",
  displayName: "FocusRead",
  accentToken: "--accent-focusread",
  skillsAwarded: ["reading-comprehension", "sustained-attention", "working-memory", "metacognition"],
  mount(container, ctx) {
    const root = createRoot(container);
    root.render(React.createElement(FocusReadApp, { ctx }));
    return () => root.unmount();
  },
};
