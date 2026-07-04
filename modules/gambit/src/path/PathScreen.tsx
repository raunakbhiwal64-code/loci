/**
 * The Path screen (spec §2) — the structured learning ladder. Shows the nine
 * levels as a vertical ladder with lock/clear state. Opening the current level
 * reveals its four sub-steps: Learn (lessons) → Drill (curriculum puzzles) →
 * Boss (a persona game) → Gate (the mastery check). Levels are LOCKED until the
 * previous is cleared — the UI enforces this AND the gate logic in path.ts does
 * (a child can't skip ahead by clicking).
 *
 * Reuses: LessonPlayer (Learn), PuzzleBoard (Drill), the persona bot game
 * (Boss), personas, and the gate/progress store in path.ts.
 */
import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { Chess, type Square } from "chess.js";
import { Board, legalTargets } from "../board/Board.js";
import { personaById, personaMove } from "../personas.js";
import { analyzeMove } from "../tutor.js";
import { logMistake, type WeaknessCategory } from "../weakness.js";
import { LessonPlayer } from "./LessonPlayer.js";
import { PuzzleBoard } from "../belts.js";
import {
  PATH_LEVELS,
  MASTERY_THRESHOLD,
  levelStatuses,
  lessonsForPathLevel,
  drillPuzzlesForLevel,
  isLevelUnlocked,
  isGateCleared,
  masteryRatio,
  recordDrillAttempt,
  recordBossBeaten,
  scheduleLevelThemes,
  type PathLevel,
} from "../path.js";

type SubView = "overview" | "lesson" | "drill" | "boss";

