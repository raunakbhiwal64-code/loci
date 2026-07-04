/**
 * Mastery chart — problems-per-minute per technique over time (PRD 4.3's
 * parent artefact). Hand-rolled SVG, no chart libraries.
 */

import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { AbacusStore, SprintScope, SprintRun } from "./store.js";
import { TECHNIQUES, techniqueById } from "./techniques.js";

const W = 320;
const H = 150;
const PAD_L = 30;
const PAD_B = 20;
const PAD_T = 10;
const PAD_R = 8;

export function ChartScreen({ store, onExit }: { store: AbacusStore; onExit: () => void }) {
  const runs = store.runs();
  const scopesWithData = useMemo(() => {
    const seen = new Set<SprintScope>();
    runs.forEach((r) => seen.add(r.scope));
    return ["mixed" as SprintScope, ...TECHNIQUES.map((t) => t.id as SprintScope)].filter((s) => seen.has(s));
  }, [runs]);

  const [scope, setScope] = useState<SprintScope | undefined>(scopesWithData[0]);

  if (runs.length === 0) {
    return (
      <div className="stack">
        <Display as="h3">Mastery chart</Display>
        <Card className="center stack">
          <div className="big-emoji">📈</div>
          <p className="ds-muted">Run a sprint and your speed line starts drawing itself right here.</p>
          <Button onClick={onExit}>Back</Button>
        </Card>
      </div>
    );
  }

  const selected = scope ?? scopesWithData[0];
  const series = runs.filter((r) => r.scope === selected).slice(-20);

  return (
    <div className="stack">
      <Display as="h3">Mastery chart</Display>
      <GuideBubble>Each dot is one sprint: how many problems per minute you solved. Lines that wobble are normal — look at where they're heading.</GuideBubble>

      <div className="row wrap">
        {scopesWithData.map((s) => (
          <button
            key={s}
            className="choice"
            style={{ fontSize: "0.85rem" }}
            aria-pressed={selected === s}
            onClick={() => setScope(s)}
          >
            {s === "mixed" ? "🎒 Mixed" : `${techniqueById(s).emoji} ${techniqueById(s).name}`}
          </button>
        ))}
      </div>

      <Card>
        <PpmChart series={series} />
        <SummaryRow series={series} />
      </Card>

      <Button variant="ghost" onClick={onExit}>
        Back
      </Button>
    </div>
  );
}

function PpmChart({ series }: { series: SprintRun[] }) {
  if (series.length === 0) {
    return <p className="ds-muted">No sprints on this drill yet.</p>;
  }
  const maxPpm = Math.max(4, Math.ceil(Math.max(...series.map((r) => r.ppm)) + 1));
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const x = (i: number) => PAD_L + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const y = (ppm: number) => PAD_T + innerH - (ppm / maxPpm) * innerH;

  const points = series.map((r, i) => `${x(i).toFixed(1)},${y(r.ppm).toFixed(1)}`).join(" ");
  const gridLines = [0, 0.5, 1].map((f) => Math.round(maxPpm * f));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="problems per minute over time">
      {gridLines.map((g) => (
        <g key={g}>
          <line x1={PAD_L} y1={y(g)} x2={W - PAD_R} y2={y(g)} stroke="var(--line)" strokeWidth={1} />
          <text x={PAD_L - 6} y={y(g) + 3.5} textAnchor="end" fontSize={9} fill="var(--ink-soft)">
            {g}
          </text>
        </g>
      ))}
      {series.length > 1 ? (
        <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" />
      ) : null}
      {series.map((r, i) => (
        <circle key={i} cx={x(i)} cy={y(r.ppm)} r={3.5} fill="var(--accent)">
          <title>{`${new Date(r.at).toLocaleDateString()} — ${r.ppm.toFixed(1)} per minute, ${Math.round(r.accuracy * 100)}% accuracy`}</title>
        </circle>
      ))}
      <text x={PAD_L} y={H - 5} fontSize={9} fill="var(--ink-soft)">
        {new Date(series[0].at).toLocaleDateString()}
      </text>
      <text x={W - PAD_R} y={H - 5} fontSize={9} textAnchor="end" fill="var(--ink-soft)">
        {new Date(series[series.length - 1].at).toLocaleDateString()}
      </text>
    </svg>
  );
}

function SummaryRow({ series }: { series: SprintRun[] }) {
  if (series.length === 0) return null;
  const best = Math.max(...series.map((r) => r.ppm));
  const latest = series[series.length - 1];
  return (
    <div className="row wrap" style={{ marginTop: 8 }}>
      <span className="pill">best: {best.toFixed(1)}/min</span>
      <span className="pill">latest: {latest.ppm.toFixed(1)}/min</span>
      <span className="pill">{series.length} sprints</span>
    </div>
  );
}
