/**
 * Gambit home + play modes on the spine:
 *  - Belt path (curriculum, progress in ctx.storage)
 *  - Play the Bot (pick persona; move tutor after each child move; resign/new)
 *  - Pass-and-play (two kids, one device, no tutor pressure)
 *  - Daily Puzzle (deterministic by date)
 *  - Post-game review (3 biggest swings) after a bot game.
 * Awards planning-foresight + pattern-recognition (+ metacognition on review),
 * emits analytics activity events with moduleId "gambit".
 */
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { Chess, type Square } from "chess.js";
import { Board, legalTargets } from "./board/Board.js";
import { BeltPath, BeltRun, PuzzleBoard, allSolvedCount } from "./belts.js";
import { PERSONAS, personaMove, type Persona } from "./personas.js";
import { analyzeMove, severityHeadline, factSheetContext, type FactSheet } from "./tutor.js";
import { dailyPuzzle } from "./puzzles.js";
import { GameReview, type MoveRecord } from "./review.js";
import type { Belt } from "./puzzles.js";

type Screen = "home" | "belts" | "beltrun" | "bot-pick" | "bot-play" | "review" | "pass" | "daily";

export function GambitApp({ ctx }: { ctx: ModuleContext }) {
  const [screen, setScreen] = useState<Screen>("home");
  const [belt, setBelt] = useState<Belt>(1);
  const [persona, setPersona] = useState<Persona>(PERSONAS[0]);
  const [records, setRecords] = useState<MoveRecord[]>([]);
  const [result, setResult] = useState<string>("");

  const dateKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const daily = useMemo(() => dailyPuzzle(dateKey), [dateKey]);

  useEffect(() => {
    ctx.analytics.emit({ kind: "session", action: "module_opened", moduleId: "gambit" });
  }, [ctx]);

  const startBotGame = (p: Persona) => {
    setPersona(p);
    setRecords([]);
    setResult("");
    setScreen("bot-play");
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "gambit", skills: ["planning-foresight"] });
  };

  const endBotGame = (recs: MoveRecord[], res: string) => {
    setRecords(recs);
    setResult(res);
    setScreen("review");
  };

  if (screen === "belts") {
    return (
      <Frame ctx={ctx} onHome={() => setScreen("home")}>
        <BeltPath
          ctx={ctx}
          onOpen={(b) => {
            setBelt(b);
            setScreen("beltrun");
          }}
        />
      </Frame>
    );
  }

  if (screen === "beltrun") {
    return (
      <Frame ctx={ctx} onHome={() => setScreen("home")}>
        <BeltRun ctx={ctx} belt={belt} onExit={() => setScreen("belts")} />
      </Frame>
    );
  }

  if (screen === "bot-pick") {
    return (
      <Frame ctx={ctx} onHome={() => setScreen("home")}>
        <div className="stack">
          <GuideBubble>Pick your opponent. Start with Pip — Pip is still learning, just like you!</GuideBubble>
          <div className="tiles">
            {PERSONAS.map((p) => (
              <button key={p.id} className="tile" onClick={() => startBotGame(p)}>
                <span className="tile__emoji">{p.emoji}</span>
                <span className="tile__name">{p.name}</span>
                <span className="tile__blurb">{p.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      </Frame>
    );
  }

  if (screen === "bot-play") {
    return (
      <Frame ctx={ctx} onHome={() => setScreen("home")}>
        <BotGame ctx={ctx} persona={persona} onEnd={endBotGame} onQuit={() => setScreen("home")} />
      </Frame>
    );
  }

  if (screen === "review") {
    return (
      <Frame ctx={ctx} onHome={() => setScreen("home")}>
        <GameReview ctx={ctx} records={records} result={result} onDone={() => setScreen("home")} />
      </Frame>
    );
  }

  if (screen === "pass") {
    return (
      <Frame ctx={ctx} onHome={() => setScreen("home")}>
        <PassAndPlay onQuit={() => setScreen("home")} />
      </Frame>
    );
  }

  if (screen === "daily") {
    return (
      <Frame ctx={ctx} onHome={() => setScreen("home")}>
        <div className="stack">
          <Display as="h3">Daily Puzzle · {dateKey}</Display>
          <PuzzleBoard
            ctx={ctx}
            puzzle={daily}
            onSolved={() => {
              ctx.progression.award("pattern-recognition", 10);
              ctx.analytics.emit({ kind: "daily", action: "completed", challengeId: `gambit:${daily.id}` });
            }}
            onNext={() => setScreen("home")}
            nextLabel="Done for today →"
          />
        </div>
      </Frame>
    );
  }

  // home
  const solved = allSolvedCount(ctx);
  return (
    <Frame ctx={ctx} onHome={() => setScreen("home")} hideHome>
      <div className="stack">
        <GuideBubble>
          Welcome to Gambit! Learn chess one superpower at a time. I'll always tell you the <em>why</em> behind a move.
        </GuideBubble>

        <Card className="stack">
          <Display as="h3">Keep going</Display>
          <p className="ds-muted">
            You've solved {solved.solved} of {solved.total} puzzles. Ready for the next one?
          </p>
          <Button big onClick={() => setScreen("belts")}>
            Continue the belts →
          </Button>
        </Card>

        <div className="tiles">
          <button className="tile" onClick={() => setScreen("bot-pick")}>
            <span className="tile__emoji">🤖</span>
            <span className="tile__name">Play the Bot</span>
            <span className="tile__blurb">Full game with a friendly coach after every move.</span>
          </button>
          <button className="tile" onClick={() => setScreen("daily")}>
            <span className="tile__emoji">🗓️</span>
            <span className="tile__name">Daily Puzzle</span>
            <span className="tile__blurb">One fresh puzzle every day.</span>
          </button>
          <button className="tile" onClick={() => setScreen("pass")}>
            <span className="tile__emoji">👫</span>
            <span className="tile__name">Pass & Play</span>
            <span className="tile__blurb">Two players, one device. Just for fun!</span>
          </button>
          <button className="tile" onClick={() => setScreen("belts")}>
            <span className="tile__emoji">🥋</span>
            <span className="tile__name">Belt Path</span>
            <span className="tile__blurb">Learn every chess skill, step by step.</span>
          </button>
        </div>
      </div>
    </Frame>
  );
}

/* ---------------------------- shared frame ------------------------------- */

function Frame({
  ctx,
  onHome,
  hideHome,
  children,
}: {
  ctx: ModuleContext;
  onHome: () => void;
  hideHome?: boolean;
  children: React.ReactNode;
}) {
  void ctx;
  return (
    <div className="stack">
      {!hideHome && (
        <div className="crumbs">
          <Button variant="ghost" onClick={onHome}>
            ← Gambit home
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}

/* --------------------------- Play the Bot -------------------------------- */

function BotGame({
  ctx,
  persona,
  onEnd,
  onQuit,
}: {
  ctx: ModuleContext;
  persona: Persona;
  onEnd: (records: MoveRecord[], result: string) => void;
  onQuit: () => void;
}) {
  const [game] = useState(() => new Chess());
  const [, force] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [records, setRecords] = useState<MoveRecord[]>([]);
  const [tutor, setTutor] = useState<{ fact: FactSheet; text: string } | null>(null);
  const [thinking, setThinking] = useState(false);

  const childColor = "w"; // child plays White for the MVP
  const targets = selected ? legalTargets(game, selected) : [];
  const myTurn = game.turn() === childColor && !game.isGameOver() && !thinking;

  const gameResultText = (): string => {
    if (game.isCheckmate()) return game.turn() === childColor ? "The bot won this one." : "You won — checkmate!";
    if (game.isStalemate()) return "Stalemate — it's a draw!";
    if (game.isDraw()) return "It's a draw.";
    return "Good game!";
  };

  const finishGame = (recs: MoveRecord[]) => {
    const win = game.isCheckmate() && game.turn() !== childColor;
    ctx.progression.award("planning-foresight", win ? 20 : 10);
    ctx.progression.award("pattern-recognition", 6);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "gambit",
      skills: ["planning-foresight", "pattern-recognition"],
      success: win ? 1 : 0.5,
    });
    onEnd(recs, gameResultText());
  };

  const botReply = (recs: MoveRecord[]) => {
    if (game.isGameOver()) {
      finishGame(recs);
      return;
    }
    setThinking(true);
    // small deferral so the child's move renders before the bot replies
    setTimeout(() => {
      const san = personaMove(game, persona);
      if (san) {
        const m = game.move(san);
        setLastMove({ from: m.from, to: m.to });
      }
      setThinking(false);
      force((n) => n + 1);
      if (game.isGameOver()) finishGame(recs);
    }, 250);
  };

  const runTutor = async (before: string, san: string) => {
    const fact = analyzeMove(before, san, persona.depth);
    let text = fact.sentence;
    try {
      const r = await ctx.ai.explain({ task: "gambit.explain", context: factSheetContext(fact) });
      if (r.text) text = r.text;
    } catch {
      /* deterministic fallback stands */
    }
    setTutor({ fact, text });
  };

  const onSquare = (square: Square) => {
    if (!myTurn) return;
    const piece = game.get(square);
    if (selected && targets.includes(square)) {
      const before = game.fen();
      const m = game.move({ from: selected, to: square, promotion: "q" });
      setLastMove({ from: selected, to: square });
      setSelected(null);
      const rec: MoveRecord = { before, san: m.san, ply: records.length };
      const recs = [...records, rec];
      setRecords(recs);
      void runTutor(before, m.san);
      force((n) => n + 1);
      botReply(recs);
      return;
    }
    if (piece && piece.color === childColor) setSelected(square);
    else setSelected(null);
  };

  const over = game.isGameOver();
  const head = tutor ? severityHeadline(tutor.fact.severity) : null;

  return (
    <div className="stack">
      <div className="spread">
        <span className="pill">
          {persona.emoji} {persona.name}
        </span>
        <span className="pill">{thinking ? "thinking…" : myTurn ? "your move" : over ? "game over" : ""}</span>
      </div>
      <Board
        game={game}
        selected={selected}
        targets={targets}
        lastMove={lastMove}
        flipped={false}
        onSquare={onSquare}
        interactive={myTurn}
      />
      {tutor && head && (
        <Card className="stack">
          <strong>
            {head.emoji} {head.text}
          </strong>
          <GuideBubble>{tutor.text}</GuideBubble>
        </Card>
      )}
      <div className="row wrap">
        {!over && (
          <Button variant="ghost" onClick={() => finishGame(records)}>
            Resign & review
          </Button>
        )}
        {over && (
          <Button big onClick={() => finishGame(records)}>
            See the review →
          </Button>
        )}
        <Button variant="ghost" onClick={onQuit}>
          Quit
        </Button>
      </div>
    </div>
  );
}

/* --------------------------- Pass and play ------------------------------- */

function PassAndPlay({ onQuit }: { onQuit: () => void }) {
  const [game] = useState(() => new Chess());
  const [, force] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  const targets = selected ? legalTargets(game, selected) : [];
  const over = game.isGameOver();

  const onSquare = (square: Square) => {
    if (over) return;
    const piece = game.get(square);
    if (selected && targets.includes(square)) {
      const m = game.move({ from: selected, to: square, promotion: "q" });
      setLastMove({ from: m.from, to: m.to });
      setSelected(null);
      force((n) => n + 1);
      return;
    }
    if (piece && piece.color === game.turn()) setSelected(square);
    else setSelected(null);
  };

  const status = over
    ? game.isCheckmate()
      ? `Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins 🎉`
      : "Draw — well played both!"
    : `${game.turn() === "w" ? "White" : "Black"} to move`;

  return (
    <div className="stack">
      <GuideBubble>Two players, one board — take turns. No pressure, just play and have fun!</GuideBubble>
      <div className="spread">
        <span className="pill">{status}</span>
      </div>
      {/* flip so the side to move is always at the bottom */}
      <Board
        game={game}
        selected={selected}
        targets={targets}
        lastMove={lastMove}
        flipped={game.turn() === "b"}
        onSquare={onSquare}
        interactive={!over}
      />
      <div className="row">
        <Button variant="ghost" onClick={onQuit}>
          End game
        </Button>
      </div>
    </div>
  );
}
