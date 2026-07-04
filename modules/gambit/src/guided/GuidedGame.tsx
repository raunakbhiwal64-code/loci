/**
 * Guided Game (screen 21) — a full game vs a friendly persona where, before the
 * child commits a move, the blunder-check checklist appears as an overlay/panel.
 * Using it is celebrated with companion process-praise. The scaffold FADES as
 * the child internalises the routine: full checklist → single reminder → off,
 * tracked and persisted across games in ctx.storage (see blunderCheck.ts).
 *
 * Reuses board/Board.tsx, the personas engine, and the move tutor (both the
 * mistake taxonomy and the purpose taxonomy) so every move gets a warm "why".
 */
import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { Chess, type Square } from "chess.js";
import { Board, legalTargets } from "../board/Board.js";
import { personaMove, type Persona } from "../personas.js";
import { analyzeMove, severityHeadline, factSheetContext, type FactSheet } from "../tutor.js";
import { analyzePurpose, purposeHeadline, purposeContext, type PurposeSheet } from "../purposes.js";
import {
  BLUNDER_CHECK,
  scaffoldLevel,
  completeGuidedGame,
  recordBlunderCheckUse,
  gamesUntilNextFade,
  guidedGamesPlayed,
  type ScaffoldLevel,
} from "./blunderCheck.js";

