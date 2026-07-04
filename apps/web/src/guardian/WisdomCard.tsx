import { useState } from "react";
import { Button, Card, Display } from "@loci/design-system";
import type { Spine } from "../spine.js";
import { markWisdomShown, todaysWisdomCard } from "./logic.js";

/**
 * Screen 12 — the Guardian wisdom card (PRD 6.4). One illustrated 15-second
 * safety micro-lesson at the session-end moment. Read-aloud, skippable,
 * never a pop-up mid-play.
 */
export function WisdomCardView({ spine }: { spine: Spine }) {
  const [card] = useState(() => todaysWisdomCard(spine));
  const [dismissed, setDismissed] = useState(false);

  if (!card || dismissed) return null;

  const speak = () => {
    try {
      const u = new SpeechSynthesisUtterance(`${card.title}. ${card.text}`);
      u.rate = 0.95;
      speechSynthesis.speak(u);
    } catch {
      /* listen unavailable — text is right there */
    }
  };

  const close = () => {
    markWisdomShown(spine);
    setDismissed(true);
  };

  return (
    <Card className="stack" style={{ borderLeft: "6px solid var(--gold)" }}>
      <div className="row">
        <div className="big-emoji" style={{ fontSize: 36 }}>{card.emoji}</div>
        <div>
          <span className="pill">Guardian wisdom</span>
          <Display as="h3" style={{ fontSize: "1.15rem", marginTop: 4 }}>{card.title}</Display>
        </div>
      </div>
      <p style={{ margin: 0, lineHeight: 1.6 }}>{card.text}</p>
      {card.coCard && <p className="ds-muted" style={{ margin: 0, fontSize: "0.85rem" }}>💛 This one is great to talk about with your grown-up.</p>}
      <div className="row">
        <Button variant="ghost" onClick={speak}>🔊 Read to me</Button>
        <Button onClick={close}>Got it!</Button>
      </div>
    </Card>
  );
}
