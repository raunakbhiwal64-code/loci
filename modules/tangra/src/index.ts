import type { LociModule } from "@loci/module-sdk";

/** Tangra — scaffold; implementation lands in this package. */
export const tangra: LociModule = {
  id: "tangra",
  displayName: "Tangra",
  accentToken: "--accent-tangra",
  skillsAwarded: ["spatial-visualisation", "metacognition"],
  
  mount(container) {
    container.innerHTML = '<div class="ds-card" style="text-align:center;padding:32px"><div style="font-size:44px">🔷</div><h3 class="ds-display">Tangra is on its way!</h3><p class="ds-muted">This module is being crafted. Check back soon.</p></div>';
  },
};
