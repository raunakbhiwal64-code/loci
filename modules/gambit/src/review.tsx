/**
 * Post-game review — replays the 3 biggest eval swings from the child's moves,
 * each with the deterministic taxonomy explanation (warmly phrased). Ends with
 * one good thing + one pattern to practise, scheduled on ctx.srs. Awards
 * metacognition (reflecting on your own play).
 */
import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { Chess, type Square } from "chess.js";
import { Board } from "./board/Board.js";
import { analyzeMove, severityHeadline, type FactSheet } from "./tutor.js";

/** One recorded child move: the position before it and the SAN played. */
export interface MoveRecord {
  before: string; // FEN before the child moved
  san: string;
  ply: number;
}

interface Swing {
  record: MoveRecord;
  fact: FactSheet;
  from: Square;
  to: Square;
}

/** Compute the top-N biggest eval swings from the child's own moves. */
export function biggestSwings(records: MoveRecord[], n = 3): Swing[] {
  const swings: Swing[] = records.map((record) => {
    const fact = analyzeMove(record.before, record.san, 2);
    const g = new Chess(record.before);
    const m = g.move(record.san);
    return { record, fact, from: m.from, to: m.to };
  });
  return swings
    .filter((s) => s.fact.label !== "good")
    .sort((a, b) => b.fact.lossCp - a.fact.lossCp)
    .slice(0, n);
}

export function GameReview({
  ctx,
  records,
  result,
  onDone,
}: {
  ctx: ModuleContext;
  records: MoveRecord[];
  result: string;
  onDone: () => void;
}) {
  const swings = useMemo(() => biggestSwings(records, 3), [records]);
  const [idx, setIdx] = useState(0);
  const [phrased, setPhrased] = useState<string>("");

  const current = swings[idx];

  // Ask the gateway ONLY to rephrase the verified fact sheet; fall back to the
  // deterministic sentence. The model never analyses.
  useMemo(() => {
    if (!current) return;
    setPhrased(current.fact.sentence);
    void (async () => {
      try {
        const r = await ctx.ai.review({
          task: "gambit.review",
          context: {
            label: current.fact.label,
            square: current.fact.square ?? "",
            better: current.fact.better ?? "",
          },
        });
        if (r.text) setPhrased(r.text);
      } catch {
        /* keep deterministic fallback */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, current?.record.ply]);

  const finish = () => {
    ctx.progression.award("metacognition", 12);
    // Schedule the most-common pattern to practise on the SRS.
    const worst = swings[0];
    if (worst) ctx.srs.schedule("gambit", `pattern:${worst.fact.label}`);
    ctx.analytics.emit({ kind: "progression", action: "mastery", moduleId: "gambit", skillId: "metacognition" });
    onDone();
  };

  if (swings.length === 0) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">🌟</div>
          <Display as="h3">Clean game!</Display>
          <p className="ds-muted">
            {result} — I couldn't find any big slip-ups to review. You kept your pieces safe and thought ahead. 🎉
          </p>
          <Button big onClick={finish}>
            Done
          </Button>
        </Card>
      </div>
    );
  }

  if (idx >= swings.length) {
    const worst = swings[0];
    const head = severityHeadline(worst.fact.severity);
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">🎓</div>
          <Display as="h3">What you learned</Display>
          <p>
            <strong>One thing you did well:</strong> you played {records.length} moves and finished the whole game — that
            takes focus!
          </p>
          <p>
            <strong>One pattern to practise:</strong> {head.emoji} watch out for{" "}
            <em>{labelToWords(worst.fact.label)}</em>. I've added it to your practice list so it comes back at just the
            right time.
          </p>
          <Button big onClick={finish}>
            Finish review
          </Button>
        </Card>
      </div>
    );
  }

  const g = new Chess(current.record.before);
  const flipped = g.turn() === "b";
  const head = severityHeadline(current.fact.severity);

  return (
    <div className="stack">
      <div className="crumbs">
        <span className="pill">
          Key moment {idx + 1} of {swings.length}
        </span>
      </div>
      <Board game={g} lastMove={{ from: current.from, to: current.to }} flipped={flipped} interactive={false} />
      <Card className="stack">
        <Display as="h3">
          {head.emoji} {head.text}
        </Display>
        <GuideBubble>{phrased || current.fact.sentence}</GuideBubble>
        {current.fact.better && (
          <p className="ds-muted">
            A stronger idea was <strong>{current.fact.better}</strong>.
          </p>
        )}
        <Button big onClick={() => setIdx((i) => i + 1)}>
          {idx + 1 >= swings.length ? "See what I learned →" : "Next moment →"}
        </Button>
      </Card>
    </div>
  );
}

function labelToWords(label: FactSheet["label"]): string {
  switch (label) {
    case "hung-piece":
      return "leaving a piece where it can be taken for free";
    case "missed-capture":
      return "spotting free captures";
    case "missed-mate":
      return "finding checkmates";
    case "walked-into-fork":
      return "avoiding forks";
    case "ignored-threat":
      return "asking what your opponent wants";
    case "bad-trade":
      return "counting piece values before trading";
    default:
      return "thinking a step ahead";
  }
}