export function GuidedGame({
  ctx,
  persona,
  onQuit,
}: {
  ctx: ModuleContext;
  persona: Persona;
  onQuit: () => void;
}) {
  const [game] = useState(() => new Chess());
  const [, force] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [ended, setEnded] = useState(false);
  const [awarded, setAwarded] = useState(false);

  // Feedback after each child move: mistake OR purpose (whichever fits).
  const [feedback, setFeedback] = useState<
    | { kind: "mistake"; fact: FactSheet; text: string }
    | { kind: "purpose"; sheet: PurposeSheet; text: string }
    | null
  >(null);

  // The scaffold level is decided once per game, from the persisted count so it
  // is stable while playing this game and fades on the NEXT one.
  const level: ScaffoldLevel = useMemo(() => scaffoldLevel(ctx), [ctx]);
  const [showChecklist, setShowChecklist] = useState(level === "full");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [praise, setPraise] = useState<string | null>(null);

  const childColor = "w";
  const targets = selected ? legalTargets(game, selected) : [];
  const over = game.isGameOver();
  const myTurn = game.turn() === childColor && !over && !thinking;

  // A move is "blocked" behind the checklist only at the full scaffold, and only
  // until the child has ticked all four items (or dismissed it).
  const checklistBlocking = level === "full" && showChecklist && checkedIds.size < BLUNDER_CHECK.length;

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const finishChecklist = () => {
    recordBlunderCheckUse(ctx); // persisted use count + metacognition award
    setPraise("Awesome — you ran your blunder-check! That's exactly how strong players think. 🌟");
    setShowChecklist(false);
  };

  const resultText = (): string => {
    if (game.isCheckmate()) return game.turn() === childColor ? "The bot won this one — great effort!" : "You won — checkmate! 🎉";
    if (game.isStalemate()) return "Stalemate — it's a draw!";
    if (game.isDraw()) return "It's a draw — well played.";
    return "Good game!";
  };

  const endGame = () => {
    if (awarded) {
      setEnded(true);
      return;
    }
    setAwarded(true);
    const win = game.isCheckmate() && game.turn() !== childColor;
    ctx.progression.award("planning-foresight", win ? 18 : 10);
    ctx.progression.award("metacognition", 6);
    // This is what advances the fade (persisted) for next time.
    completeGuidedGame(ctx);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "gambit",
      skills: ["planning-foresight", "metacognition"],
      success: win ? 1 : 0.5,
    });
    setEnded(true);
  };

  const botReply = () => {
    if (game.isGameOver()) {
      endGame();
      return;
    }
    setThinking(true);
    setTimeout(() => {
      const san = personaMove(game, persona);
      if (san) {
        const m = game.move(san);
        setLastMove({ from: m.from, to: m.to });
      }
      setThinking(false);
      force((n) => n + 1);
      // Re-arm the checklist for the child's next turn (if the scaffold is on).
      if (level === "full") {
        setCheckedIds(new Set());
        setShowChecklist(true);
      }
      if (game.isGameOver()) endGame();
    }, 250);
  };

  const runTutor = async (before: string, san: string) => {
    const fact = analyzeMove(before, san, persona.depth);
    if (fact.label === "good") {
      // Good move → explain its PURPOSE (Chernev's method).
      const sheet = analyzePurpose(before, san);
      let text = sheet.sentence;
      try {
        const r = await ctx.ai.explain({ task: "gambit.explain", context: purposeContext(sheet) });
        if (r.text) text = r.text;
      } catch {
        /* deterministic fallback stands */
      }
      setFeedback({ kind: "purpose", sheet, text });
    } else {
      let text = fact.sentence;
      try {
        const r = await ctx.ai.explain({ task: "gambit.explain", context: factSheetContext(fact) });
        if (r.text) text = r.text;
      } catch {
        /* deterministic fallback stands */
      }
      setFeedback({ kind: "mistake", fact, text });
    }
  };

  const onSquare = (square: Square) => {
    if (!myTurn || checklistBlocking) return;
    const piece = game.get(square);
    if (selected && targets.includes(square)) {
      const before = game.fen();
      const m = game.move({ from: selected, to: square, promotion: "q" });
      setLastMove({ from: selected, to: square });
      setSelected(null);
      setPraise(null);
      void runTutor(before, m.san);
      force((n) => n + 1);
      botReply();
      return;
    }
    if (piece && piece.color === childColor) setSelected(square);
    else setSelected(null);
  };

  if (ended) {
    const played = guidedGamesPlayed(ctx);
    const nowLevel = scaffoldLevel(ctx);
    const faded = nowLevel !== level; // the scaffold changed for next time
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">{game.isCheckmate() && game.turn() !== childColor ? "🏆" : "🎓"}</div>
          <Display as="h3">{resultText()}</Display>
          {faded && nowLevel === "reminder" && (
            <GuideBubble>
              You've done the blunder-check enough times that I'll only give you a gentle reminder now — you're getting it!
            </GuideBubble>
          )}
          {faded && nowLevel === "off" && (
            <GuideBubble>
              You've made the blunder-check a habit! From now on I'll trust you to do it in your head — that's real mastery. 🌟
            </GuideBubble>
          )}
          {!faded && nowLevel !== "off" && (
            <p className="ds-muted">
              {gamesUntilNextFade(ctx)} more guided {gamesUntilNextFade(ctx) === 1 ? "game" : "games"} and the checklist
              will start to fade — because you won't need it as much!
            </p>
          )}
          <p className="ds-muted">Guided games played: {played}</p>
          <Button big onClick={onQuit}>
            Back to Gambit home →
          </Button>
        </Card>
      </div>
    );
  }

  const mistakeHead = feedback?.kind === "mistake" ? severityHeadline(feedback.fact.severity) : null;
  const purposeHead = feedback?.kind === "purpose" ? purposeHeadline(feedback.sheet.label) : null;

  return (
    <div className="stack">
      <div className="spread">
        <span className="pill">
          {persona.emoji} {persona.name}
        </span>
        <span className="pill">{thinking ? "thinking…" : myTurn ? "your move" : over ? "game over" : ""}</span>
      </div>

      {/* Blunder-check overlay — the scaffold that fades. */}
      {level === "full" && showChecklist && myTurn && (
        <Card className="stack">
          <strong>🧠 Before you move — the blunder-check</strong>
          <p className="ds-muted">Tick each one as you check it. Good players do this every single move!</p>
          <div className="stack">
            {BLUNDER_CHECK.map((q) => (
              <label key={q.id} className="row" style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={checkedIds.has(q.id)} onChange={() => toggleCheck(q.id)} />
                <span>
                  {q.emoji} {q.question}
                </span>
              </label>
            ))}
          </div>
          <div className="row wrap">
            <Button big onClick={finishChecklist} disabled={checkedIds.size < BLUNDER_CHECK.length}>
              {checkedIds.size < BLUNDER_CHECK.length ? `Check all ${BLUNDER_CHECK.length} to continue` : "I'm ready — let me move!"}
            </Button>
            <Button variant="ghost" onClick={() => setShowChecklist(false)}>
              Skip this time
            </Button>
          </div>
        </Card>
      )}

      {/* Reminder scaffold — a single gentle nudge, no blocking. */}
      {level === "reminder" && myTurn && !feedback && (
        <GuideBubble>Quick blunder-check: is your piece safe, and what does your opponent want?</GuideBubble>
      )}

      {praise && <GuideBubble>{praise}</GuideBubble>}

      <Board
        game={game}
        selected={selected}
        targets={targets}
        lastMove={lastMove}
        flipped={false}
        onSquare={onSquare}
        interactive={myTurn && !checklistBlocking}
      />

      {feedback && (
        <Card className="stack">
          {feedback.kind === "mistake" && mistakeHead && (
            <strong>
              {mistakeHead.emoji} {mistakeHead.text}
            </strong>
          )}
          {feedback.kind === "purpose" && purposeHead && (
            <strong>
              {purposeHead.emoji} {purposeHead.text}
            </strong>
          )}
          <GuideBubble>{feedback.text}</GuideBubble>
        </Card>
      )}

      <div className="row wrap">
        {!over && (
          <Button variant="ghost" onClick={endGame}>
            Finish game
          </Button>
        )}
        {over && (
          <Button big onClick={endGame}>
            See how you did →
          </Button>
        )}
        <Button variant="ghost" onClick={onQuit}>
          Quit
        </Button>
      </div>
    </div>
  );
}
