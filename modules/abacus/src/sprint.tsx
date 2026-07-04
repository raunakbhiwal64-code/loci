/**
 * Sprint mode + Beat Your Ghost (PRD 4.3).
 *
 * 60–90 second drills, problems-per-minute at the run's accuracy. Timers are
 * gentle: a softly filling ribbon, no countdown numbers screaming, no red
 * flashes on mistakes. The only rival is your own previous best — the ghost.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { WrongCoach } from "./problem.js";
import { GUIDED_TARGET, type AbacusStore, type GhostBest, type SprintScope } from "./store.js";
import { TECHNIQUES, mulberry32, techniqueById, type Problem, type TechniqueId } from "./techniques.js";

/** Accuracy a run needs before it can become your ghost (keeps ghosts honest). */
const GHOST_MIN_ACCURACY = 0.8;

interface AnswerLog {
  atMs: number;
  correct: boolean;
  problem: Problem;
  childAnswer: number;
}

interface RunResult {
  scope: SprintScope;
  durationSec: number;
  attempted: number;
  correct: number;
  ppm: number;
  accuracy: number;
  wrongs: AnswerLog[];
  beatGhost: boolean;
  hadGhost: boolean;
  newGhost: boolean;
}

/* ------------------------------------------------------------------ *
 * Problem feed — mixed sprints rotate through techniques the child knows
 * ------------------------------------------------------------------ */

function mixedPool(store: AbacusStore): TechniqueId[] {
  const known = TECHNIQUES.filter((t) => {
    const m = store.mastery(t.id);
    return m.guided >= GUIDED_TARGET || m.drill;
  }).map((t) => t.id);
  // Before anything is learned, warm up on the two friendliest foundations.
  return known.length > 0 ? known : ["complements", "double-halve"];
}

function nextProblem(scope: SprintScope, store: AbacusStore, rng: () => number): Problem {
  const id: TechniqueId =
    scope === "mixed" ? mixedPool(store)[Math.floor(rng() * mixedPool(store).length)] : scope;
  const difficulty = store.adaptive(id).difficulty;
  return techniqueById(id).generate(difficulty, rng);
}

/* ------------------------------------------------------------------ *
 * SprintScreen — setup → run → results
 * ------------------------------------------------------------------ */

