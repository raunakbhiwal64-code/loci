import { useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { DIGIT_PEGS } from "../pegs.js";
import { recordBeltResult } from "../belts.js";

/**
 * Number Ninja — belt 5 (number systems). Digit strings become number-shape
 * pictures (4 → 8 digits), plus the "memorise a phone number" exercise: the
 * child enters any number THEY choose. Practice digits live only in
 * ctx.storage ("practice-number", this device, this profile) and are NEVER
 * sent to ctx.ai or analytics.
 */

type Stage = "pick" | "phone-entry" | "study" | "recall" | "done";
type Kind = "drill" | "phone";

const PRACTICE_KEY = "practice-number";

export function NumberNinja({ ctx, onExit }: { ctx: ModuleContext; onExit: () => void }) {
  const [stage, setStage] = useState<Stage>("pick");
  const [kind, setKind] = useState<Kind>("drill");
  const [digits, setDigits] = useState("");
  const [typed, setTyped] = useState("");
  const [phoneDraft, setPhoneDraft] = useState<string>(() => ctx.storage.get<string>(PRACTICE_KEY) ?? "");
  const [correctDigits, setCorrectDigits] = useState(0);

  const startDrill = (len: number) => {
    let d = String(1 + Math.floor(Math.random() * 9));
    while (d.length < len) d += String(Math.floor(Math.random() * 10));
    setKind("drill");
    setDigits(d);
    setStage("study");
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "memora", skills: ["long-term-memory-technique"] });
  };

  const startPhone = () => {
    const clean = phoneDraft.replace(/\D/g, "").slice(0, 15);
    if (clean.length < 4) return;
    // Stays on this device, this profile — never sent to ctx.ai or analytics.
    ctx.storage.set(PRACTICE_KEY, clean);
    setPhoneDraft(clean);
    setKind("phone");
    setDigits(clean);
    setStage("study");
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "memora", skills: ["long-term-memory-technique"] });
  };

  const check = () => {
    let hits = 0;
    for (let i = 0; i < digits.length; i++) if (typed[i] === digits[i]) hits++;
    setCorrectDigits(hits);
    ctx.progression.award("long-term-memory-technique", 8 + hits * 2);
    ctx.progression.award("working-memory", Math.ceil(hits / 2));
    ctx.srs.schedule("memora", kind === "phone" ? "memora:number:phone" : `memora:number:${digits.length}`);
    if (kind === "drill") recordBeltResult(ctx.storage, "numbers", hits, digits.length);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "memora",
      skills: ["long-term-memory-technique", "working-memory"],
      success: digits.length > 0 ? hits / digits.length : 0,
    });
    setStage("done");
  };

  if (stage === "pick") {
    return (
      <div className="stack">
        <GuideBubble>
          Numbers are slippery — but pictures stick! Every digit becomes its shape twin (1 = candle 🕯️, 2 = swan 🦢…)
          and a number becomes a little scene.
        </GuideBubble>
        <Display as="h3">Pick your mission</Display>
        <div className="tiles">
          <button className="tile" onClick={() => startDrill(4)}>
            <span className="tile__emoji">🥋</span>
            <span className="tile__name">4 digits</span>
            <span className="tile__blurb">Warm-up ninja</span>
          </button>
          <button className="tile" onClick={() => startDrill(6)}>
            <span className="tile__emoji">🥷</span>
            <span className="tile__name">6 digits</span>
            <span className="tile__blurb">Sneaky ninja</span>
          </button>
          <button className="tile" onClick={() => startDrill(8)}>
            <span className="tile__emoji">⚡</span>
            <span className="tile__name">8 digits</span>
            <span className="tile__blurb">Belt test!</span>
          </button>
          <button className="tile" onClick={() => setStage("phone-entry")}>
            <span className="tile__emoji">📞</span>
            <span className="tile__name">A phone number</span>
            <span className="tile__blurb">One YOU want to know by heart</span>
          </button>
        </div>
        <Button variant="ghost" onClick={onExit}>← Back</Button>
      </div>
    );
  }

  if (stage === "phone-entry") {
    return (
      <div className="stack">
        <Display as="h3">Memorise a phone number</Display>
        <GuideBubble>
          Type any number you'd like to know by heart — maybe a parent's. It stays only on this device, just for your
          practice. Nobody else ever sees it.
        </GuideBubble>
        <input
          className="text"
          inputMode="numeric"
          placeholder="e.g. 9876543210"
          value={phoneDraft}
          onChange={(e) => setPhoneDraft(e.target.value.replace(/[^\d\s]/g, ""))}
          aria-label="Practice phone number"
        />
        <div className="row wrap">
          <Button big disabled={phoneDraft.replace(/\D/g, "").length < 4} onClick={startPhone}>
            Turn it into pictures →
          </Button>
          <Button variant="ghost" onClick={() => setStage("pick")}>← Back</Button>
        </div>
      </div>
    );
  }

  if (stage === "study") {
    return (
      <div className="stack">
        <Display as="h3">See the number as a scene</Display>
        <Card>
          <div className="row wrap" style={{ justifyContent: "center" }}>
            {digits.split("").map((d, i) => (
              <div key={i} className="center" style={{ minWidth: 64 }}>
                <div style={{ fontSize: 34 }}>{DIGIT_PEGS[d].emoji}</div>
                <div style={{ fontWeight: 700 }}>{d}</div>
                <div className="ds-muted" style={{ fontSize: "0.7rem" }}>{DIGIT_PEGS[d].word}</div>
              </div>
            ))}
          </div>
        </Card>
        <GuideBubble>
          Say it as a story: {digits.split("").map((d) => DIGIT_PEGS[d].word).join(" → ")}. Walk through the scene
          twice, then hide it!
        </GuideBubble>
        <Button big onClick={() => { setTyped(""); setStage("recall"); }}>Hide it — I'm ready →</Button>
      </div>
    );
  }

  if (stage === "recall") {
    return (
      <div className="stack">
        <ProgressRibbon value={(typed.length / digits.length) * 100} />
        <Card className="center stack">
          <Display as="h3">Type the number back</Display>
          <div style={{ fontSize: 28, letterSpacing: 6, minHeight: 40, fontWeight: 700 }}>
            {typed.padEnd(digits.length, "·")}
          </div>
          <div className="choice-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((k) => (
              <button
                key={k}
                className="choice"
                onClick={() => typed.length < digits.length && setTyped(typed + k)}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="row wrap" style={{ justifyContent: "center" }}>
            <Button variant="ghost" onClick={() => setTyped(typed.slice(0, -1))}>⌫ Undo</Button>
            <Button big disabled={typed.length !== digits.length} onClick={check}>Check →</Button>
          </div>
        </Card>
      </div>
    );
  }

  const all = correctDigits === digits.length;
  return (
    <div className="stack">
      <Card className="center stack">
        <div className="big-emoji">{all ? "🏆" : "🥷"}</div>
        <Display as="h3">{correctDigits}/{digits.length} digits right!</Display>
        <p className="ds-muted">
          {all
            ? kind === "phone"
              ? "You know that number by heart now — that's a real-life superpower. 🎉"
              : "Ninja-level number memory! Review scheduled so it sticks. 🎉"
            : "Every digit you caught is progress — the pictures get stronger each time. Great place to stop. 🌟"}
        </p>
        <div className="row wrap" style={{ justifyContent: "center" }}>
          <Button variant="ghost" onClick={() => { setTyped(""); setStage("study"); }}>See the pictures again</Button>
          <Button big onClick={onExit}>Back to Memora</Button>
        </div>
      </Card>
    </div>
  );
}
