import { useEffect, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import type { WordEntry, WordPack } from "./words.js";
import { blankWord, sample, shuffle, toPayloadRef } from "./lib.js";
import { Choices } from "./Choices.js";

/**
 * Learn flow (PRD 4.6): meet 3–5 new words per session, ALWAYS in context
 * first. Per word: micro-story → meaning reveal → quick check (pick the
 * meaning) → fill the word into a fresh sentence. Both checks right on the
 * first try → the word is mastered: it joins the collection and schedules
 * onto the shared SRS. Misses are never dramatised — the word simply comes
 * back next session.
 */

const WORDS_PER_SESSION = 4;

type Step = "story" | "meaning" | "checkMeaning" | "checkSentence" | "wordDone" | "summary";

interface SessionWord {
  entry: WordEntry;
  meaningOptions: string[];
  meaningCorrect: number;
  wordOptions: string[];
  wordCorrect: number;
}

function buildSession(pack: WordPack, collected: string[]): SessionWord[] {
  const remaining = pack.words.filter((w) => !collected.includes(w.word));
  return sample(remaining, Math.min(WORDS_PER_SESSION, remaining.length)).map((entry) => {
    const others = pack.words.filter((w) => w.word !== entry.word);
    const meaningOptions = shuffle([entry.meaning, ...sample(others, 2).map((w) => w.meaning)]);
    const wordOptions = shuffle([entry.word, ...sample(others, 2).map((w) => w.word)]);
    return {
      entry,
      meaningOptions,
      meaningCorrect: meaningOptions.indexOf(entry.meaning),
      wordOptions,
      wordCorrect: wordOptions.indexOf(entry.word),
    };
  });
}

export function LearnFlow({
  ctx,
  pack,
  collected,
  onCollect,
  onFinished,
  onExit,
}: {
  ctx: ModuleContext;
  pack: WordPack;
  collected: string[];
  onCollect: (word: string) => void;
  onFinished: (mastered: number, met: number) => void;
  onExit: () => void;
}) {
  const [session] = useState(() => buildSession(pack, collected));
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState<Step>("story");
  const [meaningPick, setMeaningPick] = useState<number | null>(null);
  const [sentencePick, setSentencePick] = useState<number | null>(null);
  const [meaningRight, setMeaningRight] = useState(false);
  const [mastered, setMastered] = useState<string[]>([]);

  useEffect(() => {
    if (session.length > 0) {
      ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "lexicon", skills: ["vocabulary"] });
    }
    // fire once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (session.length === 0) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">🎓</div>
          <Display as="h3">You've collected every word in this pack!</Display>
          <p className="ds-muted">Amazing. Keep them fresh in Review, or flex them in Analogies.</p>
          <Button big onClick={onExit}>Back home</Button>
        </Card>
      </div>
    );
  }

  const current = session[idx];
  const { entry } = current;
  const progress = ((idx + (step === "wordDone" ? 1 : 0)) / session.length) * 100;

  const nextWord = () => {
    if (idx + 1 >= session.length) {
      finishSession();
    } else {
      setIdx(idx + 1);
      setStep("story");
      setMeaningPick(null);
      setSentencePick(null);
      setMeaningRight(false);
    }
  };

  const finishSession = () => {
    const xp = 10 + mastered.length * 8;
    ctx.progression.award("vocabulary", xp);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "lexicon",
      skills: ["vocabulary"],
      success: session.length > 0 ? mastered.length / session.length : 1,
    });
    onFinished(mastered.length, session.length);
    setStep("summary");
  };

  const masterWord = () => {
    setMastered((m) => [...m, entry.word]);
    onCollect(entry.word);
    ctx.srs.schedule("lexicon", toPayloadRef(entry.word));
    ctx.analytics.emit({ kind: "progression", action: "mastery", moduleId: "lexicon", skillId: "vocabulary" });
  };

  /* ---------- steps ---------- */

  if (step === "summary") {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">{mastered.length === session.length ? "🏆" : "🌟"}</div>
          <Display as="h3">
            {mastered.length} new {mastered.length === 1 ? "word" : "words"} collected!
          </Display>
          {mastered.length > 0 ? (
            <p className="ds-muted">
              <strong>{mastered.join(", ")}</strong> joined your collection. I'll bring{" "}
              {mastered.length === 1 ? "it" : "them"} back for a quick review soon — that's how words stick.
            </p>
          ) : (
            <p className="ds-muted">Those were tricky ones — they'll be waiting to meet you again next time.</p>
          )}
          <Button big onClick={onExit}>Back home</Button>
        </Card>
      </div>
    );
  }

  if (step === "story") {
    return (
      <div className="stack">
        <ProgressRibbon value={progress} />
        <span className="pill">Word {idx + 1} of {session.length}</span>
        <GuideBubble>A tiny story first. Watch for the word <strong>{entry.word}</strong>…</GuideBubble>
        <Card className="stack">
          <p style={{ fontSize: "1.15rem", lineHeight: 1.7, margin: 0 }}>{highlight(entry.microStory[0], entry.word)}</p>
          <p style={{ fontSize: "1.15rem", lineHeight: 1.7, margin: 0 }}>{highlight(entry.microStory[1], entry.word)}</p>
        </Card>
        <Button big onClick={() => setStep("meaning")}>So what does "{entry.word}" mean? →</Button>
      </div>
    );
  }

  if (step === "meaning") {
    return (
      <div className="stack">
        <ProgressRibbon value={progress} />
        <Card className="center stack">
          <div className="big-emoji">{entry.emoji}</div>
          <Display as="h3" style={{ color: "var(--accent)" }}>{entry.word}</Display>
          <p style={{ fontSize: "1.15rem", margin: 0 }}>{entry.meaning}</p>
          <p className="ds-muted" style={{ fontStyle: "italic", margin: 0 }}>"{entry.sentence}"</p>
        </Card>
        <Button big onClick={() => setStep("checkMeaning")}>Got it — quick check →</Button>
      </div>
    );
  }

  if (step === "checkMeaning") {
    return (
      <div className="stack">
        <ProgressRibbon value={progress} />
        <Card className="stack">
          <Display as="h3">Which one means <span style={{ color: "var(--accent)" }}>{entry.word}</span>?</Display>
          <Choices
            options={current.meaningOptions}
            picked={meaningPick}
            correctIndex={current.meaningCorrect}
            onPick={(i) => {
              setMeaningPick(i);
              setMeaningRight(i === current.meaningCorrect);
            }}
          />
          {meaningPick !== null && (
            <>
              <GuideBubble>
                {meaningPick === current.meaningCorrect
                  ? "Yes! Now let's use it in a brand-new sentence."
                  : `Close one — ${entry.word} means "${entry.meaning}". Let's try using it.`}
              </GuideBubble>
              <Button big onClick={() => setStep("checkSentence")}>Use it in a sentence →</Button>
            </>
          )}
        </Card>
      </div>
    );
  }

  if (step === "checkSentence") {
    return (
      <div className="stack">
        <ProgressRibbon value={progress} />
        <Card className="stack">
          <Display as="h3">Which word fits the blank?</Display>
          <p style={{ fontSize: "1.15rem", lineHeight: 1.7, margin: 0 }}>{blankWord(entry.sentence, entry.word)}</p>
          <Choices
            options={current.wordOptions}
            picked={sentencePick}
            correctIndex={current.wordCorrect}
            onPick={(i) => {
              setSentencePick(i);
              if (i === current.wordCorrect && meaningRight) masterWord();
            }}
          />
          {sentencePick !== null && (
            <Button big onClick={() => setStep("wordDone")}>Continue →</Button>
          )}
        </Card>
      </div>
    );
  }

  // wordDone
  const wasMastered = mastered.includes(entry.word);
  return (
    <div className="stack">
      <ProgressRibbon value={progress} />
      <Card className="center stack">
        <div className="big-emoji">{wasMastered ? "🎴" : "🌱"}</div>
        {wasMastered ? (
          <>
            <Display as="h3">"{entry.word}" is yours!</Display>
            <p className="ds-muted">A new card just landed in your collection. {entry.emoji}</p>
            <p style={{ margin: 0 }}>
              💡 <strong>Use it today:</strong> {entry.useIt}
            </p>
          </>
        ) : (
          <>
            <Display as="h3">"{entry.word}" is still growing</Display>
            <p className="ds-muted">
              No worries — {entry.word} means "{entry.meaning}". It'll pop up again next session, and it'll feel easy.
            </p>
          </>
        )}
        <Button big onClick={nextWord}>{idx + 1 >= session.length ? "Finish →" : "Next word →"}</Button>
      </Card>
    </div>
  );
}

/** Bold + accent the target word wherever it appears in a story line. */
function highlight(line: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = line.split(new RegExp(`(${escaped}\\w*)`, "i"));
  return parts.map((part, i) =>
    part.toLowerCase().startsWith(word.toLowerCase()) ? (
      <strong key={i} style={{ color: "var(--accent)" }}>
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
