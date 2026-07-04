/**
 * Maze — plan a route from start to goal. Scored by how few wrong turns you
 * take (a wrong turn = a step that moves you away from the goal). We celebrate
 * efficiency; we never punish exploring.
 */

import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { mulberry32, randomSeed } from "./rng.js";
import { canMove, DIRS, type Dir, distancesFrom, generateMaze, isWrongTurn, mazeSizeForLevel } from "./maze.js";
import { DifficultyLadder, recordCleared, unlockedLevel } from "./ui.js";

export function MazeGame({ ctx, onExit }: { ctx: ModuleContext; onExit: () => void }) {
  const [level, setLevel] = useState(unlockedLevel(ctx, "maze"));
  const [seed, setSeed] = useState(() => randomSeed());
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);

  const size = mazeSizeForLevel(level);
  const maze = useMemo(() => generateMaze(size, size, mulberry32(seed)), [size, seed]);
  const goal = { x: size - 1, y: size - 1 };
  const distToGoal = useMemo(() => distancesFrom(maze, goal.x, goal.y), [maze, goal.x, goal.y]);

  const start = (l: number) => {
    setLevel(l);
    setSeed(randomSeed());
    setPos({ x: 0, y: 0 });
    setWrong(0);
    setDone(false);
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "tangra", skills: ["spatial-visualisation"], difficulty: l });
  };

  const move = (dir: Dir) => {
    if (done || !canMove(maze, pos.x, pos.y, dir)) return;
    const nx = pos.x + DIRS[dir].dx;
    const ny = pos.y + DIRS[dir].dy;
    if (isWrongTurn(distToGoal, pos.x, pos.y, nx, ny)) setWrong((w) => w + 1);
    setPos({ x: nx, y: ny });
    if (nx === goal.x && ny === goal.y) finish();
  };

  const finish = () => {
    const cleared = wrong <= size; // generous
    if (cleared) recordCleared(ctx, "maze", level);
    ctx.progression.award("spatial-visualisation", 14);
    if (wrong === 0) ctx.progression.award("metacognition", 6);
    ctx.analytics.emit({ kind: "activity", action: "completed", moduleId: "tangra", skills: ["spatial-visualisation"], difficulty: level, success: wrong === 0 ? 1 : 0.6 });
    setDone(true);
  };

  const px = Math.min(340, size * 30);
  const cell = px / size;

  if (done) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">{wrong === 0 ? "🏆" : "🌟"}</div>
          <Display as="h3">{wrong === 0 ? "Perfect path!" : `You made it — ${wrong} wrong turn${wrong === 1 ? "" : "s"}`}</Display>
          <p className="ds-muted">Planning the route in your head before you move is the real skill.</p>
          <div className="row wrap" style={{ justifyContent: "center" }}>
            <Button big onClick={() => start(level)}>Play again</Button>
            {level < 5 && wrong <= size && <Button variant="ghost" big onClick={() => start(level + 1)}>Next level →</Button>}
            <Button variant="ghost" onClick={onExit}>Back to Tangra</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="spread">
        <span className="pill">Maze · Level {level}</span>
        <Button variant="ghost" onClick={onExit}>← Back</Button>
      </div>
      <DifficultyLadder level={level} unlocked={unlockedLevel(ctx, "maze")} onPick={start} />
      <GuideBubble>Find the way to the ⭐. Try to picture the route first — fewer wrong turns is the win!</GuideBubble>

      <Card className="center">
        <svg viewBox={`-1 -1 ${px + 2} ${px + 2}`} style={{ width: "100%", maxWidth: px }} role="img" aria-label="maze">
          <rect x={0} y={0} width={px} height={px} fill="var(--surface-raised)" stroke="var(--ink)" strokeWidth={2} />
          {/* internal walls */}
          {maze.vwalls.map((rowArr, y) =>
            rowArr.map((w, x) =>
              w ? <line key={`v${x}-${y}`} x1={(x + 1) * cell} y1={y * cell} x2={(x + 1) * cell} y2={(y + 1) * cell} stroke="var(--ink)" strokeWidth={2} /> : null
            )
          )}
          {maze.hwalls.map((rowArr, y) =>
            rowArr.map((w, x) =>
              w ? <line key={`h${x}-${y}`} x1={x * cell} y1={(y + 1) * cell} x2={(x + 1) * cell} y2={(y + 1) * cell} stroke="var(--ink)" strokeWidth={2} /> : null
            )
          )}
          {/* goal */}
          <text x={(goal.x + 0.5) * cell} y={(goal.y + 0.72) * cell} fontSize={cell * 0.7} textAnchor="middle">⭐</text>
          {/* player */}
          <circle cx={(pos.x + 0.5) * cell} cy={(pos.y + 0.5) * cell} r={cell * 0.3} fill="var(--accent)" />
        </svg>
      </Card>

      <div className="center stack" style={{ gap: 6 }}>
        <Button variant="ghost" onClick={() => move("up")}>▲</Button>
        <div className="row" style={{ justifyContent: "center", gap: 6 }}>
          <Button variant="ghost" onClick={() => move("left")}>◀</Button>
          <Button variant="ghost" onClick={() => move("down")}>▼</Button>
          <Button variant="ghost" onClick={() => move("right")}>▶</Button>
        </div>
      </div>
    </div>
  );
}
