import type { LociModule } from "@loci/module-sdk";

/** Gambit — scaffold; implementation lands in this package. */
export const gambit: LociModule = {
  id: "gambit",
  displayName: "Gambit",
  accentToken: "--accent-gambit",
  skillsAwarded: ["planning-foresight", "pattern-recognition", "metacognition"],
  contributesToDaily: true,
  mount(container) {
    container.innerHTML = '<div class="ds-card" style="text-align:center;padding:32px"><div style="font-size:44px">♟️</div><h3 class="ds-display">Gambit is on its way!</h3><p class="ds-muted">This module is being crafted. Check back soon.</p></div>';
  },
};
