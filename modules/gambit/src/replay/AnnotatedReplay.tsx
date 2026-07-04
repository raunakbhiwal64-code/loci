/**
 * Annotated Game Replay (screen 20, the Chernev mode). Step through a curated
 * complete game while the tutor explains the PURPOSE of each move in child
 * language. Reuses board/Board.tsx for the position. Prev/Next + auto-play
 * toggle; pause-and-predict before certain moves ("what would you play here?");
 * games grouped by theme on an index screen. Awards planning-foresight +
 * metacognition on finishing; emits analytics (moduleId "gambit").
 *
 * Annotations are authored (games.ts) — never model-generated — so they are
 * always correct.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { Chess, type Square } from "chess.js";
import { Board, legalTargets } from "../board/Board.js";
import {
  REPLAY_GAMES,
  replayThemes,
  gamesForTheme,
  type ReplayGame,
} from "./games.js";

/* --------------------------- theme + game index ------------------------- */

export function ReplayIndex({ onPick }: { onPick: (game: ReplayGame) => void }) {
  const themes = useMemo(() => replayThemes(), []);
  return (
    <div className="stack">
      <GuideBubble>
        Watch a whole game unfold — I'll tell you the <em>why</em> behind every single move. Sometimes I'll ask what
        you would play!
      </GuideBubble>
      {themes.map((theme) => (
        <div className="stack" key={theme}>
          <Display as="h3">{theme}</Display>
          <div className="tiles">
            {gamesForTheme(theme).map((g) => (
              <button key={g.id} className="tile" onClick={() => onPick(g)}>
                <span className="tile__emoji">{g.emoji}</span>
                <span className="tile__name">{g.title}</span>
                <span className="tile__blurb">{g.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ one replay ------------------------------ */

/** Positions[i] = FEN BEFORE move i is played; positions[len] = final FEN. */
function buildPositions(game: ReplayGame): {
  fens: string[];
  fromTo: ({ from: Square; to: Square } | null)[];
} {
  const chess = new Chess();
  const fens: string[] = [chess.fen()];
  const fromTo: ({ from: Square; to: Square } | null)[] = [null];
  for (const m of game.moves) {
    const mv = chess.move(m.san);
    fens.push(chess.fen());
    fromTo.push({ from: mv.from, to: mv.to });
  }
  return { fens, fromTo };
}

export function AnnotatedReplay({
  ctx,
  game,
  onExit,
}: {
  ctx: ModuleContext;
  game: ReplayGame;
  onExit: () => void;
}) {
  // step = number of moves already REVEALED (0 = start position, no moves shown).
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const { fens, fromTo } = useMemo(() => buildPositions(game), [game]);

  // Pause-and-predict state: when the NEXT move is a predict move and we haven't
  // resolved the prediction yet, show the predict panel instead of auto-advancing.
  const nextMove = step < game.moves.length ? game.moves[step] : null;
  const [predicting, setPredicting] = useState(false);
  const [predictSquare, setPredictSquare] = useState<Square | null>(null);
  const [predictGuess, setPredictGuess] = useState<{ from: Square; to: Square } | null>(null);

  const finished = step >= game.moves.length;

  useEffect(() => {
    ctx.analytics.emit({ kind: "content", action: "served", itemId: `replay:${game.id}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.id]);

  // Award once on reaching the end (planning-foresight + metacognition).
  useEffect(() => {
    if (finished && !awarded) {
      setAwarded(true);
      ctx.progression.award("planning-foresight", 12);
      ctx.progression.award("metacognition", 8);
      ctx.analytics.emit({
        kind: "activity",
        action: "completed",
        moduleId: "gambit",
        skills: ["planning-foresight", "metacognition"],
        success: 1,
      });
      ctx.analytics.emit({ kind: "content", action: "completed", itemId: `replay:${game.id}`, pass: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, awarded]);

  const advance = () => {
    if (step >= game.moves.length) return;
    // If the upcoming move wants a prediction and we haven't offered it, do so.
    if (nextMove?.predict && !predicting && predictGuess === null) {
      setPredicting(true);
      setAuto(false);
      return;
    }
    setPredicting(false);
    setPredictSquare(null);
    setPredictGuess(null);
    setStep((s) => s + 1);
  };

  const back = () => {
    setAuto(false);
    setPredicting(false);
    setPredictSquare(null);
    setPredictGuess(null);
    setStep((s) => Math.max(0, s - 1));
  };

  // Auto-play: reveal one move per tick unless a prediction is pending.
  const autoRef = useRef(auto);
  autoRef.current = auto;
  useEffect(() => {
    if (!auto || finished || predicting) return;
    const t = setTimeout(() => {
      if (autoRef.current) advance();
    }, 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, step, finished, predicting]);

  // Board shown: the position AFTER the last revealed move (fens[step]).
  const shownFen = fens[step];
  const shownGame = useMemo(() => new Chess(shownFen), [shownFen]);
  const lastMove = step > 0 ? fromTo[step] : null;
  const flipped = false;

  // During prediction, the board is at the position BEFORE the predict move
  // (fens[step]) and the child may pick a from/to as their guess.
  const predictTargets = predicting && predictSquare ? legalTargets(shownGame, predictSquare) : [];

  const onPredictSquare = (square: Square) => {
    if (!predicting) return;
    const piece = shownGame.get(square);
    if (predictSquare && predictTargets.includes(square)) {
      setPredictGuess({ from: predictSquare, to: square });
      setPredictSquare(null);
      return;
    }
    if (piece && piece.color === shownGame.turn()) setPredictSquare(square);
    else setPredictSquare(null);
  };

  const revealPredicted = () => {
    // Reveal the actual played move; compare with the child's guess for warmth.
    setStep((s) => s + 1);
    setPredicting(false);
    setPredictSquare(null);
    // keep predictGuess so we can congratulate on the revealed panel
  };

  const currentNote = step > 0 ? game.moves[step - 1].note : null;
  const currentSan = step > 0 ? game.moves[step - 1].san : null;

  // Did the child's guess match the played move (by from/to)?
  const guessedRight =
    predictGuess &&
    currentSan &&
    (() => {
      const g = new Chess(fens[step - 1]);
      const played = g.move(currentSan);
      return played.from === predictGuess.from && played.to === predictGuess.to;
    })();

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onExit}>
          ← Games
        </Button>
        <span className="pill">
          {game.emoji} {game.title}
        </span>
        <span className="pill">
          Move {step} of {game.moves.length}
        </span>
      </div>

      {predicting && nextMove ? (
        <GuideBubble>What would you play here? Move a piece to guess — or just skip and I'll show you.</GuideBubble>
      ) : (
        <GuideBubble>{currentNote ?? game.blurb}</GuideBubble>
      )}

      <Board
        game={shownGame}
        selected={predicting ? predictSquare : null}
        targets={predictTargets}
        lastMove={lastMove}
        flipped={flipped}
        onSquare={predicting ? onPredictSquare : undefined}
        interactive={predicting}
      />

      {/* Prediction panel */}
      {predicting && nextMove && (
        <Card className="stack">
          <strong>🤔 Your turn to think</strong>
          {predictGuess ? (
            <p className="ds-muted">
              You'd play <strong>{predictGuess.from}→{predictGuess.to}</strong>. Ready to see what was played?
            </p>
          ) : (
            <p className="ds-muted">Pick a piece and a square, or skip ahead.</p>
          )}
          <div className="row wrap">
            <Button big onClick={revealPredicted}>
              Reveal the move →
            </Button>
            {predictGuess && (
              <Button variant="ghost" onClick={() => setPredictGuess(null)}>
                Guess again
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Move note / reveal panel */}
      {!predicting && currentSan && (
        <Card className="stack">
          {guessedRight !== null && guessedRight !== undefined && (
            <strong>{guessedRight ? "🌟 You found it!" : "👍 Good thinking — here's what was played:"}</strong>
          )}
          <p>
            <strong>{currentSan}</strong> — {currentNote}
          </p>
        </Card>
      )}

      {finished && (
        <Card className="center stack">
          <div className="big-emoji">🎓</div>
          <Display as="h3">Game complete!</Display>
          <GuideBubble>{game.outro}</GuideBubble>
          <div className="row wrap">
            <Button big onClick={onExit}>
              Pick another game →
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setStep(0);
                setAwarded(true); // don't double-award on replay
                setPredictGuess(null);
              }}
            >
              Watch again
            </Button>
          </div>
        </Card>
      )}

      {/* Controls */}
      {!finished && (
        <div className="row wrap">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            ← Prev
          </Button>
          {!predicting && (
            <Button big onClick={advance}>
              Next →
            </Button>
          )}
          <Button variant="ghost" onClick={() => setAuto((a) => !a)} disabled={predicting}>
            {auto ? "⏸ Pause" : "▶ Auto-play"}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Convenience: the full Annotated Replay flow (index → one game). */
export function AnnotatedReplayFlow({ ctx, onHome }: { ctx: ModuleContext; onHome: () => void }) {
  const [game, setGame] = useState<ReplayGame | null>(null);
  void REPLAY_GAMES;
  if (game) {
    return <AnnotatedReplay ctx={ctx} game={game} onExit={() => setGame(null)} />;
  }
  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onHome}>
          ← Gambit home
        </Button>
      </div>
      <ReplayIndex onPick={setGame} />
    </div>
  );
}
