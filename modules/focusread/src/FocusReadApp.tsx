import { useEffect, useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import {
  ALL_LEVELS,
  LEVEL_NAMES,
  type Level,
  type Passage,
  PASSAGES,
  passagesForLevel,
  splitSentences,
} from "./passages.js";
import { canSpeak, readAloud, stopReading } from "./tts.js";

/**
 * FocusRead UI (PRD 4.7). Levelled passages with literal/inferential questions,
 * find-the-detail (selective attention), story-order, and listen mode. Reading
 * practice framed joyfully — never any clinical/attention-disorder language.
 */

type View =
  | { name: "home" }
  | { name: "menu"; passage: Passage }
  | { name: "read"; passage: Passage }
  | { name: "detail"; passage: Passage }
  | { name: "order"; passage: Passage };

export function FocusReadApp({ ctx }: { ctx: ModuleContext }) {
  const [view, setView] = useState<View>({ name: "home" });
  const reachedLevel = (ctx.storage.get<Level>("reachedLevel") ?? 1) as Level;

  const home = () => { stopReading(); setView({ name: "home" }); };
  const menu = (passage: Passage) => { stopReading(); setView({ name: "menu", passage }); };

  if (view.name === "read") return <ReadAndAnswer ctx={ctx} passage={view.passage} onBack={() => menu(view.passage)} />;
  if (view.name === "detail") return <FindDetail ctx={ctx} passage={view.passage} onBack={() => menu(view.passage)} />;
  if (view.name === "order") return <StoryOrder ctx={ctx} passage={view.passage} onBack={() => menu(view.passage)} />;

  if (view.name === "menu") {
    const p = view.passage;
    return (
      <div className="stack">
        <div className="crumbs">
          <Button variant="ghost" onClick={home}>← Shelves</Button>
          <Display as="h2" style={{ fontSize: "1.3rem" }}>{p.title}</Display>
        </div>
        <GuideBubble>Read it first, then try the games about it!</GuideBubble>
        <Card className="stack">
          <Button big onClick={() => setView({ name: "read", passage: p })}>📖 Read &amp; answer</Button>
          <Button variant="ghost" onClick={() => setView({ name: "detail", passage: p })}>🔎 Find the detail</Button>
          {p.storyOrder && <Button variant="ghost" onClick={() => setView({ name: "order", passage: p })}>🔀 Put it in order</Button>}
        </Card>
      </div>
    );
  }

  return (
    <div className="stack">
      <GuideBubble>Great readers read closely and check twice. Pick a story or a fact-adventure!</GuideBubble>
      {ALL_LEVELS.map((lvl) => {
        const locked = lvl > reachedLevel;
        return (
          <Card key={lvl} className="stack" style={{ opacity: locked ? 0.6 : 1 }}>
            <div className="spread">
              <Display as="h3" style={{ fontSize: "1.15rem" }}>{LEVEL_NAMES[lvl]}</Display>
              {locked && <span className="pill">🔒 Read more to unlock</span>}
            </div>
            <div className="tiles">
              {passagesForLevel(lvl).map((p) => {
                const done = ctx.storage.get<boolean>(`read:${p.id}`);
                return (
                  <button key={p.id} className="tile" disabled={locked} onClick={() => menu(p)}>
                    <span className="tile__emoji">{p.kind === "fiction" ? "📖" : "🔎"}</span>
                    <span className="tile__name" style={{ fontSize: "1rem" }}>{p.title}</span>
                    <span className="tile__blurb">{done ? "✓ read · revisit" : p.kind === "fiction" ? "a story" : "a fact-adventure"}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Chrome({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Display as="h2" style={{ fontSize: "1.3rem" }}>{title}</Display>
      </div>
      {children}
    </div>
  );
}

function PassageText({ passage }: { passage: Passage }) {
  return (
    <Card>
      <Display as="h3" style={{ fontSize: "1.3rem", marginBottom: 10 }}>{passage.title}</Display>
      <p style={{ fontSize: "1.1rem", lineHeight: 1.9, margin: 0 }}>{passage.text}</p>
    </Card>
  );
}

function ListenButton({ text }: { text: string }) {
  const [on, setOn] = useState(false);
  if (!canSpeak()) return null;
  return (
    <Button
      variant="ghost"
      onClick={() => {
        if (on) { stopReading(); setOn(false); }
        else { setOn(true); readAloud(text, { onDone: () => setOn(false) }); }
      }}
    >
      {on ? "⏹ Stop" : "🔊 Listen"}
    </Button>
  );
}

function ReadAndAnswer({ ctx, passage, onBack }: { ctx: ModuleContext; passage: Passage; onBack: () => void }) {
  const [stage, setStage] = useState<"read" | "quiz" | "done">("read");
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const q = passage.questions[qi];

  const answer = (i: number) => {
    if (picked != null) return;
    setPicked(i);
    if (i === q.correct) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (qi + 1 >= passage.questions.length) {
      const finalCorrect = correct;
      const score = finalCorrect / passage.questions.length;
      ctx.storage.set(`read:${passage.id}`, true);
      ctx.storage.set(`score:${passage.id}`, score);
      ctx.progression.award("reading-comprehension", 12 + finalCorrect * 6);
      ctx.analytics.emit({ kind: "activity", action: "completed", moduleId: "focusread", skills: ["reading-comprehension"], success: score });
      maybeUnlock(ctx, passage.level);
      setStage("done");
    } else {
      setQi(qi + 1);
      setPicked(null);
    }
  };

  if (stage === "read") {
    return (
      <Chrome title={passage.title} onBack={onBack}>
        <div className="row" style={{ justifyContent: "flex-end" }}><ListenButton text={passage.text} /></div>
        <PassageText passage={passage} />
        <Button big onClick={() => { stopReading(); setStage("quiz"); }}>I'm ready — ask me!</Button>
      </Chrome>
    );
  }

  if (stage === "done") {
    return (
      <Chrome title={passage.title} onBack={onBack}>
        <Card className="center stack">
          <div className="big-emoji">{correct === passage.questions.length ? "🏆" : "🌟"}</div>
          <Display as="h3">{correct}/{passage.questions.length} right!</Display>
          <p className="ds-muted">Nice close reading. Peeking back at the text is exactly what good readers do!</p>
          <Button variant="ghost" onClick={onBack}>More games with this one</Button>
        </Card>
      </Chrome>
    );
  }

  return (
    <Chrome title={passage.title} onBack={onBack}>
      <details><summary className="ds-muted" style={{ cursor: "pointer" }}>📖 Peek at the text again</summary><PassageText passage={passage} /></details>
      <ProgressRibbon value={((qi + 1) / passage.questions.length) * 100} />
      <Card className="stack">
        <span className="pill">{q.kind === "literal" ? "Find it" : q.kind === "inferential" ? "Think it through" : "Spot the detail"}</span>
        <Display as="h3" style={{ fontSize: "1.2rem" }}>{q.prompt}</Display>
        {q.options.map((opt, i) => (
          <Button
            key={i}
            variant={picked != null && i === q.correct ? "solid" : "ghost"}
            style={{ textAlign: "left" }}
            onClick={() => answer(i)}
          >
            {picked == null ? "" : i === q.correct ? "✓ " : i === picked ? "✗ " : ""}{opt}
          </Button>
        ))}
        {picked != null && (
          <>
            <p className="ds-muted">{picked === q.correct ? "Yes! Well spotted." : "Good try — peek at the text and see."}</p>
            <Button big onClick={next}>{qi + 1 >= passage.questions.length ? "Finish" : "Next question →"}</Button>
          </>
        )}
      </Card>
    </Chrome>
  );
}

function FindDetail({ ctx, passage, onBack }: { ctx: ModuleContext; passage: Passage; onBack: () => void }) {
  const detailQ = passage.questions.find((q) => q.kind === "detail") ?? passage.questions[0];
  const sentences = useMemo(() => splitSentences(passage.text), [passage]);
  const targetIdx = useMemo(
    () => sentences.findIndex((s) => detailQ.findPhrase && s.toLowerCase().includes(detailQ.findPhrase.toLowerCase())),
    [sentences, detailQ]
  );
  const [picked, setPicked] = useState<number | null>(null);

  const tap = (i: number) => {
    if (picked != null) return;
    setPicked(i);
    if (i === targetIdx) {
      ctx.progression.award("sustained-attention", 12);
      ctx.analytics.emit({ kind: "activity", action: "completed", moduleId: "focusread", skills: ["sustained-attention"] });
    }
  };

  return (
    <Chrome title="Find the detail" onBack={onBack}>
      <GuideBubble>{detailQ.prompt} Tap the sentence that tells you!</GuideBubble>
      <Card>
        <p style={{ fontSize: "1.05rem", lineHeight: 2, margin: 0 }}>
          {sentences.map((s, i) => {
            const hit = picked != null && i === targetIdx;
            const miss = picked === i && i !== targetIdx;
            return (
              <span
                key={i}
                onClick={() => tap(i)}
                style={{
                  cursor: "pointer",
                  background: hit ? "var(--good)" : miss ? "var(--parchment-2)" : "transparent",
                  color: hit ? "#fff" : "inherit",
                  borderRadius: 6,
                  padding: "2px 3px",
                }}
              >
                {s}{" "}
              </span>
            );
          })}
        </p>
      </Card>
      {picked != null && (
        <Card className="center stack">
          <p>{picked === targetIdx ? "🌟 That's the one!" : "Close! The highlighted sentence has it."}</p>
          <Button onClick={onBack}>Back</Button>
        </Card>
      )}
    </Chrome>
  );
}

function StoryOrder({ ctx, passage, onBack }: { ctx: ModuleContext; passage: Passage; onBack: () => void }) {
  const so = passage.storyOrder!;
  const [placed, setPlaced] = useState<number[]>([]);
  const [awarded, setAwarded] = useState(false);
  const remaining = so.events.map((_, i) => i).filter((i) => !placed.includes(i));
  const done = placed.length === so.events.length;
  const correct = done && placed.every((ev, pos) => so.correctOrder[pos] === ev);

  useEffect(() => {
    if (correct && !awarded) {
      setAwarded(true);
      ctx.progression.award("working-memory", 15);
      ctx.analytics.emit({ kind: "activity", action: "completed", moduleId: "focusread", skills: ["working-memory"] });
    }
  }, [correct, awarded, ctx]);

  return (
    <Chrome title="Put it in order" onBack={onBack}>
      <GuideBubble>What happened first? Tap the events in the order they happened.</GuideBubble>
      <Card className="stack">
        <strong>Your order:</strong>
        {placed.length === 0 && <p className="ds-muted">Tap events below to build the story…</p>}
        {placed.map((ev, pos) => (
          <div key={pos} className="choice" style={{ textAlign: "left", cursor: "default" }}>{pos + 1}. {so.events[ev]}</div>
        ))}
      </Card>
      {!done && (
        <Card className="stack">
          <strong>Events:</strong>
          {remaining.map((i) => (
            <Button key={i} variant="ghost" style={{ textAlign: "left" }} onClick={() => setPlaced([...placed, i])}>{so.events[i]}</Button>
          ))}
        </Card>
      )}
      {done && (
        <Card className="center stack">
          <div className="big-emoji">{correct ? "🎉" : "🤔"}</div>
          <p>{correct ? "Perfect order! That grew your holding-things-in-mind skill." : "Not quite — want to try again?"}</p>
          {!correct && <Button onClick={() => setPlaced([])}>Try again</Button>}
          <Button variant="ghost" onClick={onBack}>Back</Button>
        </Card>
      )}
    </Chrome>
  );
}

function maybeUnlock(ctx: ModuleContext, level: Level) {
  const passages = passagesForLevel(level);
  const scored = passages.filter((p) => (ctx.storage.get<number>(`score:${p.id}`) ?? -1) >= 0);
  const good = passages.filter((p) => (ctx.storage.get<number>(`score:${p.id}`) ?? 0) >= 0.8);
  const need = Math.min(3, passages.length);
  if (scored.length >= need && good.length >= need) {
    const next = (level + 1) as Level;
    const reached = ctx.storage.get<Level>("reachedLevel") ?? 1;
    if (next <= 4 && next > reached) ctx.storage.set("reachedLevel", next);
  }
}

export { PASSAGES };
