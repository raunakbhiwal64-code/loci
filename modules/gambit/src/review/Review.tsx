/**
 * Review mode (spec §6) — retention + fixing weaknesses. It pulls the child's
 * due SRS themes (ctx.srs.due("gambit")) and their weakest taxonomy categories,
 * then presents a session of FRESH puzzles of those themes (never the same
 * position twice within a run). Solving a puzzle grades its theme's SRS item up;
 * a miss shortens it. Awards progression + emits review analytics.
 *
 * Reuses PuzzleBoard (belts.tsx), the selection engine (selection.ts), and the
 * weakness profile (weakness.ts). Kid-warm, non-shaming copy throughout.
 */
import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { PuzzleBoard } from "../belts.js";
import { selectReviewPuzzles, sessionThemes, themeFromRef } from "./selection.js";
import {
  weakestCategories,
  logMistake,
  adjustRating,
  topWeakness,
  type WeaknessCategory,
} from "../weakness.js";
import { themeSrsRef } from "../path.js";
import type { PuzzleType } from "../puzzles.js";

const FRIENDLY_THEME: Record<PuzzleType, string> = {
  capture: "winning free pieces",
  mate1: "checkmates",
  mate2: "two-move checkmates",
  escape: "escaping check",
  fork: "forks",
  pin: "pins",
  skewer: "skewers",
  discovered: "discovered attacks",
};

export function Review({ ctx, onHome }: { ctx: ModuleContext; onHome: () => void }) {
  // Snapshot inputs once per mounted session so the set is stable while playing.
  const session = useMemo(() => {
    const dueRefs = ctx.srs.due("gambit").map((i) => i.payloadRef);
    const weakest = weakestCategories(ctx);
    const puzzles = selectReviewPuzzles({ dueRefs, weakest, count: 6 });
    const themes = sessionThemes({ dueRefs, weakest, count: 6 });
    return { dueRefs, puzzles, themes };
  }, [ctx]);

  const [idx, setIdx] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);

  const puzzle = session.puzzles[idx];
  const done = idx >= session.puzzles.length;
  const focus = topWeakness(ctx);

  const gradeTheme = (theme: PuzzleType, solved: boolean, firstTry: boolean) => {
    const ref = themeSrsRef(theme);
    // Find the matching due item (if any) and grade it; else schedule it fresh so
    // the pattern enters the ladder. Fresh positions come from selection, not here.
    const dueItem = ctx.srs.due("gambit").find((i) => i.payloadRef === ref);
    const item = dueItem ?? ctx.srs.schedule("gambit", ref);
    ctx.srs.review(item.id, solved ? (firstTry ? "good" : "hard") : "again");
    ctx.analytics.emit({
      kind: "review",
      action: solved ? "recalled" : "missed",
      moduleId: "gambit",
      intervalDays: item.intervalDays,
    });
  };

  const onSolved = (firstTry: boolean) => {
    gradeTheme(puzzle.type, true, firstTry);
    adjustRating(ctx, true);
    ctx.progression.award("pattern-recognition", firstTry ? 10 : 6);
    if (puzzle.type === "mate1" || puzzle.type === "mate2") ctx.progression.award("planning-foresight", 6);
    setSolvedCount((c) => c + 1);
  };

  // If the child skips a puzzle, treat it as a missed review of that theme and
  // log the closest weakness so adaptivity still biases toward it next time.
  const onSkip = () => {
    gradeTheme(puzzle.type, false, false);
    const category = themeToWeakness(puzzle.type);
    if (category) logMistake(ctx, category);
    adjustRating(ctx, false);
    setIdx((i) => i + 1);
  };

  if (session.puzzles.length === 0) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">🎉</div>
          <Display as="h3">All caught up!</Display>
          <p className="ds-muted">Nothing to review right now. Play a game or a lesson and come back!</p>
          <Button big onClick={onHome}>
            Back to Gambit home →
          </Button>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">🌟</div>
          <Display as="h3">Review done!</Display>
          <p>
            You practised <strong>{solvedCount}</strong> of {session.puzzles.length} — great focus. Each one you nailed
            comes back a little later, until it's automatic.
          </p>
          {focus && (
            <p className="ds-muted">
              I'll keep sending you a bit more {FRIENDLY_THEME[weaknessToTheme(focus)] ?? "practice"} — that's the area
              we're leveling up right now.
            </p>
          )}
          <Button big onClick={onHome}>
            Back to Gambit home →
          </Button>
        </Card>
      </div>
    );
  }

  const themeWords = FRIENDLY_THEME[puzzle.type] ?? "this pattern";
  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onHome}>
          ← Gambit home
        </Button>
        <span className="pill">
          Review {idx + 1} of {session.puzzles.length}
        </span>
      </div>
      <GuideBubble>
        Time to keep your skills sharp! This one is about <strong>{themeWords}</strong>.
      </GuideBubble>
      <PuzzleBoard
        key={puzzle.id}
        ctx={ctx}
        puzzle={puzzle}
        onSolved={onSolved}
        onNext={() => setIdx((i) => i + 1)}
        nextLabel={idx + 1 >= session.puzzles.length ? "Finish review →" : "Next →"}
      />
      <div className="row">
        <Button variant="ghost" onClick={onSkip}>
          Skip this one
        </Button>
      </div>
    </div>
  );
}

/** Map a weakness category to a representative puzzle theme for the summary. */
function weaknessToTheme(category: string): PuzzleType {
  switch (category) {
    case "missed-mate":
      return "mate1";
    case "walked-into-fork":
      return "fork";
    case "missed-capture":
      return "capture";
    default:
      return "capture";
  }
}

/** Map a puzzle theme back to the weakness category it drills, if any. */
function themeToWeakness(theme: PuzzleType): WeaknessCategory | null {
  switch (theme) {
    case "mate1":
    case "mate2":
      return "missed-mate";
    case "fork":
    case "pin":
    case "skewer":
    case "discovered":
      return "walked-into-fork";
    case "capture":
      return "missed-capture";
    default:
      return null;
  }
}

/** Whether a review session is waiting (due themes or a logged weakness). */
export function reviewCount(ctx: ModuleContext): number {
  const dueRefs = ctx.srs.due("gambit").map((i) => i.payloadRef);
  const themedDue = dueRefs.filter((r) => themeFromRef(r) !== null).length;
  // Also surface a session if the child has any logged weakness to work on.
  const hasWeakness = topWeakness(ctx) !== null;
  return themedDue > 0 || hasWeakness ? Math.max(themedDue, 1) : 0;
}