export function PathScreen({ ctx, onHome }: { ctx: ModuleContext; onHome: () => void }) {
  const [openLevel, setOpenLevel] = useState<PathLevel | null>(null);
  const [sub, setSub] = useState<SubView>("overview");
  // Bump to force a re-read of persisted progress after each sub-activity.
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  const statuses = useMemo(() => levelStatuses(ctx), [ctx, version]);

  if (openLevel && sub === "lesson") {
    return (
      <LevelLearn
        ctx={ctx}
        level={openLevel}
        onExit={() => {
          bump();
          setSub("overview");
        }}
      />
    );
  }

  if (openLevel && sub === "drill") {
    return (
      <LevelDrill
        ctx={ctx}
        level={openLevel}
        onExit={() => {
          bump();
          setSub("overview");
        }}
      />
    );
  }

  if (openLevel && sub === "boss") {
    return (
      <LevelBoss
        ctx={ctx}
        level={openLevel}
        onExit={() => {
          bump();
          setSub("overview");
        }}
      />
    );
  }

  if (openLevel) {
    return (
      <LevelDetail
        ctx={ctx}
        level={openLevel}
        onBack={() => setOpenLevel(null)}
        onLearn={() => setSub("lesson")}
        onDrill={() => setSub("drill")}
        onBoss={() => setSub("boss")}
        version={version}
      />
    );
  }

  // The ladder overview.
  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onHome}>
          ← Gambit home
        </Button>
      </div>
      <GuideBubble>
        This is The Path — nine levels, each one a new chess superpower. Clear a level to unlock the next. No skipping —
        you'll <em>prove</em> each skill and I'll be right here with you!
      </GuideBubble>
      <div className="stack">
        {statuses.map((s) => {
          const locked = !s.unlocked;
          const cleared = s.gateCleared;
          return (
            <button
              key={s.level.id}
              className="tile"
              disabled={locked}
              onClick={() => !locked && setOpenLevel(s.level)}
              style={{ opacity: locked ? 0.55 : 1, cursor: locked ? "not-allowed" : "pointer", textAlign: "left" }}
            >
              <span className="tile__emoji">{locked ? "🔒" : cleared ? "🏅" : s.level.emoji}</span>
              <span className="tile__name">
                L{s.level.index} · {s.level.title}
              </span>
              <span className="tile__blurb">{locked ? "Clear the level above to unlock this." : s.level.summary}</span>
              {!locked && <ProgressRibbon value={Math.round(s.masteryRatio * 100)} />}
              {!locked && (
                <span className="tile__blurb">
                  {cleared ? "Cleared! 🌟" : `${Math.round(s.masteryRatio * 100)}% mastered`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ Level detail ---------------------------- */

function LevelDetail({
  ctx,
  level,
  onBack,
  onLearn,
  onDrill,
  onBoss,
  version,
}: {
  ctx: ModuleContext;
  level: PathLevel;
  onBack: () => void;
  onLearn: () => void;
  onDrill: () => void;
  onBoss: () => void;
  version: number;
}) {
  void version;
  const lessons = lessonsForPathLevel(level);
  const ratio = masteryRatio(ctx, level);
  const cleared = isGateCleared(ctx, level);
  const status = levelStatuses(ctx).find((s) => s.level.id === level.id)!;
  const boss = personaById(level.bossPersonaId);
  const needsBlunder = level.requiresBlunderCheck;

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onBack}>
          ← The Path
        </Button>
        <span className="pill">
          {level.emoji} L{level.index}
        </span>
      </div>
      <Card className="stack">
        <Display as="h3">
          {level.emoji} {level.title}
        </Display>
        <GuideBubble>{level.summary}</GuideBubble>
      </Card>

      <div className="tiles">
        <button className="tile" onClick={onLearn} disabled={lessons.length === 0} style={{ opacity: lessons.length ? 1 : 0.55 }}>
          <span className="tile__emoji">📖</span>
          <span className="tile__name">Learn</span>
          <span className="tile__blurb">
            {lessons.length ? `${lessons.length} short ${lessons.length === 1 ? "lesson" : "lessons"}` : "Lessons coming soon"}
          </span>
        </button>
        <button className="tile" onClick={onDrill}>
          <span className="tile__emoji">🧩</span>
          <span className="tile__name">Drill</span>
          <span className="tile__blurb">Practise the patterns until they're automatic.</span>
          <ProgressRibbon value={Math.round(ratio * 100)} />
        </button>
        <button className="tile" onClick={onBoss}>
          <span className="tile__emoji">{status.bossBeaten ? "🏆" : boss.emoji}</span>
          <span className="tile__name">Boss: {boss.name}</span>
          <span className="tile__blurb">{status.bossBeaten ? "Beaten! Nice work." : "Beat the boss to show your skill."}</span>
        </button>
      </div>

      <Card className="stack">
        <strong>🎯 The Gate</strong>
        <p className="ds-muted">
          Clear this level by solving at least {Math.round(MASTERY_THRESHOLD * 100)}% of the drills on your first try
          {needsBlunder ? ", and by using the blunder-check on your own at least once in a Guided Game" : ""}.
        </p>
        <ul className="ds-muted" style={{ margin: 0, paddingLeft: "1.2em" }}>
          <li>
            Mastery: {Math.round(ratio * 100)}% (need {Math.round(MASTERY_THRESHOLD * 100)}%)
          </li>
          {needsBlunder && <li>Blunder-check used on your own: reuse the Guided Game to earn this.</li>}
        </ul>
        {cleared ? (
          <GuideBubble>You've cleared this level — the next one is unlocked. Amazing work! 🌟</GuideBubble>
        ) : (
          <GuideBubble>Keep going — you're getting there. Every try makes you stronger.</GuideBubble>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------- Learn ---------------------------------- */

function LevelLearn({ ctx, level, onExit }: { ctx: ModuleContext; level: PathLevel; onExit: () => void }) {
  const lessons = useMemo(() => lessonsForPathLevel(level), [level]);
  const [idx, setIdx] = useState(0);
  const lesson = lessons[idx];

  if (!lesson) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">📖</div>
          <Display as="h3">Lessons coming soon</Display>
          <p className="ds-muted">This level's lessons are on the way. Try the Drill to practise!</p>
          <Button big onClick={onExit}>
            ← Back to level
          </Button>
        </Card>
      </div>
    );
  }

  const onLessonDone = () => {
    ctx.progression.award("pattern-recognition", 5);
    // Learning a level's patterns schedules them onto the SRS (spec §3).
    scheduleLevelThemes(ctx, level);
    ctx.analytics.emit({ kind: "content", action: "completed", itemId: lesson.id, pass: true });
    if (idx + 1 >= lessons.length) onExit();
    else setIdx((i) => i + 1);
  };

  return (
    <div className="stack">
      <div className="crumbs">
        <span className="pill">
          Lesson {idx + 1} of {lessons.length}
        </span>
      </div>
      <LessonPlayer key={lesson.id} lesson={lesson} onDone={onLessonDone} onExit={onExit} />
    </div>
  );
}

/* ------------------------------- Drill ---------------------------------- */

function LevelDrill({ ctx, level, onExit }: { ctx: ModuleContext; level: PathLevel; onExit: () => void }) {
  const puzzles = useMemo(() => drillPuzzlesForLevel(level), [level]);
  const [idx, setIdx] = useState(0);
  const puzzle = puzzles[idx];
  const isLast = idx + 1 >= puzzles.length;

  if (!puzzle) {
    return (
      <div className="stack">
        <Card className="center stack">
          <Display as="h3">No drills yet</Display>
          <Button big onClick={onExit}>
            ← Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onExit}>
          ← Back to level
        </Button>
        <span className="pill">
          Drill {idx + 1} of {puzzles.length}
        </span>
      </div>
      <PuzzleBoard
        key={puzzle.id}
        ctx={ctx}
        puzzle={puzzle}
        onSolved={(firstTry) => {
          recordDrillAttempt(ctx, level.id, puzzle.id, firstTry);
          // Drilling a pattern schedules its theme onto the SRS (spec §3).
          ctx.srs.schedule("gambit", `gambit:tactic:${puzzle.type}`);
          ctx.progression.award("pattern-recognition", firstTry ? 8 : 5);
          ctx.analytics.emit({ kind: "content", action: "completed", itemId: puzzle.id, pass: true });
        }}
        onNext={() => (isLast ? onExit() : setIdx((i) => i + 1))}
        nextLabel={isLast ? "Finish drills →" : "Next drill →"}
      />
    </div>
  );
}

/* -------------------------------- Boss ---------------------------------- */

/**
 * The Boss game — a full game vs the level's persona. Beating the boss records
 * it (path.ts). Reuses the persona engine and the deterministic tutor to log
 * any diagnosed mistakes to the weakness profile (spec §4: weakness detection
 * runs on the child's own in-Loci games).
 */
function LevelBoss({ ctx, level, onExit }: { ctx: ModuleContext; level: PathLevel; onExit: () => void }) {
  const boss = useMemo(() => personaById(level.bossPersonaId), [level]);
  const [game] = useState(() => new Chess());
  const [, force] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [ended, setEnded] = useState(false);

  const childColor = "w";
  const targets = selected ? legalTargets(game, selected) : [];
  const over = game.isGameOver();
  const myTurn = game.turn() === childColor && !over && !thinking;

  const finish = () => {
    const win = game.isCheckmate() && game.turn() !== childColor;
    if (win) recordBossBeaten(ctx, level.id);
    ctx.progression.award("planning-foresight", win ? 20 : 10);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "gambit",
      skills: ["planning-foresight"],
      success: win ? 1 : 0.5,
    });
    setEnded(true);
  };

  const botReply = () => {
    if (game.isGameOver()) {
      finish();
      return;
    }
    setThinking(true);
    setTimeout(() => {
      const san = personaMove(game, boss);
      if (san) {
        const m = game.move(san);
        setLastMove({ from: m.from, to: m.to });
      }
      setThinking(false);
      force((n) => n + 1);
      if (game.isGameOver()) finish();
    }, 250);
  };

  const onSquare = (square: Square) => {
    if (!myTurn) return;
    const piece = game.get(square);
    if (selected && targets.includes(square)) {
      const before = game.fen();
      const m = game.move({ from: selected, to: square, promotion: "q" });
      setLastMove({ from: selected, to: square });
      setSelected(null);
      // Log any diagnosed mistake to the weakness profile (adaptivity).
      const fact = analyzeMove(before, m.san, boss.depth);
      if (fact.label !== "good") {
        logMistake(ctx, fact.label as WeaknessCategory, Date.now(), fact.severity === "blunder" ? 2 : 1);
      }
      force((n) => n + 1);
      botReply();
      return;
    }
    if (piece && piece.color === childColor) setSelected(square);
    else setSelected(null);
  };

  if (ended) {
    const win = game.isCheckmate() && game.turn() !== childColor;
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">{win ? "🏆" : "🎓"}</div>
          <Display as="h3">{win ? `You beat ${boss.name}!` : "Good game!"}</Display>
          <p className="ds-muted">
            {win
              ? "That's the boss beaten — a big step on The Path."
              : `${boss.name} took this one, but every game makes you sharper. Try again when you're ready!`}
          </p>
          <Button big onClick={onExit}>
            ← Back to level
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onExit}>
          ← Back to level
        </Button>
        <span className="pill">
          {boss.emoji} Boss: {boss.name}
        </span>
        <span className="pill">{thinking ? "thinking…" : myTurn ? "your move" : over ? "game over" : ""}</span>
      </div>
      <GuideBubble>Beat {boss.name} to show you've mastered this level's skill. You've got this!</GuideBubble>
      <Board
        game={game}
        selected={selected}
        targets={targets}
        lastMove={lastMove}
        flipped={false}
        onSquare={onSquare}
        interactive={myTurn}
      />
      <div className="row wrap">
        <Button variant="ghost" onClick={finish}>
          Resign
        </Button>
      </div>
    </div>
  );
}

/** Convenience: is any level beyond L0 unlocked (used to nudge home copy)? */
export function pathStarted(ctx: ModuleContext): boolean {
  return PATH_LEVELS.some((l) => l.index > 0 && isLevelUnlocked(ctx, l.index));
}
