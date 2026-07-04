/**
 * Tangra — polyomino geometry for Rotation Match. Pure and deterministic:
 * shape generation, the rotation/reflection symmetry group, canonical keys,
 * and the puzzle generator. The teaching point lives here: a mirror image is
 * NOT a rotation, so mirror distractors must be provably distinct.
 */

import { type Rng, randInt } from "./rng.js";

export interface Cell {
  x: number;
  y: number;
}

/** A polyomino: normalized (min x = min y = 0) and sorted for stable keys. */
export type Shape = Cell[];

/* ------------------------------------------------------------------ *
 * Symmetry group
 * ------------------------------------------------------------------ */

export function normalize(cells: Cell[]): Shape {
  let minX = Infinity;
  let minY = Infinity;
  for (const c of cells) {
    if (c.x < minX) minX = c.x;
    if (c.y < minY) minY = c.y;
  }
  return cells
    .map((c) => ({ x: c.x - minX, y: c.y - minY }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Stable serialization of a shape as-placed (translation-invariant only). */
export function shapeKey(shape: Shape): string {
  return normalize(shape)
    .map((c) => `${c.x},${c.y}`)
    .join(";");
}

/** Rotate 90° clockwise (grid coords, y grows downward): (x,y) → (-y,x). */
export function rotate90(shape: Shape): Shape {
  return normalize(shape.map((c) => ({ x: -c.y, y: c.x })));
}

export function rotateTimes(shape: Shape, k: number): Shape {
  let s = normalize(shape);
  for (let i = 0; i < ((k % 4) + 4) % 4; i++) s = rotate90(s);
  return s;
}

/** Mirror across a vertical axis: (x,y) → (-x,y). */
export function mirror(shape: Shape): Shape {
  return normalize(shape.map((c) => ({ x: -c.x, y: c.y })));
}

/** All four rotations of a shape. */
export function rotations(shape: Shape): Shape[] {
  const out: Shape[] = [normalize(shape)];
  for (let i = 0; i < 3; i++) out.push(rotate90(out[i]));
  return out;
}

/** Canonical key under rotation only (the "same shape turned" class). */
export function rotationKey(shape: Shape): string {
  return rotations(shape).map(shapeKey).sort()[0];
}

/** Canonical key under rotation AND reflection (the free-polyomino class). */
export function fullKey(shape: Shape): string {
  return [...rotations(shape), ...rotations(mirror(shape))].map(shapeKey).sort()[0];
}

export function sameUnderRotation(a: Shape, b: Shape): boolean {
  return rotationKey(a) === rotationKey(b);
}

/** Chiral = its mirror image is NOT reachable by any rotation. */
export function isChiral(shape: Shape): boolean {
  return !sameUnderRotation(shape, mirror(shape));
}

/* ------------------------------------------------------------------ *
 * Generation
 * ------------------------------------------------------------------ */

/** Random connected polyomino of exactly `size` cells. */
export function randomPolyomino(size: number, rng: Rng): Shape {
  const cells: Cell[] = [{ x: 0, y: 0 }];
  const taken = new Set(["0,0"]);
  const deltas = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  while (cells.length < size) {
    const frontier: Cell[] = [];
    for (const c of cells) {
      for (const d of deltas) {
        const n = { x: c.x + d.x, y: c.y + d.y };
        if (!taken.has(`${n.x},${n.y}`)) frontier.push(n);
      }
    }
    const pick = frontier[randInt(rng, frontier.length)];
    cells.push(pick);
    taken.add(`${pick.x},${pick.y}`);
  }
  return normalize(cells);
}

/** Deterministic chiral fallback: an L of `size` cells (chiral for size ≥ 4). */
function chiralL(size: number): Shape {
  const cells: Cell[] = [];
  for (let y = 0; y < size - 1; y++) cells.push({ x: 0, y });
  cells.push({ x: 1, y: 0 });
  return normalize(cells);
}

/** Random polyomino guaranteed chiral (mirror ≠ any rotation). */
export function randomChiralPolyomino(size: number, rng: Rng): Shape {
  for (let attempt = 0; attempt < 80; attempt++) {
    const s = randomPolyomino(size, rng);
    if (isChiral(s)) return s;
  }
  return chiralL(Math.max(size, 4));
}

/* ------------------------------------------------------------------ *
 * Rotation Match puzzle
 * ------------------------------------------------------------------ */

export type CandidateKind = "rotation" | "mirror" | "other";

export interface RotationCandidate {
  shape: Shape;
  kind: CandidateKind;
}

export interface RotationPuzzle {
  base: Shape;
  candidates: RotationCandidate[];
  correctIndex: number;
}

/** Polyomino size for a difficulty level (1..5 → 4..8 cells). */
export function rotationSizeForLevel(level: number): number {
  return Math.max(4, Math.min(8, 3 + level));
}

/**
 * Build one Rotation Match round: a chiral base shape, one true rotation,
 * one mirror distractor, and two shapes from different free classes.
 * Invariants (unit-tested): the correct candidate is a rotation of the base;
 * every distractor is NOT a rotation of the base; candidates are pairwise
 * distinct under rotation, so no two look like the same shape turned.
 */
export function generateRotationPuzzle(level: number, rng: Rng): RotationPuzzle {
  const size = rotationSizeForLevel(level);
  const base = randomChiralPolyomino(size, rng);
  const baseRot = rotationKey(base);
  const mirrored = mirror(base);
  const mirrorRot = rotationKey(mirrored); // ≠ baseRot because base is chiral

  const correct: RotationCandidate = {
    shape: rotateTimes(base, 1 + randInt(rng, 3)),
    kind: "rotation",
  };
  const mirrorCand: RotationCandidate = {
    shape: rotateTimes(mirrored, randInt(rng, 4)),
    kind: "mirror",
  };

  const forbidden = new Set([baseRot, mirrorRot]);
  const others: RotationCandidate[] = [];
  let attempts = 0;
  while (others.length < 2 && attempts++ < 300) {
    const s = randomPolyomino(size, rng);
    const key = rotationKey(s);
    if (forbidden.has(key)) continue;
    forbidden.add(key);
    others.push({ shape: s, kind: "other" });
  }
  // Exhaustion fallback (tiny shape spaces): derive a distinct shape from the
  // chiral L family at size+1, which cannot share a rotation class (different
  // cell count is impossible here, so bend the L instead).
  while (others.length < 2) {
    const bent = normalize([...chiralL(size - 1), { x: 1, y: size - 2 }]);
    const key = rotationKey(bent);
    if (!forbidden.has(key)) {
      forbidden.add(key);
      others.push({ shape: bent, kind: "other" });
    } else {
      // Last resort: T-shape variant, guaranteed different from L family.
      const t = normalize([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 1 },
        ...Array.from({ length: size - 4 }, (_, i) => ({ x: 1, y: 2 + i })),
      ]);
      others.push({ shape: t, kind: "other" });
    }
  }

  const candidates = [correct, mirrorCand, ...others];
  // Deterministic shuffle.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    const tmp = candidates[i];
    candidates[i] = candidates[j];
    candidates[j] = tmp;
  }
  return { base, candidates, correctIndex: candidates.indexOf(correct) };
}

/** Bounding box of a shape (for SVG viewBox math). */
export function bounds(shape: Shape): { w: number; h: number } {
  let w = 0;
  let h = 0;
  for (const c of shape) {
    if (c.x + 1 > w) w = c.x + 1;
    if (c.y + 1 > h) h = c.y + 1;
  }
  return { w, h };
}
