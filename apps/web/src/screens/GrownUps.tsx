import { useState } from "react";
import { Button, Card, Display, Modal } from "@loci/design-system";
import type { Spine } from "../spine.js";
import { WISDOM_CARDS, SAFETY_FACTS } from "../guardian/content.js";
import { ensureSafetyFactsScheduled, getSafetySetup, setSafetySetup } from "../guardian/logic.js";
import { cognitiveRadar, learningCharacter, radarGeometry } from "../growth.js";

/** Screen 11 — Grown-ups corner. Parent trust surface behind a simple adult gate. */
export function GrownUps({ spine, onBack }: { spine: Spine; onBack: () => void }) {
  const [gate, setGate] = useState(true);
  // Deterministic adult gate: a simple two-digit sum kids under ~10 won't breeze past.
  const [a] = useState(() => 7 + Math.floor(Math.random() * 6));
  const [b] = useState(() => 4 + Math.floor(Math.random() * 6));
  const [answer, setAnswer] = useState("");

  if (gate) {
    return (
      <Modal onClose={onBack}>
        <div className="stack center">
          <Display as="h3">Grown-ups only</Display>
          <p className="ds-muted">
            Quick check for a grown-up: what is {a} × {b}?
          </p>
          <input className="text" inputMode="numeric" value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <div className="row" style={{ justifyContent: "center" }}>
            <Button variant="ghost" onClick={onBack}>Back</Button>
            <Button onClick={() => Number(answer) === a * b && setGate(false)}>Enter</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onBack}>← Home</Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>Grown-ups corner</Display>
      </div>

      <GrowthJourney spine={spine} />

      <Card className="stack">
        <Display as="h3" style={{ fontSize: "1.1rem" }}>What Loci is</Display>
        <p className="ds-muted">
          Loci teaches specific, real thinking skills — memory technique, chess, mental arithmetic, logical
          reasoning — and shows you exactly which one each activity trains.
        </p>
      </Card>

      <Card className="stack">
        <Display as="h3" style={{ fontSize: "1.1rem" }}>Our honesty stance</Display>
        <p className="ds-muted">
          We claim children learn these named skills and enjoy it. We do <strong>not</strong> claim we raise general
          intelligence, or that a skill here transfers to unrelated schoolwork. That would be dishonest, and the
          evidence doesn't support it.
        </p>
      </Card>

      <Card className="stack">
        <Display as="h3" style={{ fontSize: "1.1rem" }}>Privacy</Display>
        <p className="ds-muted">
          Everything stays on this device. No account, no ads ever, no data sold. Nothing your child does is uploaded.
        </p>
      </Card>

      <Card className="stack">
        <Display as="h3" style={{ fontSize: "1.1rem" }}>Wellbeing</Display>
        <p className="ds-muted">
          No streak-shaming, no manipulative timers, no endless feeds. The daily challenge is finite by design and we
          celebrate stopping.
        </p>
      </Card>

      <Card className="stack" style={{ borderLeft: "6px solid var(--good)" }}>
        <Display as="h3" style={{ fontSize: "1.1rem" }}>Our manifesto</Display>
        <p className="ds-muted">
          We think children should live in the real world. If they're on a screen, it should count for something.
          That's why sessions end by pointing outside, and why the weekly Real-World Quest earns progress for leaving
          the app.
        </p>
      </Card>

      <SafetySetup spine={spine} />

      <CoCards />
    </div>
  );
}

/** Guardian safety-fact setup. Everything entered stays ON THIS DEVICE only. */
function SafetySetup({ spine }: { spine: Spine }) {
  const [phone, setPhone] = useState(() => getSafetySetup(spine, "phone"));
  const [address, setAddress] = useState(() => getSafetySetup(spine, "address"));
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (phone.trim()) setSafetySetup(spine, "phone", phone);
    if (address.trim()) setSafetySetup(spine, "address", address);
    ensureSafetyFactsScheduled(spine);
    setSaved(true);
  };

  return (
    <Card className="stack">
      <Display as="h3" style={{ fontSize: "1.1rem" }}>Guardian: safety facts to memorise</Display>
      <p className="ds-muted">
        Loci rehearses real safety knowledge on the review schedule — your phone number, your home area, 112, and the
        five lost-rules — until your child truly remembers them. Entered details stay <strong>on this device only</strong>;
        they are never uploaded and never shown to the AI.
      </p>
      <label className="ds-muted" style={{ fontSize: "0.85rem" }}>
        Your phone number (for your child to memorise)
        <input className="text" style={{ marginTop: 6 }} inputMode="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(false); }} />
      </label>
      <label className="ds-muted" style={{ fontSize: "0.85rem" }}>
        Home area / address line
        <input className="text" style={{ marginTop: 6 }} value={address} onChange={(e) => { setAddress(e.target.value); setSaved(false); }} />
      </label>
      <Button onClick={save}>{saved ? "Saved ✓ — added to reviews" : "Save & add to reviews"}</Button>
    </Card>
  );
}

