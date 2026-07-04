import { useState } from "react";
import { Button, Card, Display, Modal } from "@loci/design-system";

/** Screen 11 — Grown-ups corner. Parent trust surface behind a simple adult gate. */
export function GrownUps({ onBack }: { onBack: () => void }) {
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
    </div>
  );
}
