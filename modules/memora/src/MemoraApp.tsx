import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { allPalaces, DEFAULT_LIST, type Palace } from "./palaces.js";
import { MyPalaces, PhotoPalace } from "./builder/PhotoPalace.js";
import { localMnemonic } from "./util.js";

/**
 * Memora core loop on the spine: pick palace → meet the list → placement coach
 * (AI mnemonic prompts via the gateway) → the walk → active recall → done.
 * Awards long-term-memory-technique + working-memory, schedules SRS reviews.
 *
 * The child can also build their own photo palace ("Build my own palace"),
 * which then appears in the palace picker with the photo + numbered pins.
 */

type Stage = "pick" | "build" | "meet" | "place" | "walk" | "recall" | "done";

export function MemoraApp({ ctx }: { ctx: ModuleContext }) {
  const [stage, setStage] = useState<Stage>("pick");
  // Bumped whenever a custom palace is saved/deleted so the picker re-reads storage.
  const [paletteRev, setPaletteRev] = useState(0);
  const palaces = useMemo(() => allPalaces(ctx.storage), [ctx, paletteRev]);
  const [palace, setPalace] = useState<Palace>(palaces[0]);

  const list = DEFAULT_LIST;
  const pairs = useMemo(
    () => palace.loci.slice(0, list.length).map((locus, i) => ({ locus, item: list[i] })),
    [palace, list]
  );

  const [placeIdx, setPlaceIdx] = useState(0);
  const [hint, setHint] = useState<string>("");
  const [recallIdx, setRecallIdx] = useState(0);
  const [correct, setCorrect] = useState(0);

  // Placement coach — one vivid mnemonic prompt per spot. Photo palaces carry
  // child-authored spot labels, so they use the deterministic local coach line
  // (never sent to ctx.ai); ready-made palaces use the AI gateway.
  const loadHint = async (item: string, locusLabel: string) => {
    if (palace.photo) {
      setHint(localMnemonic(item, locusLabel));
      return;
    }
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

  if (stage === "build") {
    return (
      <PhotoPalace
        ctx={ctx}
        onExit={() => {
          setPaletteRev((r) => r + 1);
          setStage("pick");
        }}
      />
    );
  }

  if (stage === "pick") {
    return (
      <div className="stack">
        <GuideBubble>A memory palace is a place you know well. We'll hide things around it, then walk through to find them again.</GuideBubble>
        <Display as="h3">Pick your palace</Display>
        <div className="tiles">
          {palaces.map((p) => (
            <button key={p.id} className="tile" onClick={() => { setPalace(p); setStage("meet"); }}>
              {p.photo ? (
                <img src={p.photo} alt="" className="tile__photo" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: "var(--r-md)" }} />
              ) : (
                <span className="tile__emoji">{p.emoji}</span>
              )}
              <span className="tile__name">{p.name}</span>
              <span className="tile__blurb">{p.photo ? "your own palace — " : ""}{p.loci.length} spots to explore</span>
            </button>
          ))}
          <button className="tile" onClick={() => setStage("build")}>
            <span className="tile__emoji">🏠</span>
            <span className="tile__name">Build my own palace</span>
            <span className="tile__blurb">Take photos of a place you know</span>
          </button>
        </div>
        <MyPalaces ctx={ctx} onBuild={() => setStage("build")} />
      </div>
    );
  }

  if (stage === "meet") {
    return (
      <div className="stack">
        <Display as="h3">What you'll remember</Display>
        <p className="ds-muted">The eight planets, in order. We'll place one at each spot in the {palace.name}.</p>
        {palace.photo && <PhotoPins palace={palace} />}
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
        {palace.photo && <PhotoPins palace={palace} highlight={placeIdx} />}
        <Card className="center stack">
          <span className="pill">Spot {placeIdx + 1} of {pairs.length}</span>
          {!palace.photo && <div className="big-emoji">{locus.emoji}</div>}
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
        {palace.photo && <PhotoPins palace={palace} />}
        <Card>
          <ol style={{ lineHeight: 2 }}>
            {pairs.map((p, i) => (
              <li key={p.locus.id}>
                {palace.photo ? `${i + 1}.` : p.locus.emoji} {p.locus.label} → <strong>{p.item}</strong>
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
        {palace.photo && <PhotoPins palace={palace} highlight={recallIdx} />}
        <Card className="center stack">
          <span className="pill">Spot {recallIdx + 1} of {pairs.length}</span>
          {!palace.photo && <div className="big-emoji">{locus.emoji}</div>}
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

/** A photo palace rendered with its numbered pins; the active spot glows. */
function PhotoPins({ palace, highlight }: { palace: Palace; highlight?: number }) {
  if (!palace.photo) return null;
  return (
    <div style={{ position: "relative", borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--line)" }}>
      <img src={palace.photo} alt={palace.name} style={{ width: "100%", display: "block" }} />
      {palace.loci.map((s, i) => (
        <span
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x ?? 50}%`,
            top: `${s.y ?? 50}%`,
            transform: "translate(-50%, -50%)",
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: 14,
            color: "#fff",
            background: i === highlight ? "var(--accent)" : "rgba(46,42,36,0.72)",
            border: "2px solid #fff",
          }}
        >
          {i + 1}
        </span>
      ))}
    </div>
  );
}

function optionsFor(list: string[], correct: string, salt: number): string[] {
  const others = list.filter((x) => x !== correct);
  const picks = others.filter((_, i) => (i + salt) % 2 === 0).slice(0, 3);
  return [correct, ...picks].sort((a, b) => ((a.charCodeAt(0) + salt) % 5) - ((b.charCodeAt(0) + salt) % 5));
}