/** Parent co-cards: "talk about this together tonight" (PRD 6.4). */
function CoCards() {
  const cards = WISDOM_CARDS.filter((c) => c.coCard);
  return (
    <Card className="stack">
      <Display as="h3" style={{ fontSize: "1.1rem" }}>Talk about it together</Display>
      <p className="ds-muted">Conversation starters that land best coming from you:</p>
      <ul className="ds-muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        {cards.map((c) => (
          <li key={c.id}>
            <strong>{c.emoji} {c.title}:</strong> {c.coCard}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Cognitive-skills radar — real data from the skill map, drawn as pure SVG. */
function Radar({ spine }: { spine: Spine }) {
  const dims = cognitiveRadar(spine);
  const size = 260;
  const g = radarGeometry(dims, size);
  const poly = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: 260 }} role="img" aria-label="Cognitive skills radar">
      {g.rings.map((r, i) => (
        <polygon key={i} points={poly(r)} style={{ fill: "none", stroke: "var(--line)" }} strokeWidth={1} />
      ))}
      {g.axes.map((o, i) => (
        <line key={i} x1={g.c} y1={g.c} x2={o.x.toFixed(1)} y2={o.y.toFixed(1)} style={{ stroke: "var(--line)" }} strokeWidth={1} />
      ))}
      <polygon points={poly(g.data)} style={{ fill: "color-mix(in srgb, var(--accent-cortex) 22%, transparent)", stroke: "var(--accent-cortex)" }} strokeWidth={2.5} strokeLinejoin="round" />
      {g.data.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={3.4} style={{ fill: "var(--accent-cortex)" }} />
      ))}
      {g.labels.map((l, i) => (
        <text
          key={i}
          x={l.x.toFixed(1)}
          y={(l.y + 3).toFixed(1)}
          fontSize="9.5"
          fontWeight="700"
          textAnchor={l.x < g.c - 5 ? "end" : l.x > g.c + 5 ? "start" : "middle"}
          style={{ fill: "var(--ink-soft)", fontFamily: "var(--font-body)" }}
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}

/** The Growth Journey — the honest parent report (PRD 6.7). No IQ/EQ, ever. */
function GrowthJourney({ spine }: { spine: Spine }) {
  const character = learningCharacter(spine);
  const phone = getSafetySetup(spine, "phone");
  const address = getSafetySetup(spine, "address");
  const child = spine.activeProfile();

  return (
    <Card className="stack" style={{ borderLeft: "6px solid var(--accent-cortex)" }}>
      <Display as="h3" style={{ fontSize: "1.15rem" }}>{child?.displayName ?? "Your child"}'s Growth Journey</Display>
      <p className="ds-muted" style={{ margin: 0 }}>
        The same progress your child sees as an adventure — shown to you honestly. This is a record of learning
        progress in the app, <strong>not an IQ, EQ, or clinical assessment</strong>, and we never compare your child to others.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,240px) 1fr", gap: 18, alignItems: "center" }}>
        <div>
          <div className="pill">Cognitive skills</div>
          <Radar spine={spine} />
          <p className="ds-muted" style={{ fontSize: "0.78rem", margin: 0, textAlign: "center" }}>
            Each axis is a real metric — recall span, problems/min, puzzle level, reading level, chess rating…
          </p>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <div className="pill">Learning character <span style={{ fontWeight: 400 }}>· observed from play</span></div>
          {character.map((t) => (
            <div key={t.label} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, alignItems: "center", fontSize: "0.85rem" }}>
              <span>{t.label}</span>
              <span className="ds-ribbon" style={{ height: 9 }}><i style={{ width: `${Math.round(t.value * 100)}%` }} /></span>
            </div>
          ))}
          <p className="ds-muted" style={{ fontSize: "0.78rem", margin: 0 }}>These fill in as your child plays — from behaviour, never a made-up feelings score.</p>
        </div>
      </div>

      <div className="pill">Safety awareness</div>
      <div className="row wrap" style={{ gap: 6 }}>
        {SAFETY_FACTS.map((f) => {
          const ready = f.fixed || (f.needsSetup === "phone" ? phone : f.needsSetup === "address" ? address : "");
          return (
            <span key={f.key} className="pill" style={{ background: ready ? "var(--good)" : "var(--parchment-2)", color: ready ? "#fff" : "var(--ink-soft)" }}>
              {ready ? "✓" : "◦"} {f.key.replace(/-/g, " ")}
            </span>
          );
        })}
      </div>
      <p className="ds-muted" style={{ fontSize: "0.8rem", margin: 0 }}>
        Real safety facts your child is rehearsing on the review schedule — the trust signal no competitor shows.
        Gaps here are simply "next adventures", never failing.
      </p>
    </Card>
  );
}
