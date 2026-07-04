import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble, Modal, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import {
  deleteLearnSet,
  listOptions,
  loadLearnSets,
  markedItems as pickMarked,
  parseListEntries,
  saveLearnSet,
  srsRef,
  toggleMark,
  toMarkables,
  type LearnKind,
  type LearnSet,
  type Markable,
} from "./list.js";
import { buildUpSequence, fadeLine, fadeSteps, firstLetters, parsePoemLines } from "./poem.js";

/**
 * Learn Anything (PRD 4.1, screen 19) — load your OWN text, tap to mark what to
 * memorise, then drill it with learned techniques. Everything stays on-device.
 *
 * Privacy (binding): rawText is stored only via ctx.storage and NEVER sent
 * anywhere. The ONLY thing that may reach ctx.ai is a single marked item, for an
 * optional image suggestion, via the "memora.suggest" task — never the whole
 * document, never as an open prompt.
 *
 * Parent gate: for the 8–9 band, loading new text is behind the same two-digit
 * multiplication grown-ups gate the photo-palace builder uses.
 */

type Screen = "home" | "gate" | "load" | "mark" | "method" | "drill";

export function LearnAnything({ ctx, onExit }: { ctx: ModuleContext; onExit: () => void }) {
  const [screen, setScreen] = useState<Screen>("home");
  const [rev, setRev] = useState(0); // bump to re-read saved sets
  const sets = useMemo(() => loadLearnSets(ctx.storage), [ctx, rev]);

  // draft while loading + marking
  const [kind, setKind] = useState<LearnKind>("list");
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [markables, setMarkables] = useState<Markable[]>([]);

  // the active drillable set + chosen technique
  const [active, setActive] = useState<LearnSet | null>(null);
  const [method, setMethod] = useState<DrillMethod>("list-recall");

  const youngBand = ctx.profile.current().ageBand === "8-9";

  const startLoad = () => {
    setKind("list");
    setTitle("");
    setRawText("");
    setMarkables([]);
    setScreen(youngBand ? "gate" : "load");
  };

  const toMark = () => {
    const tokens = kind === "poem" ? parsePoemLines(rawText) : parseListEntries(rawText);
    setMarkables(toMarkables(tokens));
    setScreen("mark");
  };

  const marked = pickMarked(markables);

  const saveAndPickMethod = () => {
    const set = saveLearnSet(ctx.storage, { title, kind, rawText, markedItems: marked });
    setActive(set);
    setRev((r) => r + 1);
    setScreen("method");
  };

  const resume = (set: LearnSet) => {
    setActive(set);
    setMethod(set.kind === "poem" ? "first-letter" : "list-recall");
    setScreen("method");
  };

  const remove = (id: string) => {
    deleteLearnSet(ctx.storage, id);
    setRev((r) => r + 1);
  };

  /* ---------------- screens ---------------- */

  if (screen === "gate") {
    return <GrownUpsGate onPass={() => setScreen("load")} onCancel={() => setScreen("home")} />;
  }

  if (screen === "load") {
    return (
      <div className="stack">
        <div className="crumbs">
          <Button variant="ghost" onClick={() => setScreen("home")}>← Back</Button>
          <Display as="h2" style={{ fontSize: "1.4rem" }}>Load your text</Display>
        </div>
        <GuideBubble>
          Paste anything you want to learn — a poem, spelling words, a list of facts. It stays right here on your device.
        </GuideBubble>
        <p className="ds-muted">🔒 Your text stays on this device and is never sent anywhere.</p>
        <Card className="stack">
          <label className="ds-muted" style={{ fontSize: "0.9rem" }}>
            Give it a name
            <input
              className="text"
              style={{ marginTop: 6 }}
              placeholder="e.g. My spelling words"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <div className="row" style={{ gap: 8 }}>
            <Button variant={kind === "list" ? "solid" : "ghost"} onClick={() => setKind("list")}>📋 A list</Button>
            <Button variant={kind === "poem" ? "solid" : "ghost"} onClick={() => setKind("poem")}>📜 A poem</Button>
          </div>
          <p className="ds-muted" style={{ fontSize: "0.85rem" }}>
            {kind === "poem"
              ? "One line per line — we'll help you learn it line by line."
              : "One thing per line (or split by commas) — each becomes something to remember."}
          </p>
          <textarea
            className="text"
            rows={8}
            placeholder={kind === "poem" ? "Twinkle twinkle little star\nHow I wonder what you are" : "Mercury\nVenus\nEarth"}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
          <Button big disabled={rawText.trim().length === 0} onClick={toMark}>Mark what matters →</Button>
        </Card>
      </div>
    );
  }

  if (screen === "mark") {
    return (
      <div className="stack">
        <div className="crumbs">
          <Button variant="ghost" onClick={() => setScreen("load")}>← Back</Button>
          <Display as="h2" style={{ fontSize: "1.4rem" }}>Mark what matters</Display>
        </div>
        <GuideBubble>
          {kind === "poem"
            ? "Tap the lines you want to learn. Marking them is what turns your poem into a drill."
            : "Tap each thing you want to memorise. The ones you tap become your set."}
        </GuideBubble>
        <Card className="stack">
          {markables.map((m) => (
            <button
              key={m.index}
              className="choice"
              onClick={() => setMarkables((prev) => toggleMark(prev, m.index))}
              aria-pressed={m.marked}
              style={{
                textAlign: "left",
                fontSize: "0.95rem",
                borderColor: m.marked ? "var(--accent)" : undefined,
                background: m.marked ? "var(--accent)" : undefined,
                color: m.marked ? "#fff" : undefined,
              }}
            >
              {m.marked ? "✓ " : "○ "}
              {m.text}
            </button>
          ))}
        </Card>
        <p className="ds-muted" style={{ textAlign: "center" }}>{marked.length} marked</p>
        <Button big disabled={marked.length === 0} onClick={saveAndPickMethod}>
          {marked.length === 0 ? "Tap at least one to continue" : `Learn these ${marked.length} →`}
        </Button>
      </div>
    );
  }

  if (screen === "method" && active) {
    return (
      <MethodPicker
        set={active}
        chosen={method}
        onExit={() => setScreen("home")}
        onChoose={(m) => { setMethod(m); setScreen("drill"); }}
      />
    );
  }

  if (screen === "drill" && active) {
    return (
      <Drill
        ctx={ctx}
        set={active}
        method={method}
        onExit={() => { setScreen("home"); setRev((r) => r + 1); }}
      />
    );
  }

  // home
  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onExit}>← Back</Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>📝 Learn Anything</Display>
      </div>
      <GuideBubble>
        Bring me anything you need to remember — a poem for school, spelling words, planets, facts. We'll learn it with the
        very same memory tricks, and I'll schedule little reviews so it really sticks.
      </GuideBubble>
      <Button big onClick={startLoad}>+ Load new text</Button>
      {sets.length > 0 && (
        <Card className="stack">
          <Display as="h3" style={{ fontSize: "1.1rem" }}>My sets</Display>
          {sets.map((s) => (
            <div key={s.id} className="row" style={{ gap: 10 }}>
              <span className="tile__emoji" style={{ width: 40, textAlign: "center" }}>{s.kind === "poem" ? "📜" : "📋"}</span>
              <div style={{ flex: 1 }}>
                <div className="tile__name" style={{ fontSize: "1rem" }}>{s.title}</div>
                <div className="ds-muted" style={{ fontSize: "0.8rem" }}>
                  {s.kind === "poem" ? "poem" : "list"} · {s.markedItems.length} to remember
                </div>
              </div>
              <Button variant="ghost" onClick={() => resume(s)} aria-label={`Practise ${s.title}`}>▶</Button>
              <Button variant="ghost" onClick={() => remove(s.id)} aria-label={`Delete ${s.title}`}>🗑️</Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ---------------- method choice ---------------- */

type DrillMethod = "list-recall" | "first-letter" | "line-buildup";

function MethodPicker({
  set,
  onExit,
  onChoose,
  chosen,
}: {
  set: LearnSet;
  onExit: () => void;
  onChoose: (m: DrillMethod) => void;
  chosen: DrillMethod;
}) {
  const suggested = set.kind === "poem" ? "the first-letter method" : "recall practice";
  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onExit}>← Back</Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>Pick a way to learn</Display>
      </div>
      <GuideBubble>For a {set.kind}, I'd suggest {suggested} — but you choose what feels right.</GuideBubble>
      <div className="tiles">
        {set.kind === "list" ? (
          <button className="tile" onClick={() => onChoose("list-recall")}>
            <span className="tile__emoji">🎯</span>
            <span className="tile__name">Recall practice</span>
            <span className="tile__blurb">See a cue, remember the item</span>
          </button>
        ) : (
          <>
            <button className="tile" onClick={() => onChoose("first-letter")}>
              <span className="tile__emoji">🔤</span>
              <span className="tile__name">First-letter method</span>
              <span className="tile__blurb">Recite from initials, then let them fade</span>
            </button>
            <button className="tile" onClick={() => onChoose("line-buildup")}>
              <span className="tile__emoji">🧱</span>
              <span className="tile__name">Line build-up</span>
              <span className="tile__blurb">Line 1, then 1–2, then 1–2–3…</span>
            </button>
          </>
        )}
      </div>
      <p className="ds-muted" style={{ fontSize: "0.85rem" }}>Currently chosen: {labelFor(chosen)}</p>
    </div>
  );
}

function labelFor(m: DrillMethod): string {
  if (m === "first-letter") return "First-letter method";
  if (m === "line-buildup") return "Line build-up";
  return "Recall practice";
}

/* ---------------- the drills ---------------- */

function Drill({
  ctx,
  set,
  method,
  onExit,
}: {
  ctx: ModuleContext;
  set: LearnSet;
  method: DrillMethod;
  onExit: () => void;
}) {
  if (method === "list-recall") return <ListRecall ctx={ctx} set={set} onExit={onExit} />;
  if (method === "first-letter") return <FirstLetterDrill ctx={ctx} set={set} onExit={onExit} />;
  return <BuildUpDrill ctx={ctx} set={set} onExit={onExit} />;
}

/** Shared completion: award skills, schedule SRS, emit analytics. */
function completeSet(ctx: ModuleContext, set: LearnSet, success: number) {
  for (const item of set.markedItems) ctx.srs.schedule("memora", srsRef(set.id, item));
  ctx.progression.award("long-term-memory-technique", 12 + set.markedItems.length * 4);
  ctx.progression.award("working-memory", set.markedItems.length * 2);
  ctx.analytics.emit({
    kind: "activity",
    action: "completed",
    moduleId: "memora",
    skills: ["long-term-memory-technique", "working-memory"],
    success,
  });
}

/* ---- list recall: cue index → pick the item from a pool ---- */

function ListRecall({ ctx, set, onExit }: { ctx: ModuleContext; set: LearnSet; onExit: () => void }) {
  const items = set.markedItems;
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [suggestion, setSuggestion] = useState<string>("");

  const options = useMemo(() => (idx < items.length ? listOptions(items, items[idx], idx) : []), [idx, items]);

  const answer = (guess: string) => {
    const hit = guess === items[idx];
    const nextCorrect = correct + (hit ? 1 : 0);
    const n = idx + 1;
    if (n >= items.length) {
      setCorrect(nextCorrect);
      completeSet(ctx, set, items.length ? nextCorrect / items.length : 1);
      setDone(true);
    } else {
      setCorrect(nextCorrect);
      setIdx(n);
      setSuggestion("");
    }
  };

  // Optional image suggestion — item-scoped: only ONE marked word is ever sent.
  const suggestImage = async () => {
    setSuggestion("…");
    const r = await ctx.ai.generateContent({ task: "memora.suggest", context: { item: items[idx] } });
    setSuggestion(r.text);
  };

  if (done) return <DonePanel correct={correct} total={items.length} onExit={onExit} />;

  return (
    <div className="stack">
      <ProgressRibbon value={((idx + 1) / items.length) * 100} />
      <Card className="center stack">
        <span className="pill">Item {idx + 1} of {items.length}</span>
        <Display as="h3">Which one comes next?</Display>
        <p className="ds-muted">Remember your set in order — tap item number {idx + 1}.</p>
        <div className="choice-grid">
          {options.map((o) => (
            <button key={o} className="choice" style={{ fontSize: "0.9rem" }} onClick={() => answer(o)}>{o}</button>
          ))}
        </div>
        <div className="stack" style={{ marginTop: 8 }}>
          <Button variant="ghost" onClick={() => void suggestImage()}>💡 Picture idea for “{items[idx]}”</Button>
          {suggestion && <GuideBubble>{suggestion}</GuideBubble>}
        </div>
      </Card>
      <p className="ds-muted" style={{ fontSize: "0.8rem", textAlign: "center" }}>
        🔒 Only this one word is ever used for a picture idea — never your whole text.
      </p>
    </div>
  );
}

/* ---- poem: first-letter method with a progressively removed crutch ---- */

function FirstLetterDrill({ ctx, set, onExit }: { ctx: ModuleContext; set: LearnSet; onExit: () => void }) {
  const lines = set.markedItems;
  const [lineIdx, setLineIdx] = useState(0);
  const [step, setStep] = useState(0); // how many words are hidden from the front
  const [reveal, setReveal] = useState(false);
  const [done, setDone] = useState(false);

  const line = lines[lineIdx] ?? "";
  const steps = fadeSteps(line);

  const nextStep = () => {
    setReveal(false);
    if (step + 1 < steps) {
      setStep(step + 1);
      return;
    }
    // line mastered (crutch fully gone) → next line
    if (lineIdx + 1 < lines.length) {
      setLineIdx(lineIdx + 1);
      setStep(0);
    } else {
      completeSet(ctx, set, 1);
      setDone(true);
    }
  };

  if (done) return <DonePanel correct={lines.length} total={lines.length} onExit={onExit} />;

  return (
    <div className="stack">
      <ProgressRibbon value={((lineIdx + 1) / lines.length) * 100} />
      <Card className="center stack">
        <span className="pill">Line {lineIdx + 1} of {lines.length}</span>
        <GuideBubble>Read the initials, say the whole line out loud, then check yourself.</GuideBubble>
        <div className="big-emoji" style={{ fontSize: "1.6rem", letterSpacing: "0.15em" }}>{fadeLine(line, step)}</div>
        {reveal ? (
          <>
            <Display as="h3" style={{ color: "var(--accent)" }}>{line}</Display>
            <Button big onClick={nextStep}>
              {step + 1 < steps ? "Hide one more →" : lineIdx + 1 < lines.length ? "Next line →" : "Finish 🎉"}
            </Button>
          </>
        ) : (
          <Button big onClick={() => setReveal(true)}>Show the line</Button>
        )}
        <p className="ds-muted" style={{ fontSize: "0.8rem" }}>Fewer letters each time — soon you won't need them at all.</p>
      </Card>
    </div>
  );
}

/* ---- poem: progressive line build-up ---- */

function BuildUpDrill({ ctx, set, onExit }: { ctx: ModuleContext; set: LearnSet; onExit: () => void }) {
  const lines = set.markedItems;
  const rounds = useMemo(() => buildUpSequence(lines), [lines]);
  const [round, setRound] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [done, setDone] = useState(false);

  const current = rounds[round] ?? [];

  const next = () => {
    setReveal(false);
    if (round + 1 < rounds.length) {
      setRound(round + 1);
    } else {
      completeSet(ctx, set, 1);
      setDone(true);
    }
  };

  if (done) return <DonePanel correct={lines.length} total={lines.length} onExit={onExit} />;

  return (
    <div className="stack">
      <ProgressRibbon value={((round + 1) / rounds.length) * 100} />
      <Card className="center stack">
        <span className="pill">Round {round + 1} of {rounds.length}</span>
        <GuideBubble>Say everything up to line {round + 1} from memory, then reveal to check.</GuideBubble>
        {reveal ? (
          <ol style={{ lineHeight: 2, textAlign: "left" }}>
            {current.map((l, i) => (
              <li key={i} style={{ color: i === round ? "var(--accent)" : undefined, fontWeight: i === round ? 700 : 400 }}>{l}</li>
            ))}
          </ol>
        ) : (
          <div className="big-emoji">🧠</div>
        )}
        {reveal ? (
          <Button big onClick={next}>{round + 1 < rounds.length ? "Add the next line →" : "Finish 🎉"}</Button>
        ) : (
          <Button big onClick={() => setReveal(true)}>Reveal lines 1–{round + 1}</Button>
        )}
        <div className="crutch ds-muted" style={{ fontSize: "0.85rem" }}>
          Hint: {current.map((l) => firstLetters(l)).join(" / ")}
        </div>
      </Card>
    </div>
  );
}

/* ---------------- done panel ---------------- */

function DonePanel({ correct, total, onExit }: { correct: number; total: number; onExit: () => void }) {
  return (
    <div className="stack">
      <Card className="center stack">
        <div className="big-emoji">{correct === total ? "🏆" : "🌟"}</div>
        <Display as="h3">Nice work — {correct}/{total}!</Display>
        <p className="ds-muted">
          I've scheduled little reviews over the next few days — that's what turns "learned it once" into "know it for
          good". Great place to stop. 🎉
        </p>
        <Button big onClick={onExit}>Back to Learn Anything</Button>
      </Card>
    </div>
  );
}

/* ---------------- grown-ups gate (same pattern as the photo-palace builder) ---------------- */

function GrownUpsGate({ onPass, onCancel }: { onPass: () => void; onCancel: () => void }) {
  const [a] = useState(() => 7 + Math.floor(Math.random() * 6));
  const [b] = useState(() => 4 + Math.floor(Math.random() * 6));
  const [answer, setAnswer] = useState("");
  const wrong = answer !== "" && Number(answer) !== a * b;

  return (
    <Modal onClose={onCancel}>
      <div className="stack center">
        <Display as="h3">Grown-ups only</Display>
        <p className="ds-muted">
          Loading your own text is a job to do with a grown-up nearby. What is {a} × {b}?
        </p>
        <input
          className="text"
          inputMode="numeric"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && Number(answer) === a * b) onPass(); }}
        />
        {wrong && <p className="ds-muted" style={{ color: "var(--bad, #c0392b)" }}>Not quite — try again.</p>}
        <div className="row" style={{ justifyContent: "center" }}>
          <Button variant="ghost" onClick={onCancel}>Back</Button>
          <Button onClick={() => { if (Number(answer) === a * b) onPass(); }}>Enter</Button>
        </div>
      </div>
    </Modal>
  );
}