export function SprintScreen({
  ctx,
  store,
  fixedScope,
  ghostFocus,
  onExit,
}: {
  ctx: ModuleContext;
  store: AbacusStore;
  /** When set (from a technique's drill button), the picker is skipped. */
  fixedScope?: SprintScope;
  /** Beat Your Ghost entry: only offer scopes that already have a ghost. */
  ghostFocus?: boolean;
  onExit: () => void;
}) {
  const [scope, setScope] = useState<SprintScope | undefined>(fixedScope);
  const [durationSec, setDurationSec] = useState(60);
  const [result, setResult] = useState<RunResult | undefined>(undefined);
  const [running, setRunning] = useState(false);

  if (result) {
    return <SprintResults ctx={ctx} result={result} onAgain={() => setResult(undefined)} onExit={onExit} />;
  }

  if (running && scope) {
    return (
      <SprintRun
        ctx={ctx}
        store={store}
        scope={scope}
        durationSec={durationSec}
        onDone={(r) => {
          setRunning(false);
          setResult(r);
        }}
      />
    );
  }

  const scopes: { id: SprintScope; label: string; emoji: string }[] = [
    { id: "mixed", label: "Mixed bag", emoji: "🎒" },
    ...TECHNIQUES.map((t) => ({ id: t.id as SprintScope, label: t.name, emoji: t.emoji })),
  ];
  const offered = ghostFocus ? scopes.filter((s) => store.best(s.id, 60) || store.best(s.id, 90)) : scopes;

  return (
    <div className="stack">
      <GuideBubble>
        {ghostFocus
          ? "Ghost time! Pick a drill you've run before — your past self is waiting at the start line. 👻"
          : "A sprint is a short burst — solve as many as you comfortably can. The clock fills up gently; no rush, just rhythm."}
      </GuideBubble>
      <Display as="h3">{ghostFocus ? "Beat your ghost" : "Sprint"}</Display>

      {offered.length === 0 ? (
        <Card className="center stack">
          <div className="big-emoji">👻</div>
          <p className="ds-muted">No ghosts yet! Run any sprint first — it becomes the ghost you'll race next time.</p>
          <Button onClick={onExit}>Back</Button>
        </Card>
      ) : (
        <>
          <Card className="stack" style={{ gap: 10 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>What are we drilling?</p>
            <div className="row wrap">
              {offered.map((s) => (
                <button
                  key={s.id}
                  className="choice"
                  style={{ fontSize: "0.9rem" }}
                  aria-pressed={scope === s.id}
                  onClick={() => setScope(s.id)}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
            <p style={{ margin: 0, fontWeight: 700 }}>How long?</p>
            <div className="row">
              {[60, 90].map((sec) => (
                <button
                  key={sec}
                  className="choice"
                  style={{ fontSize: "0.9rem" }}
                  aria-pressed={durationSec === sec}
                  onClick={() => setDurationSec(sec)}
                >
                  {sec} seconds
                </button>
              ))}
            </div>
            {scope ? <GhostPreview store={store} scope={scope} durationSec={durationSec} /> : null}
          </Card>
          <div className="row">
            <Button big disabled={!scope} onClick={() => setRunning(true)}>
              Start sprint →
            </Button>
            <Button variant="ghost" onClick={onExit}>
              Back
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function GhostPreview({ store, scope, durationSec }: { store: AbacusStore; scope: SprintScope; durationSec: number }) {
  const best = store.best(scope, durationSec);
  return (
    <p className="ds-muted" style={{ margin: 0 }}>
      {best
        ? `👻 Your ghost here: ${best.correct} solved (${best.ppm.toFixed(1)} per minute). Think you can wave as you pass?`
        : "👻 No ghost on this course yet — this run will become one!"}
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * The run itself
 * ------------------------------------------------------------------ */

function SprintRun({
  ctx,
  store,
  scope,
  durationSec,
  onDone,
}: {
  ctx: ModuleContext;
  store: AbacusStore;
  scope: SprintScope;
  durationSec: number;
  onDone: (r: RunResult) => void;
}) {
  const startRef = useRef(Date.now());
  const rngRef = useRef(mulberry32((Date.now() % 0xffffffff) ^ 0xabac05));
  const logRef = useRef<AnswerLog[]>([]);
  const doneRef = useRef(false);

  const ghost = useMemo(() => store.best(scope, durationSec), [store, scope, durationSec]);

  const [problem, setProblem] = useState<Problem>(() => nextProblem(scope, store, rngRef.current));
  const [value, setValue] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(0);
  const [flash, setFlash] = useState<"ok" | "skip" | null>(null);

  useEffect(() => {
    ctx.analytics.emit({
      kind: "activity",
      action: "started",
      moduleId: "abacus",
      skills: ["calculation-number-sense", "sustained-attention"],
    });
    const tick = window.setInterval(() => {
      const e = (Date.now() - startRef.current) / 1000;
      setElapsed(e);
      if (e >= durationSec && !doneRef.current) {
        doneRef.current = true;
        window.clearInterval(tick);
        finish();
      }
    }, 200);
    return () => window.clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    const log = logRef.current;
    const attempted = log.length;
    const correct = log.filter((l) => l.correct).length;
    const accuracy = attempted > 0 ? correct / attempted : 0;
    const ppm = correct / (durationSec / 60);

    // Build this run's racing line: cumulative correct per elapsed second.
    const timeline: number[] = [];
    for (let s = 0; s < durationSec; s++) {
      timeline.push(log.filter((l) => l.correct && l.atMs <= (s + 1) * 1000).length);
    }

    const prev = store.best(scope, durationSec);
    const beatGhost = !!prev && correct > prev.correct;
    const qualifies = attempted >= 3 && accuracy >= GHOST_MIN_ACCURACY;
    const newGhost = qualifies && (!prev || correct > prev.correct);
    if (newGhost) {
      const best: GhostBest = { at: Date.now(), correct, attempted, ppm, timeline };
      store.setBest(scope, durationSec, best);
    }

    store.addRun({ at: Date.now(), scope, durationSec, attempted, correct, ppm, accuracy });

    // First completed drill on a technique = mastery + a seat in mixed review.
    if (scope !== "mixed") {
      const m = store.mastery(scope);
      if (!m.drill && attempted >= 3) {
        store.setMastery(scope, { ...m, drill: true });
        ctx.srs.schedule("abacus", `technique:${scope}`);
        ctx.analytics.emit({ kind: "progression", action: "mastery", moduleId: "abacus", value: 1 });
      }
    }

    ctx.progression.award("calculation-number-sense", 5 + correct);
    ctx.progression.award("sustained-attention", durationSec >= 90 ? 8 : 5);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "abacus",
      skills: ["calculation-number-sense", "sustained-attention"],
      success: accuracy,
      timeMs: durationSec * 1000,
    });

    onDone({
      scope,
      durationSec,
      attempted,
      correct,
      ppm,
      accuracy,
      wrongs: log.filter((l) => !l.correct).slice(0, 3),
      beatGhost,
      hadGhost: !!prev,
      newGhost,
    });
  };

  const answer = (given: number) => {
    if (doneRef.current) return;
    const correct = given === problem.answer;
    logRef.current.push({ atMs: Date.now() - startRef.current, correct, problem, childAnswer: given });
    store.recordOutcome(problem.techniqueId, correct);
    if (correct) setSolved((s) => s + 1);
    setFlash(correct ? "ok" : "skip");
    window.setTimeout(() => setFlash(null), 450);
    setValue("");
    setProblem(nextProblem(scope, store, rngRef.current));
  };

  const submitTyped = () => {
    const n = Number.parseInt(value.trim(), 10);
    if (Number.isNaN(n)) return;
    answer(n);
  };

  const sec = Math.min(Math.floor(elapsed), durationSec - 1);
  const ghostNow = ghost ? ghost.timeline[Math.min(sec, ghost.timeline.length - 1)] : undefined;
  const raceMax = Math.max(solved, ghost?.correct ?? 0, 5);

  return (
    <div className="stack">
      <div className="stack" style={{ gap: 6 }}>
        <div className="spread">
          <span className="pill">🌤 sand timer</span>
          <span className="pill">
            {flash === "ok" ? "✓ lovely" : flash === "skip" ? "we'll peek at that one after" : `${solved} solved`}
          </span>
        </div>
        <ProgressRibbon value={(elapsed / durationSec) * 100} />
      </div>

      <Card className="center stack" style={{ gap: 14 }}>
        <Display as="h2">{problem.prompt}</Display>
        {problem.choices ? (
          <div className="row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
            {problem.choices.map((c) => (
              <Button key={c.value} big variant="ghost" onClick={() => answer(c.value)}>
                {c.label}
              </Button>
            ))}
          </div>
        ) : (
          <div className="row" style={{ justifyContent: "center" }}>
            <input
              className="text"
              style={{ maxWidth: 160, textAlign: "center", fontSize: "1.5rem" }}
              inputMode="numeric"
              autoFocus
              aria-label="your answer"
              placeholder="?"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d-]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitTyped();
              }}
            />
            <Button big onClick={submitTyped} disabled={value.trim() === ""}>
              Go
            </Button>
          </div>
        )}
      </Card>

      <Card className="stack" style={{ gap: 8 }}>
        <div className="spread">
          <span style={{ fontWeight: 700 }}>You</span>
          <span>{solved}</span>
        </div>
        <ProgressRibbon value={(solved / raceMax) * 100} />
        {ghost && ghostNow !== undefined ? (
          <>
            <div className="spread">
              <span className="ds-muted">👻 Your ghost</span>
              <span className="ds-muted">{ghostNow}</span>
            </div>
            <div style={{ opacity: 0.55 }}>
              <ProgressRibbon value={(ghostNow / raceMax) * 100} />
            </div>
          </>
        ) : null}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Results — warm, and the tricky ones get their moment
 * ------------------------------------------------------------------ */

function SprintResults({
  ctx,
  result,
  onAgain,
  onExit,
}: {
  ctx: ModuleContext;
  result: RunResult;
  onAgain: () => void;
  onExit: () => void;
}) {
  const [coachIdx, setCoachIdx] = useState<number | null>(null);

  const headline = result.beatGhost
    ? "You waved at your ghost on the way past! 👻💨"
    : result.newGhost && !result.hadGhost
      ? "First run on this course — you just became your own ghost!"
      : "Sprint done — every run makes the next one smoother.";

  return (
    <div className="stack">
      <Card className="center stack" style={{ gap: 10 }}>
        <div className="big-emoji">{result.beatGhost ? "🏆" : "🌟"}</div>
        <Display as="h3">{headline}</Display>
        <div className="row" style={{ justifyContent: "center" }}>
          <span className="pill">{result.correct} solved</span>
          <span className="pill">{result.ppm.toFixed(1)} per minute</span>
          <span className="pill">{Math.round(result.accuracy * 100)}% on target</span>
        </div>
        {result.newGhost ? (
          <p className="ds-muted" style={{ margin: 0 }}>
            This run is your new ghost. Future you, watch out.
          </p>
        ) : null}
      </Card>

      {result.wrongs.length > 0 ? (
        <Card className="stack" style={{ gap: 10 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>The tricky ones (worth a peek 👀)</p>
          {result.wrongs.map((w, i) => (
            <div key={i} className="stack" style={{ gap: 8 }}>
              <div className="spread">
                <span>{w.problem.prompt}</span>
                {coachIdx === i ? null : (
                  <Button variant="ghost" onClick={() => setCoachIdx(i)}>
                    Show me
                  </Button>
                )}
              </div>
              {coachIdx === i ? (
                <WrongCoach
                  ctx={ctx}
                  problem={w.problem}
                  childAnswer={w.childAnswer}
                  onGotIt={() => {
                    ctx.progression.award("metacognition", 2);
                    setCoachIdx(null);
                  }}
                />
              ) : null}
            </div>
          ))}
        </Card>
      ) : null}

      <div className="row">
        <Button big onClick={onAgain}>
          Run it again →
        </Button>
        <Button variant="ghost" onClick={onExit}>
          Back home
        </Button>
      </div>
    </div>
  );
}
