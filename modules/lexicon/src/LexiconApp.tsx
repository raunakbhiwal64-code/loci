import { useState } from "react";
import { Display, GuideBubble } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { packFor } from "./words.js";
import { LearnFlow } from "./LearnFlow.js";
import { CollectionView } from "./CollectionView.js";
import { AnalogyMode } from "./AnalogyMode.js";
import { OddOneOutMode } from "./OddOneOutMode.js";
import { ReviewMode } from "./ReviewMode.js";

/**
 * Lexicon home — vocabulary and verbal reasoning on the shared spine
 * (PRD 4.6). Five doors: Learn new words, My Collection, Analogies,
 * Odd one out, and SRS Review. Per-mode progress lives in ctx.storage;
 * learning/reviewing awards "vocabulary" xp, the reasoning drills award
 * "verbal-reasoning" xp.
 */

type Mode = "home" | "learn" | "collection" | "analogies" | "oddoneout" | "review";

export interface LexiconStats {
  learnSessions: number;
  wordsMastered: number;
  analogiesAnswered: number;
  analogiesCorrect: number;
  oddPoints: number;
  oddPointsMax: number;
  reviewsDone: number;
  reviewsRecalled: number;
}

const EMPTY_STATS: LexiconStats = {
  learnSessions: 0,
  wordsMastered: 0,
  analogiesAnswered: 0,
  analogiesCorrect: 0,
  oddPoints: 0,
  oddPointsMax: 0,
  reviewsDone: 0,
  reviewsRecalled: 0,
};

const COLLECTED_KEY = "collected";
const STATS_KEY = "stats";

export function LexiconApp({ ctx }: { ctx: ModuleContext }) {
  const [mode, setMode] = useState<Mode>("home");
  const [collected, setCollected] = useState<string[]>(() => ctx.storage.get<string[]>(COLLECTED_KEY) ?? []);

  const pack = packFor(ctx.profile.current().ageBand);

  const collect = (word: string) => {
    setCollected((prev) => {
      if (prev.includes(word)) return prev;
      const next = [...prev, word];
      ctx.storage.set(COLLECTED_KEY, next);
      return next;
    });
  };

  const bumpStats = (patch: Partial<LexiconStats>) => {
    const current = { ...EMPTY_STATS, ...(ctx.storage.get<LexiconStats>(STATS_KEY) ?? {}) };
    const next = { ...current };
    (Object.keys(patch) as (keyof LexiconStats)[]).forEach((k) => {
      next[k] = current[k] + (patch[k] ?? 0);
    });
    ctx.storage.set(STATS_KEY, next);
  };

  const goHome = () => setMode("home");

  if (mode === "learn") {
    return (
      <LearnFlow
        ctx={ctx}
        pack={pack}
        collected={collected}
        onCollect={collect}
        onFinished={(mastered) => bumpStats({ learnSessions: 1, wordsMastered: mastered })}
        onExit={goHome}
      />
    );
  }
  if (mode === "collection") {
    return <CollectionView ctx={ctx} pack={pack} collected={collected} onExit={goHome} />;
  }
  if (mode === "analogies") {
    return (
      <AnalogyMode
        ctx={ctx}
        onFinished={(right, total) => bumpStats({ analogiesCorrect: right, analogiesAnswered: total })}
        onExit={goHome}
      />
    );
  }
  if (mode === "oddoneout") {
    return (
      <OddOneOutMode
        ctx={ctx}
        onFinished={(right, total) => bumpStats({ oddPoints: right, oddPointsMax: total })}
        onExit={goHome}
      />
    );
  }
  if (mode === "review") {
    return (
      <ReviewMode
        ctx={ctx}
        onFinished={(recalled, total) => bumpStats({ reviewsDone: total, reviewsRecalled: recalled })}
        onExit={goHome}
      />
    );
  }

  /* ---------- home ---------- */

  const collectedCount = pack.words.filter((w) => collected.includes(w.word)).length;
  const dueCount = ctx.srs.due("lexicon").length;

  return (
    <div className="stack">
      <GuideBubble>
        Every word you collect is a key that opens something. Meet a few in a tiny story, then make them yours.
      </GuideBubble>
      <Display as="h3">What shall we do with words today?</Display>
      <div className="tiles">
        <button className="tile" onClick={() => setMode("learn")}>
          <span className="tile__emoji">🌱</span>
          <span className="tile__name">Learn new words</span>
          <span className="tile__blurb">Meet up to 4 new words in tiny stories</span>
        </button>
        <button className="tile" onClick={() => setMode("collection")}>
          <span className="tile__emoji">🎴</span>
          <span className="tile__name">My Collection</span>
          <span className="tile__blurb">
            {collectedCount} of {pack.words.length} cards collected
          </span>
        </button>
        <button className="tile" onClick={() => setMode("analogies")}>
          <span className="tile__emoji">🔗</span>
          <span className="tile__name">Analogies</span>
          <span className="tile__blurb">hot : cold :: big : ___ ?</span>
        </button>
        <button className="tile" onClick={() => setMode("oddoneout")}>
          <span className="tile__emoji">🕵️</span>
          <span className="tile__name">Odd one out</span>
          <span className="tile__blurb">Find it — and say why</span>
        </button>
        <button className="tile" onClick={() => setMode("review")}>
          <span className="tile__emoji">📮</span>
          <span className="tile__name">Review</span>
          <span className="tile__blurb">
            {dueCount > 0 ? `${dueCount} card${dueCount === 1 ? "" : "s"} ready for review` : "No cards due — all fresh"}
          </span>
        </button>
      </div>
    </div>
  );
}
