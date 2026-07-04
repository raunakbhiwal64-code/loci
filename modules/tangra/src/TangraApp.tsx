import { useState } from "react";
import { GuideBubble } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { RotationMatch } from "./RotationMatch.js";
import { MazeGame } from "./MazeGame.js";
import { BlockCount } from "./BlockCount.js";
import { SymmetryDraw } from "./SymmetryDraw.js";
import { bestLevel, LevelStars, type ActivityId } from "./ui.js";
import "./tangra.css";

/**
 * Tangra module home — four spatial activities, each with a difficulty ladder
 * and per-activity best-level progress. Pure geometry, minimal AI.
 */
const ACTIVITIES: { id: ActivityId; name: string; emoji: string; blurb: string }[] = [
  { id: "rotation", name: "Rotation Match", emoji: "🔄", blurb: "Which shape is the same, just turned?" },
  { id: "maze", name: "Maze", emoji: "🌀", blurb: "Plan the path with the fewest wrong turns." },
  { id: "blocks", name: "Block Count", emoji: "🧊", blurb: "Count the cubes — hidden ones too." },
  { id: "symmetry", name: "Symmetry Draw", emoji: "🦋", blurb: "Complete the mirror image." },
];

export function TangraApp({ ctx }: { ctx: ModuleContext }) {
  const [active, setActive] = useState<ActivityId | null>(null);
  const back = () => setActive(null);

  if (active === "rotation") return <RotationMatch ctx={ctx} onExit={back} />;
  if (active === "maze") return <MazeGame ctx={ctx} onExit={back} />;
  if (active === "blocks") return <BlockCount ctx={ctx} onExit={back} />;
  if (active === "symmetry") return <SymmetryDraw ctx={ctx} onExit={back} />;

  return (
    <div className="stack">
      <GuideBubble>Puzzles for your mind's eye — turning, folding, and picturing shapes. Pick one!</GuideBubble>
      <div className="tiles">
        {ACTIVITIES.map((a) => (
          <button key={a.id} className="tile" onClick={() => setActive(a.id)}>
            <span className="tile__emoji">{a.emoji}</span>
            <span className="tile__name">{a.name}</span>
            <span className="tile__blurb">{a.blurb}</span>
            <span style={{ marginTop: 6, color: "var(--gold)", letterSpacing: 1 }}>
              <LevelStars best={bestLevel(ctx, a.id)} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
