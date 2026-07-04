import { getCompanion } from "@loci/design-system";
import { cognitiveRadar } from "../growth.js";
import type { Spine } from "../spine.js";

/**
 * The Adventure Map — the child-facing Growth Journey (PRD 6.7). The seven
 * cognitive regions are stops on a winding trail; belts (stars) show progress,
 * the companion stands at the region explored most, and the next adventure is
 * gently highlighted. Same data as the parent radar, framed as a journey.
 */

const REGION_EMOJI: Record<string, string> = {
  Memory: "🧠",
  Maths: "🔢",
  Logic: "🧩",
  Spatial: "🔷",
  Words: "📚",
  Reading: "📖",
  Strategy: "♟️",
};

interface Stop {
  label: string;
  emoji: string;
  level: number;
  stars: number;
  explored: boolean;
}

function buildStops(spine: Spine): Stop[] {
  return cognitiveRadar(spine).map((d) => ({
    label: d.label,
    emoji: REGION_EMOJI[d.label] ?? "⭐",
    level: d.level,
    stars: Math.min(5, d.level),
    explored: d.level > 0,
  }));
}

/** Full vertical trail, all seven regions. */
export function AdventureMap({ spine }: { spine: Spine }) {
  const stops = buildStops(spine);
  const buddy = getCompanion().emoji;

  const exploredIdxs = stops.map((s, i) => (s.explored ? i : -1)).filter((i) => i >= 0);
  const companionIdx = exploredIdxs.length ? exploredIdxs[exploredIdxs.length - 1] : 0;
  let nextIdx = stops.findIndex((s) => !s.explored);
  if (nextIdx === -1) nextIdx = Math.min(companionIdx + 1, stops.length - 1);

  const VW = 320;
  const TOP = 46;
  const ROW = 88;
  const VH = TOP + (stops.length - 1) * ROW + 56;
  const xFor = (i: number) => (i % 2 === 0 ? 84 : VW - 84);
  const yFor = (i: number) => TOP + i * ROW;

  const seg = (from: number, to: number) => {
    const x0 = xFor(from), y0 = yFor(from), x1 = xFor(to), y1 = yFor(to);
    return `C ${x0} ${y0 + ROW / 2}, ${x1} ${y1 - ROW / 2}, ${x1} ${y1}`;
  };
  let fullPath = `M ${xFor(0)} ${yFor(0)}`;
  for (let i = 1; i < stops.length; i++) fullPath += " " + seg(i - 1, i);
  let donePath = `M ${xFor(0)} ${yFor(0)}`;
  for (let i = 1; i <= companionIdx; i++) donePath += " " + seg(i - 1, i);

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Your adventure map of thinking-skill regions">
      <path d={fullPath} style={{ fill: "none", stroke: "var(--parchment-2)" }} strokeWidth={14} strokeLinecap="round" />
      {companionIdx > 0 && (
        <path d={donePath} style={{ fill: "none", stroke: "var(--ember)" }} strokeWidth={6} strokeLinecap="round" strokeDasharray="2 10" />
      )}
      {stops.map((s, i) => {
        const x = xFor(i), y = yFor(i);
        const isNext = i === nextIdx && !s.explored;
        const r = 27;
        return (
          <g key={s.label}>
            {isNext && <circle cx={x} cy={y} r={r + 6} style={{ fill: "none", stroke: "var(--gold)" }} strokeWidth={3} strokeDasharray="4 5" />}
            <circle
              cx={x}
              cy={y}
              r={r}
              style={{
                fill: s.explored ? "var(--surface-raised)" : "var(--parchment-2)",
                stroke: s.explored ? "var(--ember)" : "var(--line)",
              }}
              strokeWidth={s.explored ? 3 : 2}
            />
            <text x={x} y={y + 8} fontSize={24} textAnchor="middle">{s.emoji}</text>
            {/* label to the side away from the edge */}
            <text
              x={i % 2 === 0 ? x + r + 10 : x - r - 10}
              y={y - 2}
              fontSize={13}
              fontWeight={700}
              textAnchor={i % 2 === 0 ? "start" : "end"}
              style={{ fill: "var(--ink)", fontFamily: "var(--font-body)" }}
            >
              {s.label}
            </text>
            <text
              x={i % 2 === 0 ? x + r + 10 : x - r - 10}
              y={y + 15}
              fontSize={12}
              textAnchor={i % 2 === 0 ? "start" : "end"}
              style={{ fill: "var(--ink-soft)", fontFamily: "var(--font-body)" }}
            >
              {s.explored ? "★".repeat(s.stars) + "☆".repeat(Math.max(0, 5 - s.stars)) : isNext ? "next adventure!" : "to explore"}
            </text>
            {/* companion marker */}
            {i === companionIdx && (
              <text x={x} y={y - r - 8} fontSize={26} textAnchor="middle" aria-hidden>{buddy}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Compact horizontal preview for the Hub. */
export function AdventureTrail({ spine }: { spine: Spine }) {
  const stops = buildStops(spine).slice(0, 5);
  const buddy = getCompanion().emoji;
  const exploredIdxs = stops.map((s, i) => (s.explored ? i : -1)).filter((i) => i >= 0);
  const companionIdx = exploredIdxs.length ? exploredIdxs[exploredIdxs.length - 1] : 0;

  const VW = 320, VH = 96;
  const xFor = (i: number) => 34 + i * ((VW - 68) / (stops.length - 1));
  const yFor = (i: number) => (i % 2 === 0 ? 60 : 40);
  let path = `M ${xFor(0)} ${yFor(0)}`;
  for (let i = 1; i < stops.length; i++) {
    const x0 = xFor(i - 1), x1 = xFor(i), y1 = yFor(i), y0 = yFor(i - 1);
    path += ` C ${(x0 + x1) / 2} ${y0}, ${(x0 + x1) / 2} ${y1}, ${x1} ${y1}`;
  }

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", display: "block" }} role="img" aria-label="Your adventure map">
      <path d={path} style={{ fill: "none", stroke: "var(--parchment-2)" }} strokeWidth={10} strokeLinecap="round" />
      {stops.map((s, i) => {
        const x = xFor(i), y = yFor(i);
        return (
          <g key={s.label}>
            <circle cx={x} cy={y} r={17} style={{ fill: s.explored ? "var(--surface-raised)" : "var(--parchment-2)", stroke: s.explored ? "var(--ember)" : "var(--line)" }} strokeWidth={s.explored ? 2.5 : 1.5} />
            <text x={x} y={y + 6} fontSize={16} textAnchor="middle">{s.emoji}</text>
            {i === companionIdx && <text x={x} y={y - 22} fontSize={18} textAnchor="middle" aria-hidden>{buddy}</text>}
          </g>
        );
      })}
    </svg>
  );
}
