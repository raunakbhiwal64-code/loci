/**
 * Abacus — mental math & Vedic techniques (PRD 4.3 MVP).
 *
 * Module home (continue, technique path, sprint, ghost, chart, mixed review),
 * the Technique Dojo (see it → guided practice → drill), and SRS mixed review.
 * All scoring and answer-checking deterministic and offline; AI only phrases.
 */

import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext, RecallGrade, SrsItem } from "@loci/module-sdk";
import { ChartScreen } from "./chart.js";
import { ProblemCard } from "./problem.js";
import { AbacusStore, GUIDED_TARGET } from "./store.js";
import {
  TECHNIQUES,
  TRACKS,
  mulberry32,
  techniqueById,
  techniquesInTrack,
  type Problem,
  type Technique,
  type TechniqueId,
} from "./techniques.js";
import { SprintScreen } from "./sprint.js";

type View =
  | { v: "home" }
  | { v: "technique"; id: TechniqueId }
  | { v: "sprint"; scope?: TechniqueId; ghostFocus?: boolean }
  | { v: "chart" }
  | { v: "review" };

export function AbacusApp({ ctx }: { ctx: ModuleContext }) {
  const store = useMemo(() => new AbacusStore(ctx.storage), [ctx]);
  const [view, setView] = useState<View>({ v: "home" });

  const goHome = () => setView({ v: "home" });

  if (view.v === "technique") {
    return (
      <TechniqueScreen
        ctx={ctx}
        store={store}
        technique={techniqueById(view.id)}
        onExit={goHome}
        onDrill={() => setView({ v: "sprint", scope: view.id })}
      />
    );
  }
  if (view.v === "sprint") {
    return <SprintScreen ctx={ctx} store={store} fixedScope={view.scope} ghostFocus={view.ghostFocus} onExit={goHome} />;
  }
  if (view.v === "chart") {
    return <ChartScreen store={store} onExit={goHome} />;
  }
  if (view.v === "review") {
    return <ReviewScreen ctx={ctx} store={store} onExit={goHome} />;
  }

  return <Home ctx={ctx} store={store} onNavigate={setView} />;
}

/* ------------------------------------------------------------------ *
 * Home
 * ------------------------------------------------------------------ */

const STAGE_LABEL: Record<ReturnType<AbacusStore["stage"]>, string> = {
  new: "new ✨",
  learning: "learning…",
  "drill-ready": "drill ready!",
  mastered: "mastered ✓",
};

