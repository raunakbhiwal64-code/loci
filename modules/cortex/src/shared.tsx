import { useState } from "react";
import { Button, GuideBubble } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import type { Hint } from "./hints.js";
import { phraseHint } from "./hints.js";

/**
 * Shared hint-ladder controller for every Cortex player. Each puzzle type
 * supplies a `getHint(level)` that returns a deterministic Hint from its own
 * engine (gridHint / sequenceHint / sudokuHint / oddHint). We climb levels 1→3,
 * warm the wording via ctx.ai.hint ("cortex.hint") with the deterministic text
 * as the always-ready fallback, and track whether the child stayed hint-free.
 */
export interface HintLadder {
  /** Currently shown, already phrased hint text (empty until first ask). */
  text: string;
  /** How many hints have been asked for this puzzle. */
  used: number;
  /** True until the child asks for the first hint. */
  hintFree: boolean;
  /** True once level 3 (the give-one-away step) has been shown. */
  atLast: boolean;
  ask(): Promise<void>;
  reset(): void;
}

export function useHintLadder(
  ctx: ModuleContext,
  getHint: (level: number) => Hint,
  anchorsFor?: (h: Hint) => string[]
): HintLadder {
  const [text, setText] = useState("");
  const [level, setLevel] = useState(0); // 0 = none asked yet
  const [used, setUsed] = useState(0);

  const ask = async () => {
    const next = Math.min(3, level + 1);
    setLevel(next);
    setUsed((u) => u + 1);
    const hint = getHint(next);
    setText("…");
    const anchors = anchorsFor ? anchorsFor(hint) : [];
    const phrased = await phraseHint(ctx, hint, anchors);
    setText(phrased);
  };

  const reset = () => {
    setText("");
    setLevel(0);
    setUsed(0);
  };

  return { text, used, hintFree: used === 0, atLast: level >= 3, ask, reset };
}

/** The hint bubble + "Give me a hint" button, shared by all players. */
export function HintPanel({ ladder }: { ladder: HintLadder }) {
  return (
    <div className="stack">
      {ladder.text ? <GuideBubble>{ladder.text}</GuideBubble> : null}
      <Button variant="ghost" onClick={() => void ladder.ask()} disabled={ladder.atLast && !!ladder.text}>
        {ladder.used === 0 ? "Give me a hint 🦉" : ladder.atLast ? "That's all the hints I've got!" : "A bigger hint, please"}
      </Button>
    </div>
  );
}

/** Small back-to-menu crumb used at the top of every player. */
export function PlayerTop({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="crumbs">
      <Button variant="ghost" onClick={onBack}>
        ← Back
      </Button>
      <strong>{title}</strong>
    </div>
  );
}
