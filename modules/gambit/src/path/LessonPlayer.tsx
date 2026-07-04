/**
 * LessonPlayer (Learn) — walks a child through one lesson's steps: concept →
 * worked example (the move plays itself) → try-it (the child makes the move).
 * Companion-narrated via GuideBubble; reuses the Board. On finishing the last
 * lesson of a level's Learn phase, the caller schedules the level's patterns
 * onto the SRS (spec §3).
 */
import { useMemo, useState } from "react";
import { Button, Card, GuideBubble } from "@loci/design-system";
import { Chess, type Square } from "chess.js";
import { Board, legalTargets } from "../board/Board.js";
import type { Lesson, LessonStep } from "../lessons.js";

export function LessonPlayer({
  lesson,
  onDone,
  onExit,
}: {
  lesson: Lesson;
  onDone: () => void;
  onExit: () => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = lesson.steps[stepIdx];
  const isLast = stepIdx + 1 >= lesson.steps.length;

  const advance = () => {
    if (isLast) onDone();
    else setStepIdx((i) => i + 1);
  };

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onExit}>
          ← Back
        </Button>
        <span className="pill">
          {lesson.emoji} {lesson.title}
        </span>
        <span className="pill">
          Step {stepIdx + 1} of {lesson.steps.length}
        </span>
      </div>

      {step.kind === "concept" && <ConceptStep key={stepIdx} step={step} onNext={advance} isLast={isLast} />}
      {step.kind === "example" && <ExampleStep key={stepIdx} step={step} onNext={advance} isLast={isLast} />}
      {step.kind === "try" && <TryStep key={stepIdx} step={step} onNext={advance} isLast={isLast} />}
    </div>
  );
}

function ConceptStep({ step, onNext, isLast }: { step: LessonStep; onNext: () => void; isLast: boolean }) {
  return (
    <Card className="stack">
      <GuideBubble>{step.text}</GuideBubble>
      <Button big onClick={onNext}>
        {isLast ? "Finish lesson →" : "Got it →"}
      </Button>
    </Card>
  );
}

function ExampleStep({ step, onNext, isLast }: { step: LessonStep; onNext: () => void; isLast: boolean }) {
  const [game] = useState(() => new Chess(step.fen!));
  const [played, setPlayed] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const flipped = useMemo(() => new Chess(step.fen!).turn() === "b", [step.fen]);

  const showMove = () => {
    if (played) return;
    const m = game.move(step.move!);
    setLastMove({ from: m.from, to: m.to });
    setPlayed(true);
  };

  return (
    <div className="stack">
      <GuideBubble>{step.text}</GuideBubble>
      <Board game={game} lastMove={lastMove} flipped={flipped} interactive={false} />
      <div className="row wrap">
        {!played && (
          <Button big onClick={showMove}>
            Show me →
          </Button>
        )}
        {played && (
          <Button big onClick={onNext}>
            {isLast ? "Finish lesson →" : "Next →"}
          </Button>
        )}
      </div>
    </div>
  );
}

function TryStep({ step, onNext, isLast }: { step: LessonStep; onNext: () => void; isLast: boolean }) {
  const [game] = useState(() => new Chess(step.fen!));
  const [, force] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [solved, setSolved] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [nudge, setNudge] = useState<string>(step.text);
  const flipped = useMemo(() => new Chess(step.fen!).turn() === "b", [step.fen]);
  const targets = selected ? legalTargets(game, selected) : [];

  const onSquare = (square: Square) => {
    if (solved) return;
    const piece = game.get(square);
    if (selected && targets.includes(square)) {
      const m = game.move({ from: selected, to: square, promotion: "q" });
      setLastMove({ from: selected, to: square });
      setSelected(null);
      if (m.san === step.move) {
        setSolved(true);
        setNudge("Perfect — that's exactly it! 🌟");
      } else {
        game.undo();
        setLastMove(null);
        setNudge(step.hint ?? "Not quite — try another idea. You've got this!");
      }
      force((n) => n + 1);
      return;
    }
    if (piece && piece.color === game.turn()) setSelected(square);
    else setSelected(null);
  };

  return (
    <div className="stack">
      <GuideBubble>{nudge}</GuideBubble>
      <Board
        game={game}
        selected={selected}
        targets={targets}
        lastMove={lastMove}
        flipped={flipped}
        onSquare={onSquare}
        interactive={!solved}
      />
      {solved && (
        <Card className="center stack">
          <div className="big-emoji">✅</div>
          <Button big onClick={onNext}>
            {isLast ? "Finish lesson →" : "Next →"}
          </Button>
        </Card>
      )}
    </div>
  );
}
