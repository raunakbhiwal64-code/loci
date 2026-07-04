import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { DEFAULT_LIST, PALACES, type Palace } from "./palaces.js";

/**
 * Memora core loop on the spine: pick palace → meet the list → placement coach
 * (AI mnemonic prompts via the gateway) → the walk → active recall → done.
 * Awards long-term-memory-technique + working-memory, schedules SRS reviews.
 */

type Stage = "pick" | "meet" | "place" | "walk" | "recall" | "done";

export function MemoraApp({ ctx }: { ctx: ModuleContext }) {
  const [stage, setStage] = useState<Stage>("pick");
  const [palace, setPalace] = useState<Palace>(PALACES[0]);

  const list = DEFAULT_LIST;
  const pairs = useMemo(
    () => palace.loci.slice(0, list.length).map((locus, i) => ({ locus, item: list[i] })),
    [palace, list]
  );

  const [placeIdx, setPlaceIdx] = useState(0);
  const [hint, setHint] = useState<string>("");
  const [recallIdx, setRecallIdx] = useState(0);
  const [correct, setCorrect] = useState(0);

  // Placement coach — one vivid mnemonic prompt per spot, via the AI gateway.
  const loadHint = async (item: string, locusLabel: string) => {
    setHint("…");
    const r = await ctx.ai.generateContent({
      task: "memora.mnemonic",
      context: { item, place: locusLabel },
    });
    setHint(r.text);
  };

  const startPlace = () => {
    setStage("place");
    setPlaceIdx(0);
    void loadHint(pairs[0].item, pairs[0].locus.label);
    ctx.analytics.emit({ kind: "activity", action: "started", moduleId: "memora", skills: ["long-term-memory-technique"] });
  };

  const nextPlace = () => {
    const n = placeIdx + 1;
    if (n >= pairs.length) {
      setStage("walk");
    } else {
      setPlaceIdx(n);
      void loadHint(pairs[n].item, pairs[n].locus.label);
    }
  };

  const answerRecall = (guess: string) => {
    const truth = pairs[recallIdx].item;
    if (guess === truth) setCorrect((c) => c + 1);
    // Every placed item becomes a scheduled review (shared SRS, no model call).
    ctx.srs.schedule("memora", `${palace.id}:${truth}`);
    const n = recallIdx + 1;
    if (n >= pairs.length) finish(guess === truth);
    else setRecallIdx(n);
  };

  const finish = (lastHit: boolean) => {
    const hits = correct + (lastHit ? 1 : 0);
    ctx.progression.award("long-term-memory-technique", 15 + hits * 6);
    ctx.progression.award("working-memory", hits * 3);
    ctx.analytics.emit({
      kind: "activity",
      action: "completed",
      moduleId: "memora",
      skills: ["long-term-memory-technique", "working-memory"],
      success: hits / pairs.length,
    });
    setCorrect(hits);
    setStage("done");
  };

  /* ---------- render per stage ---------- */

  if (stage === "pick") {
    return (
      <div className="stack">
        <GuideBubble>A memory palace is a place you know well. We'll hide things around it, then walk through to find them again.</GuideBubble>
        <Display as="h3">Pick your palace</Display>
        <div className="tiles">
          {PALACES.map((p) => (
            <button key={p.id} className="tile" onClick={() => { setPalace(p); setStage("meet"); }}>
              <span className="tile__emoji">{p.emoji}</span>
              <span className="tile__name">{p.name}</span>
              <span className="tile__blurb">{p.loci.length} spots to explore</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (stage === "meet") {
    return (
      <div className="stack">
        <Display as="h3">What you'll remember</Display>
        <p className="ds-muted">The eight planets, in order. We'll place one at each spot in the {palace.name}.</p>
        <Card>
          <div className="choice-grid">
            {list.map((item) => (
              <div key={item} className="choice" style={{ fontSize: "0.9rem", cursor: "default" }}>{item}</div>
            ))}
          </div>
        </Card>
        <Button big onClick={startPlace}>Start placing →</Button>
      </div>
    );
  }

  if (stage === "place") {
    const { locus, item } = pairs[placeIdx];
    return (
      <div className="stack">
        <ProgressRibbon value={((placeIdx + 1) / pairs.length) * 100} />
        <Card className="center stack">
          <span className="pill">Spot {placeIdx + 1} of {pairs.length}</span>
          <div className="big-emoji">{locus.emoji}</div>
          <Display as="h3">Put <span style={{ color: "var(--accent)" }}>{item}</span> at {locus.label}</Display>
          <GuideBubble>{hint || "Thinking of a picture…"}</GuideBubble>
          <Button big onClick={nextPlace}>{placeIdx + 1 >= pairs.length ? "Done placing →" : "Next spot →"}</Button>
        </Card>
      </div>
    );
  }

  if (stage === "walk") {
    return (
      <div className="stack">
        <Display as="h3">The walk</Display>
        <GuideBubble>Walk through the {palace.name} in your mind. See each thing where you left it.</GuideBubble>
        <Card>
          <ol style={{ lineHeight: 2 }}>
            {pairs.map((p) => (
              <li key={p.locus.id}>
                {p.locus.emoji} {p.locus.label} → <strong>{p.item}</strong>
              </li>
            ))}
          </ol>
        </Card>
        <Button big onClick={() => { setRecallIdx(0); setCorrect(0); setStage("recall"); }}>Test my memory →</Button>
      </div>
    );
  }

  if (stage === "recall") {
    const { locus, item } = pairs[recallIdx];
    // pick-from-pool: the right answer plus a few distractors (pure, not a hook)
    const options = optionsFor(list, item, recallIdx);
    return (
      <div className="stack">
        <ProgressRibbon value={((recallIdx + 1) / pairs.length) * 100} />
        <Card className="center stack">
          <span className="pill">Spot {recallIdx + 1} of {pairs.length}</span>
          <div className="big-emoji">{locus.emoji}</div>
          <Display as="h3">What did you put at {locus.label}?</Display>
          <div className="choice-grid">
            {options.map((o) => (
              <button key={o} className="choice" style={{ fontSize: "0.9rem" }} onClick={() => answerRecall(o)}>
                {o}
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // done
  return (
    <div className="stack">
      <Card className="center stack">
        <div className="big-emoji">{correct === pairs.length ? "🏆" : "🌟"}</div>
        <Display as="h3">You recalled {correct}/{pairs.length}!</Display>
        <p className="ds-muted">
          Your <strong>memory-trick</strong> skill grew. I've scheduled a quick review for later — that's what makes it
          stick. Great place to stop. 🎉
        </p>
        <Button big onClick={() => { setStage("pick"); setCorrect(0); }}>Try another palace</Button>
      </Card>
    </div>
  );
}

function optionsFor(list: string[], correct: string, salt: number): string[] {
  const others = list.filter((x) => x !== correct);
  const picks = others.filter((_, i) => (i + salt) % 2 === 0).slice(0, 3);
  return [correct, ...picks].sort((a, b) => ((a.charCodeAt(0) + salt) % 5) - ((b.charCodeAt(0) + salt) % 5));
}
