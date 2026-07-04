import type { ModuleContext } from "@loci/module-sdk";

/**
 * A hint on the graduated ladder (PRD 4.4). Levels never skip to the answer:
 *   1 — point at a relevant clue / row to look at
 *   2 — narrow the options ("it can't be Maya…")
 *   3 — show the single next step (the only level allowed to give one away)
 * `givesAnswer` is true only when the text states a positive conclusion,
 * which by construction can only happen at level 3.
 */
export interface Hint {
  level: number;
  text: string;
  givesAnswer: boolean;
}

/**
 * Ask the AI gateway to re-phrase a deterministic hint ("cortex.hint").
 * The solver's fact is the source of truth; the model only warms the wording.
 * We accept the model text only when it clearly carries the solver's content
 * (any anchor token present) — otherwise we keep our deterministic phrasing.
 */
export async function phraseHint(ctx: ModuleContext, hint: Hint, anchors: string[]): Promise<string> {
  try {
    const r = await ctx.ai.hint({
      task: "cortex.hint",
      level: hint.level,
      context: { step: hint.text },
    });
    if (!r.filtered && r.text && anchorsPresent(r.text, anchors)) return r.text;
  } catch {
    /* offline or gateway error — deterministic text is always ready */
  }
  return hint.text;
}

/**
 * Ask the AI gateway to re-phrase a solver-trace explanation ("cortex.explain").
 * Same rule: deterministic text is the fallback and the verification anchor.
 */
export async function phraseExplain(
  ctx: ModuleContext,
  fallback: string,
  anchors: string[]
): Promise<string> {
  try {
    const r = await ctx.ai.explain({ task: "cortex.explain", context: { step: fallback } });
    if (!r.filtered && r.text && anchorsPresent(r.text, anchors)) return r.text;
  } catch {
    /* fall through to deterministic text */
  }
  return fallback;
}

function anchorsPresent(text: string, anchors: string[]): boolean {
  if (anchors.length === 0) return true;
  const lower = text.toLowerCase();
  return anchors.some((a) => lower.includes(a.toLowerCase()));
}
