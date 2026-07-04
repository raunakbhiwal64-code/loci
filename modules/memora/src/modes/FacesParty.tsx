import { useEffect, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { GUESTS, type Guest } from "../faces.js";
import { recordBeltResult } from "../belts.js";
import { optionsFor, sample, shuffle } from "../util.js";

/**
 * Faces at the Party — belt 4 (names and faces). Meet six party guests, link
 * each NAME to a feature you can SEE, then the party quiz: match names to
 * faces. Guests and hints are authored content.
 */

const PARTY_SIZE = 6;

type Stage = "learn" | "quiz" | "done";

interface QuizQ {
  guest: Guest;
  options: string[];
}

export function FacesParty({ ctx, onExit }: { ctx: ModuleContext; onExit: () => void }) {
  const [guests] = useState<Guest[]>(() => sample(GUESTS, PARTY_SIZE));
  const [stage, setStage] = useState<Stage>("learn");
  const [learnIdx, setLearnIdx] = useState(0);
  const [questions, setQuestions] = useState<QuizQ[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [welcome, setWelcome] = useState("Six guests are waiting to meet you!");

  useEffect(() => {
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "memora", skills: ["long-term-memory-technique"] });
    // Authored context only (a count) — never child data.
    void ctx.ai
      .generateContent({ task: "memora.faces", context: { guests: PARTY_SIZE } })
      .then((r) => {
        if (!r.filtered) setWelcome(r.text);
      });
  }, [ctx]);

  const startQuiz = () => {
    const allNames = GUESTS.map((g) => g.name);
    setQuestions(shuffle(guests).map((guest) => ({ guest, options: optionsFor(allNames, guest.name) })));
    setQIdx(0);
    setCorrect(0);
    setFeedback("");
    setStage("quiz");
  };

  const answer = (guess: string) => {
    const q = questions[qIdx];
    const hit = guess === q.guest.name;
    const hits = correct + (hit ? 1 : 0);
    if (hit) setCorrect(hits);
    setFeedback(hit ? "" : `That was ${q.guest.name} — remember: ${q.guest.hint}`);
    const n = qIdx + 1;
    if (n >= questions.length) finish(hits);
    else setQIdx(n);
  };

  const finish = (hits: number) => {
    ctx.progression.award("long-term-memory-technique", 10 + hits * 4);
    ctx.srs.schedule("memora", "memora:faces:party");
    recordBeltResult(ctx.storage, "faces", hits, questions.length);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "memora",
      skills: ["long-term-memory-technique"],
      success: questions.length > 0 ? hits / questions.length : 0,
    });
    setCorrect(hits);
    setStage("done");
  };

  if (stage === "learn") {
    const g = guests[learnIdx];
    return (
      <div className="stack">
        <GuideBubble>{welcome} The trick: link each name to something you can SEE on the face.</GuideBubble>
        <ProgressRibbon value={((learnIdx + 1) / guests.length) * 100} />
        <Card className="center stack">
          <span className="pill">Guest {learnIdx + 1} of {guests.length}</span>
          <div className="big-emoji">{g.face}</div>
          <Display as="h3">{g.name}</Display>
          <GuideBubble>{g.hint}</GuideBubble>
          <Button big onClick={() => (learnIdx + 1 >= guests.length ? startQuiz() : setLearnIdx(learnIdx + 1))}>
            {learnIdx + 1 >= guests.length ? "I know everyone — quiz me! →" : "Next guest →"}
          </Button>
        </Card>
        <Button variant="ghost" onClick={onExit}>← Leave the party</Button>
      </div>
    );
  }

  if (stage === "quiz") {
    const q = questions[qIdx];
    return (
      <div className="stack">
        <ProgressRibbon value={((qIdx + 1) / questions.length) * 100} />
        <Card className="center stack">
          <span className="pill">Who's this? {qIdx + 1} of {questions.length}</span>
          <div className="big-emoji">{q.guest.face}</div>
          <div className="choice-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))" }}>
            {q.options.map((o) => (
              <button key={o} className="choice" style={{ fontSize: "0.9rem" }} onClick={() => answer(o)}>
                {o}
              </button>
            ))}
          </div>
          {feedback && <GuideBubble>{feedback}</GuideBubble>}
        </Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <Card className="center stack">
        <div className="big-emoji">{correct === questions.length ? "🏆" : "🥳"}</div>
        <Display as="h3">You named {correct}/{questions.length} guests!</Display>
        <p className="ds-muted">
          Feature-linking works on real people too — try it on your next new classmate. Review scheduled. Great place
          to stop. 🎉
        </p>
        <Button big onClick={onExit}>Back to Memora</Button>
      </Card>
    </div>
  );
}
