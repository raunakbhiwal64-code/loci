import React from "react";
import { createRoot } from "react-dom/client";
import type { LociModule } from "@loci/module-sdk";
import { LexiconApp } from "./LexiconApp.js";

export { PACKS, PACK_8_9, PACK_10_12, packFor, findWord } from "./words.js";
export type { WordEntry, WordPack } from "./words.js";
export { ANALOGIES } from "./analogies.js";
export type { Analogy, RelationType } from "./analogies.js";
export { ODD_ONE_OUT } from "./oddoneout.js";
export type { OddOneOutItem } from "./oddoneout.js";

/**
 * Lexicon — vocabulary and verbal reasoning (PRD 4.6) on the shared spine.
 * Words are met in context first (micro-stories), mastered words become
 * collectible cards, and the collection schedules onto the shared SRS.
 * Analogy Builder and odd-one-out-with-reason train verbal reasoning.
 */
export const lexicon: LociModule = {
  id: "lexicon",
  displayName: "Lexicon",
  accentToken: "--accent-lexicon",
  skillsAwarded: ["vocabulary", "verbal-reasoning"],
  mount(container, ctx) {
    const root = createRoot(container);
    root.render(React.createElement(LexiconApp, { ctx }));
    return () => root.unmount();
  },
};
