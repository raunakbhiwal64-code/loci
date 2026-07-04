import { useState } from "react";
import { Button, Card, Display, Modal } from "@loci/design-system";
import type { Spine } from "../spine.js";
import { completeQuest, questOfWeek } from "./logic.js";

/**
 * Screen 14 — the weekly Real-World Quest (PRD 6.2). Progress for LEAVING the
 * app: the only progress source that requires no screen time. Parent taps to
 * confirm behind a simple adult gate.
 */
export function QuestCard({ spine }: { spine: Spine }) {
  const [, force] = useState(0);
  const [gate, setGate] = useState(false);
  const [a] = useState(() => 6 + Math.floor(Math.random() * 7));
  const [b] = useState(() => 3 + Math.floor(Math.random() * 7));
  const [answer, setAnswer] = useState("");

  const { quest, done } = questOfWeek(spine);

  const confirm = () => {
    if (Number(answer) !== a * b) return;
    completeQuest(spine);
    setGate(false);
    setAnswer("");
    force((n) => n + 1);
  };

  return (
    <>
      <Card className="stack" style={{ borderLeft: "6px solid var(--good)" }}>
        <div className="spread">
          <span className="pill">🌳 Real-World Quest · this week</span>
          {done && <span className="pill" style={{ background: "var(--good)", color: "#fff" }}>Done! 🎉</span>}
        </div>
        <div className="row">
          <div className="big-emoji" style={{ fontSize: 36 }}>{quest.emoji}</div>
          <div>
            <Display as="h3" style={{ fontSize: "1.15rem" }}>{quest.title}</Display>
            <p className="ds-muted" style={{ margin: "4px 0 0" }}>{quest.text}</p>
          </div>
        </div>
        {!done && (
          <Button variant="ghost" onClick={() => setGate(true)}>
            ✅ Grown-up: confirm it's done
          </Button>
        )}
      </Card>

      {gate && (
        <Modal onClose={() => setGate(false)}>
          <div className="stack center">
            <Display as="h3">Grown-up check</Display>
            <p className="ds-muted">Confirm the quest really happened out in the world! What is {a} × {b}?</p>
            <input className="text" inputMode="numeric" value={answer} onChange={(e) => setAnswer(e.target.value)} />
            <div className="row" style={{ justifyContent: "center" }}>
              <Button variant="ghost" onClick={() => setGate(false)}>Cancel</Button>
              <Button onClick={confirm}>Confirm quest</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
