/**
 * Tangra — perfect-maze generation (recursive backtracker) and pure helpers
 * for movement, solving, and plan-ahead scoring. A perfect maze is a spanning
 * tree over the cell grid: exactly one path between any two cells, and
 * passages = cells − 1 (unit-tested).
 */

import { type Rng, randInt } from "./rng.js";

export interface Maze {
  width: number;
  height: number;
  /** vwalls[y][x] — wall between (x,y) and (x+1,y); x in 0..width-2 */
  vwalls: boolean[][];
  /** hwalls[y][x] — wall between (x,y) and (x,y+1); y in 0..height-2 */
  hwalls: boolean[][];
}

export type Dir = "up" | "down" | "left" | "right";

export const DIRS: Record<Dir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/** Grid size for a difficulty level (1..5 → 8×8 .. 16×16). */
export function mazeSizeForLevel(level: number): number {
  return Math.max(8, Math.min(16, 6 + 2 * level));
}

export function generateMaze(width: number, height: number, rng: Rng): Maze {
  const vwalls = Array.from({ length: height }, () => Array<boolean>(width - 1).fill(true));
  const hwalls = Array.from({ length: height - 1 }, () => Array<boolean>(width).fill(true));
  const visited = Array.from({ length: height }, () => Array<boolean>(width).fill(false));

  const stack: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  visited[0][0] = true;

  while (stack.length > 0) {
    const cur = stack[stack.length - 1];
    const neighbours: { x: number; y: number; dir: Dir }[] = [];
    for (const dir of Object.keys(DIRS) as Dir[]) {
      const nx = cur.x + DIRS[dir].dx;
      const ny = cur.y + DIRS[dir].dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx]) {
        neighbours.push({ x: nx, y: ny, dir });
      }
    }
    if (neighbours.length === 0) {
      stack.pop();
      continue;
    }
    const next = neighbours[randInt(rng, neighbours.length)];
    removeWall(vwalls, hwalls, cur.x, cur.y, next.dir);
    visited[next.y][next.x] = true;
    stack.push({ x: next.x, y: next.y });
  }

  return { width, height, vwalls, hwalls };
}

function removeWall(vwalls: boolean[][], hwalls: boolean[][], x: number, y: number, dir: Dir): void {
  if (dir === "right") vwalls[y][x] = false;
  else if (dir === "left") vwalls[y][x - 1] = false;
  else if (dir === "down") hwalls[y][x] = false;
  else hwalls[y - 1][x] = false;
}

/** Can you step from (x,y) one cell in `dir`? Bounds + wall check. */
export function canMove(maze: Maze, x: number, y: number, dir: Dir): boolean {
  const nx = x + DIRS[dir].dx;
  const ny = y + DIRS[dir].dy;
  if (nx < 0 || nx >= maze.width || ny < 0 || ny >= maze.height) return false;
  if (dir === "right") return !maze.vwalls[y][x];
  if (dir === "left") return !maze.vwalls[y][x - 1];
  if (dir === "down") return !maze.hwalls[y][x];
  return !maze.hwalls[y - 1][x];
}

/** Number of open passages (removed internal walls). */
export function passageCount(maze: Maze): number {
  let open = 0;
  for (const row of maze.vwalls) for (const w of row) if (!w) open++;
  for (const row of maze.hwalls) for (const w of row) if (!w) open++;
  return open;
}

/** BFS distances from a cell; unreachable cells stay at Infinity. */
export function distancesFrom(maze: Maze, sx: number, sy: number): number[][] {
  const dist = Array.from({ length: maze.height }, () => Array<number>(maze.width).fill(Infinity));
  dist[sy][sx] = 0;
  const queue: { x: number; y: number }[] = [{ x: sx, y: sy }];
  let head = 0;
  while (head < queue.length) {
    const { x, y } = queue[head++];
    for (const dir of Object.keys(DIRS) as Dir[]) {
      if (!canMove(maze, x, y, dir)) continue;
      const nx = x + DIRS[dir].dx;
      const ny = y + DIRS[dir].dy;
      if (dist[ny][nx] === Infinity) {
        dist[ny][nx] = dist[y][x] + 1;
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return dist;
}

/** How many cells are reachable from (0,0)? (= all cells in a perfect maze) */
export function reachableCount(maze: Maze): number {
  const dist = distancesFrom(maze, 0, 0);
  let n = 0;
  for (const row of dist) for (const d of row) if (d !== Infinity) n++;
  return n;
}

/** The unique shortest path between two cells (BFS parent walk). */
export function solve(
  maze: Maze,
  sx: number,
  sy: number,
  gx: number,
  gy: number
): { x: number; y: number }[] {
  const dist = distancesFrom(maze, gx, gy);
  const path: { x: number; y: number }[] = [{ x: sx, y: sy }];
  let cx = sx;
  let cy = sy;
  while (cx !== gx || cy !== gy) {
    let stepped = false;
    for (const dir of Object.keys(DIRS) as Dir[]) {
      if (!canMove(maze, cx, cy, dir)) continue;
      const nx = cx + DIRS[dir].dx;
      const ny = cy + DIRS[dir].dy;
      if (dist[ny][nx] === dist[cy][cx] - 1) {
        cx = nx;
        cy = ny;
        path.push({ x: cx, y: cy });
        stepped = true;
        break;
      }
    }
    if (!stepped) break; // unreachable goal — cannot happen in a perfect maze
  }
  return path;
}

/**
 * Plan-ahead scoring: a move is a "wrong turn" when it increases the child's
 * distance to the goal. We count, we never punish — fewer detours simply
 * earns a bigger cheer.
 */
export function isWrongTurn(distToGoal: number[][], fromX: number, fromY: number, toX: number, toY: number): boolean {
  return distToGoal[toY][toX] > distToGoal[fromY][fromX];
}
