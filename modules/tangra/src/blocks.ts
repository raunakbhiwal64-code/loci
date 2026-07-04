/**
 * Tangra — Block Count (hidden cubes). A puzzle is a height-map: heights[row][col]
 * cubes stacked on each grid cell, drawn isometrically. The child counts ALL
 * cubes, including the hidden supporting ones — the classic distractor is the
 * visible-only count, which we deliberately offer as a wrong choice.
 * Everything here is pure and deterministic.
 */

import { type Rng, randInt } from "./rng.js";

export interface BlockPuzzle {
  /** heights[row][col]; row 0 is the back, col 0 is the left. */
  heights: number[][];
  /** The true answer: every cube, hidden supporters included. */
  total: number;
  /** Cubes with at least one exposed face from the iso viewpoint. */
  visible: number;
  /** Answer choices, ascending; exactly one equals `total`. */
  choices: number[];
  answerIndex: number;
}

export function totalCubes(heights: number[][]): number {
  let n = 0;
  for (const row of heights) for (const h of row) n += h;
  return n;
}

/**
 * A cube at (r, c, z) is visible when its top, front, or right face is
 * exposed (viewer floats front-right-above, the standard iso view):
 *  - top:   z is the top of its stack
 *  - front: no stack at row r+1 reaches height z+1
 *  - right: no stack at col c+1 reaches height z+1
 */
export function visibleCubes(heights: number[][]): number {
  const rows = heights.length;
  const cols = heights[0].length;
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      for (let z = 0; z < heights[r][c]; z++) {
        const top = z === heights[r][c] - 1;
        const front = r + 1 >= rows || heights[r + 1][c] <= z;
        const right = c + 1 >= cols || heights[r][c + 1] <= z;
        if (top || front || right) n++;
      }
    }
  }
  return n;
}

/** Hidden supporters = total − visible. */
export function hiddenCubes(heights: number[][]): number {
  return totalCubes(heights) - visibleCubes(heights);
}

/** Grid dimension and max stack height for a difficulty level (1..5). */
export function blockDimsForLevel(level: number): { dim: number; maxH: number } {
  const dim = level <= 1 ? 2 : level <= 3 ? 3 : 4;
  const maxH = Math.max(2, Math.min(5, 1 + level));
  return { dim, maxH };
}

function randomHeights(dim: number, maxH: number, rng: Rng): number[][] {
  // Bias the back rows taller so front stacks genuinely hide cubes.
  return Array.from({ length: dim }, (_, r) =>
    Array.from({ length: dim }, () => {
      const bias = r < dim / 2 ? 1 : 0;
      return Math.min(maxH, 1 + randInt(rng, maxH) + bias * (randInt(rng, 2) as 0 | 1));
    })
  );
}

export function generateBlockPuzzle(level: number, rng: Rng): BlockPuzzle {
  const { dim, maxH } = blockDimsForLevel(level);

  let heights = randomHeights(dim, maxH, rng);
  // From level 2 up, insist the build actually hides at least one cube —
  // that's the lesson. Regenerate (bounded) until it does.
  if (level >= 2) {
    for (let attempt = 0; attempt < 60 && hiddenCubes(heights) < 1; attempt++) {
      heights = randomHeights(dim, maxH, rng);
    }
    if (hiddenCubes(heights) < 1) {
      // Deterministic fallback: a tall back-left stack hidden behind fronts.
      heights[0][0] = maxH;
      for (let r = 1; r < dim; r++) heights[r][0] = Math.max(heights[r][0], 2);
    }
  }

  const total = totalCubes(heights);
  const visible = visibleCubes(heights);

  const choices = new Set<number>([total]);
  if (visible !== total) choices.add(visible); // the classic trap
  let wobble = 1;
  while (choices.size < 4) {
    if (total - wobble > 0) choices.add(total - wobble);
    if (choices.size < 4) choices.add(total + wobble);
    wobble++;
  }
  const sorted = [...choices].sort((a, b) => a - b).slice(0, 4);
  if (!sorted.includes(total)) sorted[sorted.length - 1] = total; // safety net
  sorted.sort((a, b) => a - b);

  return { heights, total, visible, choices: sorted, answerIndex: sorted.indexOf(total) };
}

/* ------------------------------------------------------------------ *
 * Isometric projection helpers (pure math; the SVG lives in the UI)
 * ------------------------------------------------------------------ */

export interface IsoFace {
  points: string; // SVG polygon points
  face: "top" | "left" | "right";
}

const TILE_W = 46; // full diamond width
const TILE_H = 23; // full diamond height
const CUBE_H = 26; // vertical rise per cube

/** Screen-space origin-relative position of a cube's top-front vertex. */
function isoPoint(r: number, c: number, z: number): { x: number; y: number } {
  return {
    x: ((c - r) * TILE_W) / 2,
    y: ((c + r) * TILE_H) / 2 - z * CUBE_H,
  };
}

/** The three visible faces of one cube, as SVG polygon point strings. */
export function cubeFaces(r: number, c: number, z: number): IsoFace[] {
  const p = isoPoint(r, c, z);
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const top = [
    `${p.x},${p.y - CUBE_H}`,
    `${p.x + hw},${p.y - CUBE_H + hh}`,
    `${p.x},${p.y - CUBE_H + 2 * hh}`,
    `${p.x - hw},${p.y - CUBE_H + hh}`,
  ].join(" ");
  const left = [
    `${p.x - hw},${p.y - CUBE_H + hh}`,
    `${p.x},${p.y - CUBE_H + 2 * hh}`,
    `${p.x},${p.y + 2 * hh}`,
    `${p.x - hw},${p.y + hh}`,
  ].join(" ");
  const right = [
    `${p.x + hw},${p.y - CUBE_H + hh}`,
    `${p.x},${p.y - CUBE_H + 2 * hh}`,
    `${p.x},${p.y + 2 * hh}`,
    `${p.x + hw},${p.y + hh}`,
  ].join(" ");
  return [
    { points: left, face: "left" },
    { points: right, face: "right" },
    { points: top, face: "top" },
  ];
}

/** ViewBox that fits a dim×dim stack of height maxH, plus padding. */
export function isoViewBox(dim: number, maxH: number): string {
  const minX = -(dim * TILE_W) / 2 - 8;
  const width = dim * TILE_W + 16;
  const minY = -maxH * CUBE_H - 8;
  const height = dim * TILE_H + maxH * CUBE_H + CUBE_H + 16;
  return `${minX} ${minY} ${width} ${height}`;
}

/** Paint order for correct overlap: back-to-front, bottom-to-top. */
export function paintOrder(heights: number[][]): { r: number; c: number; z: number }[] {
  const out: { r: number; c: number; z: number }[] = [];
  const rows = heights.length;
  const cols = heights[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      for (let z = 0; z < heights[r][c]; z++) out.push({ r, c, z });
    }
  }
  // Cubes further back (smaller r+c) and lower (smaller z) first.
  out.sort((a, b) => a.r + a.c - (b.r + b.c) || a.z - b.z);
  return out;
}