function Home({
  ctx,
  store,
  onNavigate,
}: {
  ctx: ModuleContext;
  store: AbacusStore;
  onNavigate: (v: View) => void;
}) {
  const last = store.lastVisited();
  const lastTech = last ? techniqueById(last.techniqueId) : undefined;
  const showContinue = lastTech && store.stage(lastTech.id) !== "mastered";
  const dueCount = ctx.srs.due("abacus").filter((i) => i.payloadRef.startsWith("technique:")).length;
  const masteredCount = TECHNIQUES.filter((t) => store.stage(t.id) === "mastered").length;

  return (
    <div className="stack">
      <GuideBubble>
        Welcome to the dojo! Here we don't memorise maths — we learn its tricks. {masteredCount > 0 ? `${masteredCount} technique${masteredCount === 1 ? "" : "s"} mastered so far. ` : ""}
        Pick a technique, or race your ghost.
      </GuideBubble>

      {showContinue && lastTech ? (
        <Card className="spread">
          <div>
            <div style={{ fontWeight: 700 }}>
              Continue: {lastTech.emoji} {lastTech.name}
            </div>
            <div className="ds-muted" style={{ fontSize: "0.85rem" }}>
              You were {STAGE_LABEL[store.stage(lastTech.id)]}
            </div>
          </div>
          <Button onClick={() => onNavigate({ v: "technique", id: lastTech.id })}>Jump back in →</Button>
        </Card>
      ) : null}

      <Display as="h3">Technique path</Display>
      {TRACKS.map((track) => (
        <Card key={track.track} className="stack" style={{ gap: 10 }}>
          <div style={{ fontWeight: 700 }}>
            {track.emoji} Track {track.track}: {track.name}
          </div>
          <div className="tiles">
            {techniquesInTrack(track.track).map((t) => (
              <button key={t.id} className="tile" onClick={() => onNavigate({ v: "technique", id: t.id })}>
                <span className="tile__emoji">{t.emoji}</span>
                <span className="tile__name" style={{ fontSize: "1rem" }}>
                  {t.name}
                </span>
                <span className="tile__blurb">{t.blurb}</span>
                <span className="pill">{STAGE_LABEL[store.stage(t.id)]}</span>
              </button>
            ))}
          </div>
        </Card>
      ))}

      <Display as="h3">Play</Display>
      <div className="tiles">
        <button className="tile" onClick={() => onNavigate({ v: "sprint" })}>
          <span className="tile__emoji">⚡</span>
          <span className="tile__name" style={{ fontSize: "1rem" }}>
            Sprint
          </span>
          <span className="tile__blurb">A gentle 60–90 second burst.</span>
        </button>
        <button className="tile" onClick={() => onNavigate({ v: "sprint", ghostFocus: true })}>
          <span className="tile__emoji">👻</span>
          <span className="tile__name" style={{ fontSize: "1rem" }}>
            Beat your ghost
          </span>
          <span className="tile__blurb">
            {store.hasAnyGhost() ? "Your past self is waiting…" : "Run a sprint to make a ghost."}
          </span>
        </button>
        <button className="tile" onClick={() => onNavigate({ v: "review" })}>
          <span className="tile__emoji">🌿</span>
          <span className="tile__name" style={{ fontSize: "1rem" }}>
            Mixed review
          </span>
          <span className="tile__blurb">{dueCount > 0 ? `${dueCount} technique${dueCount === 1 ? "" : "s"} ready to revisit.` : "Nothing due — techniques rest here."}</span>
        </button>
        <button className="tile" onClick={() => onNavigate({ v: "chart" })}>
          <span className="tile__emoji">📈</span>
          <span className="tile__name" style={{ fontSize: "1rem" }}>
            Mastery chart
          </span>
          <span className="tile__blurb">Watch your speed grow, sprint by sprint.</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Technique Dojo — see it → guided practice → drill
 * ------------------------------------------------------------------ */

function TechniqueScreen({
  ctx,
  store,
  technique,
  onExit,
  onDrill,
}: {
  ctx: ModuleContext;
  store: AbacusStore;
  technique: Technique;
  onExit: () => void;
  onDrill: () => void;
}) {
  const mastery = store.mastery(technique.id);
  const [stage, setStage] = useState<"overview" | "lesson" | "guided">("overview");

  useMemo(() => store.setLastVisited(technique.id), [store, technique.id]);

  if (stage === "lesson") {
    return (
      <LessonPlayer
        technique={technique}
        onDone={() => {
          const m = store.mastery(technique.id);
          if (!m.lesson) {
            store.setMastery(technique.id, { ...m, lesson: true });
            ctx.progression.award("calculation-number-sense", 10);
            ctx.analytics.emit({
              kind: "activity",
              action: "completed",
              moduleId: "abacus",
              skills: ["calculation-number-sense"],
              success: 1,
            });
          }
          setStage("overview");
        }}
        onExit={() => setStage("overview")}
      />
    );
  }

  if (stage === "guided") {
    return (
      <GuidedPractice
        ctx={ctx}
        store={store}
        technique={technique}
        onDone={() => setStage("overview")}
        onExit={() => setStage("overview")}
      />
    );
  }

  const stageNow = store.stage(technique.id);
  const guidedPct = Math.min(100, (mastery.guided / GUIDED_TARGET) * 100);

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onExit}>
          ← Dojo
        </Button>
        <span className="pill">{STAGE_LABEL[stageNow]}</span>
      </div>
      <Card className="center stack" style={{ gap: 10 }}>
        <div className="big-emoji">{technique.emoji}</div>
        <Display as="h3">{technique.name}</Display>
        <p className="ds-muted" style={{ margin: 0 }}>
          {technique.blurb}
        </p>
      </Card>

      <Card className="stack" style={{ gap: 12 }}>
        <div className="spread">
          <span style={{ fontWeight: 700 }}>1 · See it</span>
          <Button variant={mastery.lesson ? "ghost" : "solid"} onClick={() => setStage("lesson")}>
            {mastery.lesson ? "Watch again" : "Show me →"}
          </Button>
        </div>
        <div className="spread">
          <span style={{ fontWeight: 700 }}>2 · Try it with help</span>
          <Button
            variant={mastery.guided >= GUIDED_TARGET ? "ghost" : "solid"}
            disabled={!mastery.lesson}
            onClick={() => setStage("guided")}
          >
            {mastery.guided >= GUIDED_TARGET ? "Practise more" : `Guided practice →`}
          </Button>
        </div>
        {mastery.guided > 0 && mastery.guided < GUIDED_TARGET ? <ProgressRibbon value={guidedPct} /> : null}
        <div className="spread">
          <span style={{ fontWeight: 700 }}>3 · Drill it</span>
          <Button disabled={mastery.guided < GUIDED_TARGET} onClick={onDrill}>
            {mastery.drill ? "Drill again →" : mastery.guided >= GUIDED_TARGET ? "Unlock the drill →" : "Finish step 2 first"}
          </Button>
        </div>
      </Card>

      {mastery.drill ? (
        <GuideBubble>This technique is in your mixed-review garden now — it'll pop up again just before you'd forget it. That's the trick to remembering forever.</GuideBubble>
      ) : null}
    </div>
  );
}

