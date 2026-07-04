import { useEffect, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { ODD_ONE_OUT, type OddOneOutItem } from "./oddoneout.js";
import { sample } from "./lib.js";
import { Choices } from "./Choices.js";

/**
 * Odd-one-out with stated reason (PRD 4.6). Two beats per item: pick the odd
 * word, then pick WHY it's odd from three reasons. The reason is the
 * pedagogy — the correct one always names the classification rule.
 */

const ROUND_SIZE = 5;

type Beat = "word" | "reason";

export function OddOneOutMode({
  ctx,
  onFinished,
  onExit,
}: {
  ctx: ModuleContext;
  onFinished: (right: number, total: number) => void;
  onExit: () => void;
}) {
  const [round] = useState<OddOneOutItem[]>(() => sample(ODD_ONE_OUT, ROUND_SIZE));
  const [idx, setIdx] = useState(0);
  const [beat, setBeat] = useState<Beat>("word");
  const [wordPick, setWordPick] = useState<number | null>(null);
  const [reasonPick, setReasonPick] = useState<number | null>(null);
  const [right, setRight] = useState(0); // one point per beat: word + reason
  const [done, setDone] = useState(false);

  useEffect(() => {
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "lexicon", skills: ["verbal-reasoning"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxScore = round.length * 2;

  const finish = (score: number) => {
    ctx.progression.award("verbal-reasoning", 6 + score * 3);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "lexicon",
      skills: ["verbal-reasoning"],
      success: score / maxScore,
    });
    onFinished(score, maxScore);
    setDone(true);
  };

  if (done) {
    return (
      <div className="stack">
        <Card className="center stack">
          <div className="big-emoji">{right === maxScore ? "🏆" : "🕵️"}</div>
          <Display as="h3">{right} of {maxScore} points!</Display>
          <p className="ds-muted">
            Spotting the odd one out is good — saying <strong>why</strong> is detective-level. Your{" "}
            <strong>verbal reasoning</strong> grew.
          </p>
          <Button big onClick={onExit}>Back home</Button>
        </Card>
      </div>
    );
  }

  const item = round[idx];

  const next = () => {
    const score = right;
    if (idx + 1 >= round.length) {
      finish(score);
    } else {
      setIdx(idx + 1);
      setBeat("word");
      setWordPick(null);
      setReasonPick(null);
    }
  };

  return (
    <div className="stack">
      <ProgressRibbon value={((idx + 1) / round.length) * 100} />
      <span className="pill">Puzzle {idx + 1} of {round.length}</span>
      <Card className="stack">
        {beat === "word" ? (
          <>
            <Display as="h3">Which word doesn't belong?</Display>
            <Choices
              options={item.words}
              picked={wordPick}
              correctIndex={item.odd}
              onPick={(i) => {
                setWordPick(i);
                if (i === item.odd) setRight((r) => r + 1);
              }}
            />
            {wordPick !== null && (
              <>
                <GuideBubble>
                  {wordPick === item.odd
                    ? `Yes — "${item.words[item.odd]}" is the odd one. But WHY? That's the real puzzle…`
                    : `The odd one is "${item.words[item.odd]}". Now the important part — why?`}
                </GuideBubble>
                <Button big onClick={() => setBeat("reason")}>Now say why →</Button>
              </>
            )}
          </>
        ) : (
          <>
            <Display as="h3">
              Why is <span style={{ color: "var(--accent)" }}>{item.words[item.odd]}</span> the odd one out?
            </Display>
            <Choices
              options={item.reasons}
              picked={reasonPick}
              correctIndex={item.correctReason}
              onPick={(i) => {
                setReasonPick(i);
                if (i === item.correctReason) setRight((r) => r + 1);
              }}
            />
            {reasonPick !== null && (
              <>
                <GuideBubble>
                  {reasonPick === item.correctReason
                    ? `Exactly: ${item.reasons[item.correctReason].toLowerCase()}. That's the rule that matters!`
                    : `The real reason: ${item.reasons[item.correctReason].toLowerCase()}. Spotting the RULE is the trick.`}
                </GuideBubble>
                <Button big onClick={next}>{idx + 1 >= round.length ? "Finish →" : "Next puzzle →"}</Button>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
