import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble, ProgressRibbon } from "@loci/design-system";
import type { ModuleContext } from "@loci/module-sdk";
import { allPalaces, type Palace } from "../palaces.js";
import type { ListSource } from "../lists.js";
import { recordBeltResult } from "../belts.js";
import { localMnemonic, optionsFor } from "../util.js";

/**
 * Palace Journey — belt 2, the flagship engine: pick palace → meet the list →
 * placement coach → the walk → active recall. Works with every ready-made
 * palace AND custom photo palaces (photo shown with numbered pins). Any list
 * can ride it.
 *
 * Privacy rule: mnemonic prompts go to ctx.ai ONLY when both the list and the
 * palace are authored by us. Child-entered lists and photo-palace spot labels
 * get deterministic local mnemonics instead.
 */

type Stage = "pick" | "meet" | "place" | "walk" | "recall" | "done";

export function PalaceJourney({ ctx, list, onExit }: { ctx: ModuleContext; list: ListSource; onExit: () => void }) {
  const palaces = useMemo(() => allPalaces(ctx.storage), [ctx]);
  const [stage, setStage] = useState<Stage>("pick");
  const [palace, setPalace] = useState<Palace>(palaces[0]);

  const items = useMemo(() => list.items.slice(0, palace.loci.length), [list, palace]);
  const pairs = useMemo(() => palace.loci.slice(0, items.length).map((locus, i) => ({ locus, item: items[i] })), [palace, items]);

  const [placeIdx, setPlaceIdx] = useState(0);
  const [hint, setHint] = useState("");
  const [recallIdx, setRecallIdx] = useState(0);
  const [correct, setCorrect] = useState(0);

  const loadHint = async (item: string, locusLabel: string) => {
    if (!list.authored || palace.photo) {
      // Child-entered content stays on-device — deterministic coach line.
      setHint(localMnemonic(item, locusLabel));
      return;
    }
    setHint("…");
    const r = await ctx.ai.generateContent({ task: "memora.mnemonic", context: { item, place: locusLabel } });
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

  const recallOptions = useMemo(
    () => (stage === "recall" && recallIdx < pairs.length ? optionsFor(items, pairs[recallIdx].item) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stage, recallIdx]
  );

  const answerRecall = (guess: string) => {
    const truth = pairs[recallIdx].item;
    const hit = guess === truth;
    if (hit) setCorrect((c) => c + 1);
    const n = recallIdx + 1;
    if (n >= pairs.length) finish(hit);
    else setRecallIdx(n);
  };

  const finish = (lastHit: boolean) => {
    const hits = correct + (lastHit ? 1 : 0);
    ctx.progression.award("long-term-memory-technique", 15 + hits * 6);
    ctx.progression.award("working-memory", hits * 3);
    // One review per learned set — the walk itself is the payload.
    ctx.srs.schedule("memora", `memora:palace:${palace.id}:${list.id}`);
    recordBeltResult(ctx.storage, "palace", hits, pairs.length);
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
          {palaces.map((p) => (
            <button key={p.id} className="tile" onClick={() => { setPalace(p); setStage("meet"); }}>
              <span className="tile__emoji">{p.emoji}</span>
              <span className="tile__name">{p.name}</span>
              <span className="tile__blurb">{p.photo ? "your own palace — " : ""}{p.loci.length} spots to explore</span>
            </button>
          ))}
        </div>
        <Button variant="ghost" onClick={onExit}>← Back</Button>
      </div>
    );
  }

  if (stage === "meet") {
    return (
      <div className="stack">
        <Display as="h3">What you'll remember</Display>
        <p className="ds-muted">
          {list.emoji} {list.title} — we'll place one thing at each spot in the {palace.name}.
        </p>
        {palace.photo && <PhotoPins palace={palace} />}
        <Card>
          <div className="choice-grid">
            {items.map((item) => (
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
    const { locus } = pairs[recallIdx];
    return (
      <div className="stack">
        <ProgressRibbon value={((recallIdx + 1) / pairs.length) * 100} />
        {palace.photo && <PhotoPins palace={palace} highlight={recallIdx} />}
        <Card className="center stack">
          <span className="pill">Spot {recallIdx + 1} of {pairs.length}</span>
          {!palace.photo && <div className="big-emoji">{locus.emoji}</div>}
          <Display as="h3">What did you put at {locus.label}?</Display>
          <div className="choice-grid">
            {recallOptions.map((o) => (
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
        <Button big onClick={onExit}>Back to Memora</Button>
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