/* ---- lesson: stepped worked example ---- */

function LessonPlayer({
  technique,
  onDone,
  onExit,
}: {
  technique: Technique;
  onDone: () => void;
  onExit: () => void;
}) {
  const [shown, setShown] = useState(1);
  const total = technique.lessonSteps.length;
  const done = shown >= total;

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onExit}>
          ← Back
        </Button>
        <span className="pill">
          {technique.emoji} {technique.name}
        </span>
      </div>
      <GuideBubble>{technique.lessonIntro}</GuideBubble>
      <ProgressRibbon value={(shown / total) * 100} />
      <Card className="stack" style={{ gap: 10 }}>
        {technique.lessonSteps.slice(0, shown).map((line, i) => (
          <p
            key={i}
            style={{
              margin: 0,
              fontSize: i === shown - 1 ? "1.15rem" : "1rem",
              fontWeight: i === shown - 1 ? 700 : 400,
              lineHeight: 1.6,
            }}
          >
            {line}
          </p>
        ))}
      </Card>
      {done ? (
        <Button big onClick={onDone}>
          I see the trick! →
        </Button>
      ) : (
        <Button big onClick={() => setShown((s) => s + 1)}>
          Next →
        </Button>
      )}
    </div>
  );
}

/* ---- guided practice: 5 problems with per-step scaffolding ---- */

function GuidedPractice({
  ctx,
  store,
  technique,
  onDone,
  onExit,
}: {
  ctx: ModuleContext;
  store: AbacusStore;
  technique: Technique;
  onDone: () => void;
  onExit: () => void;
}) {
  const [problems] = useState<Problem[]>(() => {
    const rng = mulberry32((Date.now() % 0xffffffff) ^ 0x600d);
    const difficulty = store.adaptive(technique.id).difficulty;
    return Array.from({ length: GUIDED_TARGET }, () => technique.generate(difficulty, rng));
  });
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState(0);
  const [started] = useState(() => {
    ctx.analytics.emit({
      kind: "activity",
      action: "started",
      moduleId: "abacus",
      skills: ["calculation-number-sense"],
    });
    return Date.now();
  });

  if (idx >= problems.length) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">{hits === problems.length ? "🏆" : "🌟"}</div>
          <Display as="h3">
            {hits}/{problems.length} on your own steam!
          </Display>
          <p className="ds-muted">
            {store.mastery(technique.id).guided >= GUIDED_TARGET
              ? "The drill is unlocked — ready when you are."
              : "A little more guided practice and the drill unlocks."}
          </p>
          <Button big onClick={onDone}>
            Back to {technique.name} →
          </Button>
        </Card>
      </div>
    );
  }

  const finishOne = (correct: boolean) => {
    const m = store.mastery(technique.id);
    store.setMastery(technique.id, { ...m, guided: m.guided + 1 });
    const isLast = idx + 1 >= problems.length;
    if (isLast) {
      const finalHits = hits + (correct ? 1 : 0);
      ctx.progression.award("calculation-number-sense", 8 + finalHits * 2);
      ctx.analytics.emit({
        kind: "activity",
        action: "completed",
        moduleId: "abacus",
        skills: ["calculation-number-sense"],
        success: finalHits / problems.length,
        timeMs: Date.now() - started,
        difficulty: problems[0].difficulty,
      });
    }
    if (correct) setHits((h) => h + 1);
    setIdx((i) => i + 1);
  };

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onExit}>
          ← Back
        </Button>
        <span className="pill">
          {technique.emoji} {technique.name}
        </span>
      </div>
      <ProgressRibbon value={(idx / problems.length) * 100} />
      <ProblemCard
        key={idx}
        ctx={ctx}
        problem={problems[idx]}
        scaffold
        pillText={`Problem ${idx + 1} of ${problems.length}`}
        onAnswered={(correct) => store.recordOutcome(technique.id, correct)}
        onNext={finishOne}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SRS mixed review — due techniques, three problems each
 * ------------------------------------------------------------------ */

const PROBLEMS_PER_ITEM = 3;

