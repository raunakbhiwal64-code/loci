import { useEffect, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { ALL_WORDS, findWord, type WordEntry } from "./words.js";
import { blankWord, fromPayloadRef, sample, shuffle } from "./lib.js";
import { Choices } from "./Choices.js";

/**
 * SRS review (PRD 4.6) — Lexicon is the review engine's second-biggest
 * client after Memora. Due word cards get a quick recall test, alternating
 * between "pick the meaning" and "fill the word into its sentence".
 * Grades flow back into the shared scheduler: right → "good", miss → "again".
 */

const MAX_PER_SESSION = 10;

type QuestionKind = "meaning" | "sentence";

interface ReviewQuestion {
  srsId: string;
  entry: WordEntry;
  kind: QuestionKind;
  options: string[];
  correct: number;
}

function buildQueue(ctx: ModuleContext): ReviewQuestion[] {
  const due = ctx.srs.due("lexicon").slice(0, MAX_PER_SESSION);
  const questions: ReviewQuestion[] = [];
  due.forEach((item, i) => {
    const word = fromPayloadRef(item.payloadRef);
    const entry = word ? findWord(word) : undefined;
    if (!entry) return;
    const kind: QuestionKind = i % 2 === 0 ? "meaning" : "sentence";
    const others = ALL_WORDS.filter((w) => w.word !== entry.word);
    const options =
      kind === "meaning"
        ? shuffle([entry.meaning, ...sample(others, 2).map((w) => w.meaning)])
        : shuffle([entry.word, ...sample(others, 2).map((w) => w.word)]);
    questions.push({
      srsId: item.id,
      entry,
      kind,
      options,
      correct: options.indexOf(kind === "meaning" ? entry.meaning : entry.word),
    });
  });
  return questions;
}

export function ReviewMode({
  ctx,
  onFinished,
  onExit,
}: {
  ctx: ModuleContext;
  onFinished: (recalled: number, total: number) => void;
  onExit: () => void;
}) {
  const [queue] = useState<ReviewQuestion[]>(() => buildQueue(ctx));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [recalled, setRecalled] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (queue.length > 0) {
      ctx.analytics.emit({ kind: "review", action: "due", moduleId: "lexicon" });
      ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "lexicon", skills: ["vocabulary"] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (queue.length === 0) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">🌤️</div>
          <Display as="h3">Nothing due right now</Display>
          <p className="ds-muted">Your words are resting and getting stronger. Learn a few new ones instead?</p>
          <Button big onClick={onExit}>Back home</Button>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">{recalled === queue.length ? "🏆" : "📮"}</div>
          <Display as="h3">You remembered {recalled} of {queue.length}!</Display>
          <p className="ds-muted">
            Every review makes a word stick longer. The tricky ones will visit again a little sooner — that's the plan
            working, not a problem.
          </p>
          <Button big onClick={onExit}>Back home</Button>
        </Card>
      </div>
    );
  }

  const q = queue[idx];
  const { entry } = q;

  const answer = (i: number) => {
    setPicked(i);
    const hit = i === q.correct;
    if (hit) setRecalled((r) => r + 1);
    ctx.analytics.emit({ kind: "review", action: "attempted", moduleId: "lexicon" });
    ctx.analytics.emit({ kind: "review", action: hit ? "recalled" : "missed", moduleId: "lexicon" });
    ctx.srs.review(q.srsId, hit ? "good" : "again");
  };

  const next = () => {
    const score = recalled;
    if (idx + 1 >= queue.length) {
      ctx.progression.award("vocabulary", 5 + score * 4);
      ctx.analytics.emit({
        kind: "activity",
        action: "completed",
        moduleId: "lexicon",
        skills: ["vocabulary"],
        success: score / queue.length,
      });
      onFinished(score, queue.length);
      setDone(true);
    } else {
      setIdx(idx + 1);
      setPicked(null);
    }
  };

  return (
    <div className="stack">
      <ProgressRibbon value={((idx + 1) / queue.length) * 100} />
      <span className="pill">Review {idx + 1} of {queue.length}</span>
      <Card className="stack">
        {q.kind === "meaning" ? (
          <>
            <div className="center">
              <div className="big-emoji">{entry.emoji}</div>
              <Display as="h3">What does <span style={{ color: "var(--accent)" }}>{entry.word}</span> mean?</Display>
            </div>
            <Choices options={q.options} picked={picked} correctIndex={q.correct} onPick={answer} />
          </>
        ) : (
          <>
            <Display as="h3">Which of your words fits?</Display>
            <p style={{ fontSize: "1.15rem", lineHeight: 1.7, margin: 0 }}>{blankWord(entry.sentence, entry.word)}</p>
            <Choices options={q.options} picked={picked} correctIndex={q.correct} onPick={answer} />
          </>
        )}
        {picked !== null && (
          <>
            <GuideBubble>
              {picked === q.correct
                ? `Still yours! ${entry.emoji} ${entry.word} — ${entry.meaning}.`
                : `It slipped — happens to every collector. ${entry.word} means "${entry.meaning}". It'll come back soon.`}
            </GuideBubble>
            <Button big onClick={next}>{idx + 1 >= queue.length ? "Finish →" : "Next →"}</Button>
          </>
        )}
      </Card>
    </div>
  );
}
