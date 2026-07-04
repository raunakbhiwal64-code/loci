/**
 * Tangra — small shared UI helpers used across the four activities: the
 * difficulty ladder, per-activity progress persisted via ctx.storage, a
 * polyomino SVG renderer, and a deterministic hint fallback.
 */

import type { ModuleContext } from "@loci/module-sdk";
import { bounds, type Shape } from "./shapes.js";

export const MAX_LEVEL = 5;

export type ActivityId = "rotation" | "maze" | "blocks" | "symmetry";

/** Persisted best level reached per activity (1..MAX_LEVEL). */
export function bestLevel(ctx: ModuleContext, id: ActivityId): number {
  const v = ctx.storage.get<number>(`best:${id}`);
  return typeof v === "number" && v >= 1 ? Math.min(MAX_LEVEL, v) : 1;
}

/** The highest level the child is allowed to pick (best + 1, capped). */
export function unlockedLevel(ctx: ModuleContext, id: ActivityId): number {
  return Math.min(MAX_LEVEL, bestLevel(ctx, id) + 1);
}

/** Record a cleared level; only ever moves the best forward. */
export function recordCleared(ctx: ModuleContext, id: ActivityId, level: number): void {
  const prev = bestLevel(ctx, id);
  if (level > prev) ctx.storage.set(`best:${id}`, Math.min(MAX_LEVEL, level));
}

export function DifficultyLadder({
  level,
  unlocked,
  onPick,
}: {
  level: number;
  unlocked: number;
  onPick: (l: number) => void;
}) {
  return (
    <div className="tg-ladder" role="group" aria-label="Choose difficulty">
      {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((l) => (
        <button
          key={l}
          aria-pressed={l === level}
          disabled={l > unlocked}
          onClick={() => onPick(l)}
        >
          {l <= unlocked ? `Level ${l}` : `🔒 ${l}`}
        </button>
      ))}
    </div>
  );
}

/** A row of stars showing best level reached for an activity tile. */
export function LevelStars({ best }: { best: number }) {
  return (
    <span className="tg-star" aria-label={`Best: level ${best}`}>
      {"★".repeat(best)}
      {"☆".repeat(Math.max(0, MAX_LEVEL - best))}
    </span>
  );
}

/**
 * Render a polyomino as filled unit squares on a light grid. `size` is the SVG
 * side in px; the shape is centred inside a square viewBox of its own bounds.
 */
export function ShapeSvg({ shape, px = 132 }: { shape: Shape; px?: number }) {
  const { w, h } = bounds(shape);
  const span = Math.max(w, h);
  const offX = (span - w) / 2;
  const offY = (span - h) / 2;
  const lines = [];
  for (let i = 0; i <= span; i++) {
    lines.push(<line key={`v${i}`} className="tg-grid-line" x1={i} y1={0} x2={i} y2={span} />);
    lines.push(<line key={`h${i}`} className="tg-grid-line" x1={0} y1={i} x2={span} y2={i} />);
  }
  return (
    <svg className="tg-svg" style={{ maxWidth: px }} viewBox={`-0.25 -0.25 ${span + 0.5} ${span + 0.5}`} role="img" aria-label="shape">
      <g>{lines}</g>
      {shape.map((c, i) => (
        <rect
          key={i}
          className="tg-shape-fill tg-shape-stroke"
          x={c.x + offX}
          y={c.y + offY}
          width={1}
          height={1}
          rx={0.08}
        />
      ))}
    </svg>
  );
}

/**
 * Ask the gateway for a gentle hint, task "tangra.hint", with a deterministic
 * local fallback so the game is fully playable with no model. Never blocks the
 * UI on failure.
 */
export async function tangraHint(
  ctx: ModuleContext,
  activity: ActivityId,
  fallback: string,
  level: number
): Promise<string> {
  try {
    const r = await ctx.ai.hint({ task: "tangra.hint", level, context: { activity } });
    const text = (r.text || "").trim();
    return text.length > 0 ? text : fallback;
  } catch {
    return fallback;
  }
}