interface ReviewItem {
  srs: SrsItem;
  techniqueId: TechniqueId;
}

function ReviewScreen({ ctx, store, onExit }: { ctx: ModuleContext; store: AbacusStore; onExit: () => void }) {
  const [items] = useState<ReviewItem[]>(() => {
    const known = new Set(TECHNIQUES.map((t) => t.id as string));
    return ctx.srs
      .due("abacus")
      .filter((i) => i.payloadRef.startsWith("technique:") && known.has(i.payloadRef.slice("technique:".length)))
      .map((i) => ({ srs: i, techniqueId: i.payloadRef.slice("technique:".length) as TechniqueId }));
  });
  const [rng] = useState(() => mulberry32((Date.now() % 0xffffffff) ^ 0x5e5));
  const [itemIdx, setItemIdx] = useState(0);
  const [probIdx, setProbIdx] = useState(0);
  const [itemHits, setItemHits] = useState(0);
  const [totalHits, setTotalHits] = useState(0);
  const [problem, setProblem] = useState<Problem | undefined>(() => {
    if (items.length === 0) return undefined;
    const first = items[0];
    return techniqueById(first.techniqueId).generate(store.adaptive(first.techniqueId).difficulty, rng);
  });

  if (items.length === 0) {
    return (
      <div className="stack">
        <Display as="h3">Mixed review</Display>
        <Card className="center stack">
          <div className="big-emoji">🌿</div>
          <p className="ds-muted">
            Nothing to review right now — your techniques are resting happily. Master a technique's drill and it joins
            the review garden.
          </p>
          <Button onClick={onExit}>Back</Button>
        </Card>
      </div>
    );
  }

  if (itemIdx >= items.length || !problem) {
    const totalProblems = items.length * PROBLEMS_PER_ITEM;
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">🌱</div>
          <Display as="h3">Review done — {totalHits}/{totalProblems}!</Display>
          <p className="ds-muted">Coming back at just the right moment is how techniques take root. See you next time they sprout.</p>
          <Button big onClick={onExit}>
            Back home →
          </Button>
        </Card>
      </div>
    );
  }

  const current = items[itemIdx];
  const technique = techniqueById(current.techniqueId);

  const advance = (correct: boolean) => {
    const hits = itemHits + (correct ? 1 : 0);
    if (correct) setTotalHits((t) => t + 1);
    if (probIdx + 1 >= PROBLEMS_PER_ITEM) {
      // Grade this technique's memory and let the shared SRS reschedule it.
      const grade: RecallGrade = hits === PROBLEMS_PER_ITEM ? "good" : hits === PROBLEMS_PER_ITEM - 1 ? "hard" : "again";
      ctx.srs.review(current.srs.id, grade);
      ctx.analytics.emit({
        kind: "review",
        action: hits >= PROBLEMS_PER_ITEM - 1 ? "recalled" : "missed",
        moduleId: "abacus",
        intervalDays: current.srs.intervalDays,
      });
      const nextItem = itemIdx + 1;
      setItemIdx(nextItem);
      setProbIdx(0);
      setItemHits(0);
      if (nextItem >= items.length) {
        ctx.progression.award("metacognition", 4);
        ctx.progression.award("calculation-number-sense", 5 + totalHits + (correct ? 1 : 0));
        ctx.analytics.emit({
          kind: "activity",
          action: "completed",
          moduleId: "abacus",
          skills: ["calculation-number-sense", "metacognition"],
          success: (totalHits + (correct ? 1 : 0)) / (items.length * PROBLEMS_PER_ITEM),
        });
        setProblem(undefined);
      } else {
        const t = items[nextItem].techniqueId;
        setProblem(techniqueById(t).generate(store.adaptive(t).difficulty, rng));
      }
    } else {
      setItemHits(hits);
      setProbIdx((p) => p + 1);
      setProblem(technique.generate(store.adaptive(technique.id).difficulty, rng));
    }
  };

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onExit}>
          ← Back
        </Button>
        <span className="pill">
          {technique.emoji} {technique.name} · {itemIdx + 1} of {items.length}
        </span>
      </div>
      <ProgressRibbon value={((itemIdx * PROBLEMS_PER_ITEM + probIdx) / (items.length * PROBLEMS_PER_ITEM)) * 100} />
      <ProblemCard
        key={`${itemIdx}:${probIdx}`}
        ctx={ctx}
        problem={problem}
        pillText={`Remembering ${technique.name} · ${probIdx + 1}/${PROBLEMS_PER_ITEM}`}
        onAnswered={(correct) => store.recordOutcome(technique.id, correct)}
        onNext={advance}
      />
    </div>
  );
}
