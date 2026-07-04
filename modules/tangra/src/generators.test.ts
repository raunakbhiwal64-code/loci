import { describe, expect, it } from "vitest";
import { mulberry32 } from "./rng.js";
import {
  generateRotationPuzzle,
  isChiral,
  mirror,
  randomChiralPolyomino,
  randomPolyomino,
  rotate90,
  rotationKey,
  rotationSizeForLevel,
  sameUnderRotation,
  shapeKey,
} from "./shapes.js";
import { generateMaze, mazeSizeForLevel, passageCount, reachableCount, solve, distancesFrom } from "./maze.js";
import { generateBlockPuzzle, hiddenCubes, totalCubes, visibleCubes } from "./blocks.js";
import { cellId, generateSymmetryPuzzle, isSolved, mirrorCell } from "./symmetry.js";

const SEEDS = [1, 7, 42, 1234, 987654];

describe("shapes — symmetry group", () => {
  it("rotating four times returns the original shape", () => {
    const rng = mulberry32(3);
    for (let size = 4; size <= 8; size++) {
      const s = randomPolyomino(size, rng);
      const back = rotate90(rotate90(rotate90(rotate90(s))));
      expect(shapeKey(back)).toBe(shapeKey(s));
    }
  });

  it("mirroring twice returns the original shape", () => {
    const rng = mulberry32(11);
    const s = randomPolyomino(6, rng);
    expect(shapeKey(mirror(mirror(s)))).toBe(shapeKey(s));
  });

  it("a rotated shape shares the base's rotation class", () => {
    const rng = mulberry32(5);
    const s = randomPolyomino(5, rng);
    expect(sameUnderRotation(s, rotate90(s))).toBe(true);
  });

  it("randomChiralPolyomino always yields a chiral shape of the right size", () => {
    for (const seed of SEEDS) {
      const rng = mulberry32(seed);
      for (let size = 4; size <= 8; size++) {
        const s = randomChiralPolyomino(size, rng);
        expect(s.length).toBe(size);
        expect(isChiral(s)).toBe(true);
        // Chiral means its mirror is NOT any rotation of it.
        expect(sameUnderRotation(s, mirror(s))).toBe(false);
      }
    }
  });

  it("random polyominoes are connected", () => {
    for (const seed of SEEDS) {
      const rng = mulberry32(seed);
      const s = randomPolyomino(8, rng);
      const set = new Set(s.map((c) => `${c.x},${c.y}`));
      const queue = [s[0]];
      const seen = new Set([`${s[0].x},${s[0].y}`]);
      while (queue.length) {
        const c = queue.pop()!;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const k = `${c.x + dx},${c.y + dy}`;
          if (set.has(k) && !seen.has(k)) {
            seen.add(k);
            queue.push({ x: c.x + dx, y: c.y + dy });
          }
        }
      }
      expect(seen.size).toBe(s.length);
    }
  });
});

describe("shapes — rotation-match puzzles", () => {
  it("correct candidate is a rotation; distractors are not; all pairwise distinct under rotation", () => {
    for (const seed of SEEDS) {
      const rng = mulberry32(seed);
      for (let level = 1; level <= 5; level++) {
        const p = generateRotationPuzzle(level, rng);
        expect(p.candidates).toHaveLength(4);
        expect(p.base.length).toBe(rotationSizeForLevel(level));

        const baseKey = rotationKey(p.base);
        const correct = p.candidates[p.correctIndex];
        expect(correct.kind).toBe("rotation");
        expect(rotationKey(correct.shape)).toBe(baseKey);

        p.candidates.forEach((cand, i) => {
          if (i === p.correctIndex) return;
          // Every distractor must NOT be the same shape merely turned.
          expect(rotationKey(cand.shape)).not.toBe(baseKey);
        });

        // No two candidates may be rotations of one another (would make the
        // round ambiguous or reveal duplicates).
        const keys = p.candidates.map((c) => rotationKey(c.shape));
        expect(new Set(keys).size).toBe(keys.length);

        // The mirror distractor really is the mirror class of the base.
        const mirrorCand = p.candidates.find((c) => c.kind === "mirror")!;
        expect(rotationKey(mirrorCand.shape)).toBe(rotationKey(mirror(p.base)));
      }
    }
  });

  it("every candidate has the same cell count as the base", () => {
    const rng = mulberry32(99);
    for (let level = 1; level <= 5; level++) {
      const p = generateRotationPuzzle(level, rng);
      for (const cand of p.candidates) expect(cand.shape.length).toBe(p.base.length);
    }
  });
});

