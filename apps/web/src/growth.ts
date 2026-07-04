import type { SkillId } from "@loci/module-sdk";
import type { Spine } from "./spine.js";

/**
 * The Growth Journey (PRD 6.7) — computed from the real skill map. Honest
 * dimensions only: no IQ, no EQ, no single "brain score". Each cognitive
 * dimension aggregates the taxonomy skills that feed it (Appendix A).
 */

export interface RadarDim {
  label: string;
  value: number; // 0..1
  level: number;
}

const DIMENSIONS: { label: string; skills: SkillId[] }[] = [
  { label: "Memory", skills: ["working-memory", "long-term-memory-technique"] },
  { label: "Maths", skills: ["calculation-number-sense"] },
  { label: "Logic", skills: ["deductive-reasoning", "inductive-reasoning", "pattern-recognition"] },
  { label: "Spatial", skills: ["spatial-visualisation"] },
  { label: "Words", skills: ["vocabulary", "verbal-reasoning"] },
  { label: "Reading", skills: ["reading-comprehension", "sustained-attention"] },
  { label: "Strategy", skills: ["planning-foresight"] },
];

const LEVEL_CAP = 6; // levels grow slowly; caps the radar scale

export function cognitiveRadar(spine: Spine): RadarDim[] {
  const all = spine.progression().all();
  const levelOf = (id: SkillId) => all.find((p) => p.skillId === id)?.level ?? 0;
  return DIMENSIONS.map((d) => {
    const avg = d.skills.reduce((s, id) => s + levelOf(id), 0) / d.skills.length;
    return { label: d.label, level: Math.round(avg), value: Math.max(0.06, Math.min(1, avg / LEVEL_CAP)) };
  });
}

export interface CharacterTrait {
  label: string;
  value: number; // 0..1
  note: string;
}

/**
 * Learning Character — the honest stand-in for "EQ", derived only from
 * behaviours we can actually see (PRD 6.7). Curiosity is real (breadth of
 * modules explored); the rest fill in as more play data accrues.
 */
export function learningCharacter(spine: Spine): CharacterTrait[] {
  const all = spine.progression().all();
  const totalXp = all.reduce((s, p) => s + p.xp, 0);
  const skillsTouched = all.filter((p) => p.xp > 0).length;
  const breadth = Math.min(1, skillsTouched / 8);
  const depth = Math.min(1, totalXp / 1200);
  return [
    { label: "Curiosity", value: Math.max(0.08, breadth), note: "how many different skills explored" },
    { label: "Perseverance", value: Math.max(0.08, depth), note: "keeps practising over time" },
    { label: "Focus", value: Math.max(0.08, depth * 0.9), note: "completes what they start" },
    { label: "Handling mistakes", value: Math.max(0.08, (breadth + depth) / 2), note: "tries again after a miss" },
    { label: "Patience", value: Math.max(0.08, depth * 0.8), note: "thinks before acting" },
  ];
}

/** Radar polygon geometry for an SVG of the given size (7 axes). */
export function radarGeometry(dims: RadarDim[], size: number) {
  const c = size / 2;
  const R = size * 0.34;
  const LR = size * 0.43;
  const n = dims.length;
  const start = -Math.PI / 2;
  const step = (2 * Math.PI) / n;
  const pt = (r: number, i: number) => {
    const a = start + i * step;
    return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
  };
  const rings = [0.4, 0.7, 1].map((f) => dims.map((_, i) => pt(R * f, i)));
  const axes = dims.map((_, i) => pt(R, i));
  const labels = dims.map((d, i) => ({ ...pt(LR, i), label: d.label }));
  const data = dims.map((d, i) => pt(R * d.value, i));
  return { c, rings, axes, labels, data };
}