describe("maze — perfect mazes", () => {
  it("spanning-tree property: passages = cells − 1, every cell reachable", () => {
    for (const seed of SEEDS) {
      const rng = mulberry32(seed);
      for (let level = 1; level <= 5; level++) {
        const size = mazeSizeForLevel(level);
        const maze = generateMaze(size, size, rng);
        const cells = size * size;
        expect(passageCount(maze)).toBe(cells - 1);
        expect(reachableCount(maze)).toBe(cells);
      }
    }
  });

  it("solve() finds a wall-respecting path from entrance to exit", () => {
    const rng = mulberry32(21);
    const maze = generateMaze(10, 10, rng);
    const path = solve(maze, 0, 0, 9, 9);
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 9, y: 9 });
    // Each step moves exactly one cell and distances decrease monotonically.
    const dist = distancesFrom(maze, 9, 9);
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1];
      const b = path[i];
      expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
      expect(dist[b.y][b.x]).toBe(dist[a.y][a.x] - 1);
    }
    expect(path.length).toBe(dist[0][0] + 1);
  });
});

describe("blocks — hidden-cube counts", () => {
  it("the answer always equals the height-map sum", () => {
    for (const seed of SEEDS) {
      const rng = mulberry32(seed);
      for (let level = 1; level <= 5; level++) {
        const p = generateBlockPuzzle(level, rng);
        expect(p.total).toBe(totalCubes(p.heights));
        expect(p.choices[p.answerIndex]).toBe(p.total);
        expect(p.choices.filter((c) => c === p.total)).toHaveLength(1);
        expect(new Set(p.choices).size).toBe(p.choices.length);
        expect(p.visible).toBe(visibleCubes(p.heights));
        expect(p.visible).toBeLessThanOrEqual(p.total);
      }
    }
  });

  it("from level 2 up, at least one cube is genuinely hidden", () => {
    for (const seed of SEEDS) {
      const rng = mulberry32(seed);
      for (let level = 2; level <= 5; level++) {
        const p = generateBlockPuzzle(level, rng);
        expect(hiddenCubes(p.heights)).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("visibleCubes matches a hand-checked height-map", () => {
    // 2×2, back-left stack of 3 behind/beside stacks of 1:
    // hidden cubes are the two lower cubes of no stack… check precisely:
    const heights = [
      [3, 1],
      [1, 1],
    ];
    // Stack (0,0): z=2 top visible; z=0,1 have front (1,0) h=1 → z=1 front
    // exposed (1>… heights[1][0]=1 ≤ 1) visible; z=0 front covered (1>0? 1>0
    // means covered), right (0,1) h=1 ≤ 0? no (1>0) covered, not top → hidden.
    expect(totalCubes(heights)).toBe(6);
    expect(visibleCubes(heights)).toBe(5);
    expect(hiddenCubes(heights)).toBe(1);
  });
});

describe("symmetry — mirror targets", () => {
  it("targets are the exact mirror of the pattern, on the right half", () => {
    for (const seed of SEEDS) {
      const rng = mulberry32(seed);
      for (let level = 1; level <= 5; level++) {
        const p = generateSymmetryPuzzle(level, rng);
        expect(p.cols % 2).toBe(0);
        expect(p.target).toHaveLength(p.pattern.length);

        const patternIds = new Set(p.pattern.map(cellId));
        for (const t of p.target) {
          expect(t.x).toBeGreaterThanOrEqual(p.cols / 2); // right half only
          // Reflecting a target lands exactly on a pattern cell.
          expect(patternIds.has(cellId(mirrorCell(t, p.cols)))).toBe(true);
        }
        for (const c of p.pattern) {
          expect(c.x).toBeLessThan(p.cols / 2); // left half only
        }

        // The true mirror set solves the puzzle; a wrong set does not.
        const right = new Set(p.target.map(cellId));
        expect(isSolved(right, p.target)).toBe(true);
        const broken = new Set(right);
        broken.delete([...broken][0]);
        expect(isSolved(broken, p.target)).toBe(false);
        const extra = new Set(right);
        extra.add("999,999");
        expect(isSolved(extra, p.target)).toBe(false);
      }
    }
  });
});
