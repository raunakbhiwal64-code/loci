import { useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { Scenario } from "./content.js";

/**
 * Screen 13 — Guardian "What Would You Do?" scenario player (PRD 6.4).
 * Illustrated setup → choices → warm feedback naming the rule. Wrong choices
 * resolve as "that's what a tricky person might hope" — never a bad outcome.
 */
export function ScenarioPlayer({ scenario, onDone }: { scenario: Scenario; onDone: (firstTrySafe: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  const choice = picked != null ? scenario.choices[picked] : null;

  return (
    <Card className="stack">
      <div className="center">
        <div className="big-emoji">{scenario.emoji}</div>
        <span className="pill">What would you do?</span>
        <Display as="h3" style={{ marginTop: 6 }}>{scenario.title}</Display>
      </div>
      <p style={{ lineHeight: 1.65, margin: 0 }}>{scenario.setup}</p>

      {!choice && (
        <div className="stack">
          {scenario.choices.map((c, i) => (
            <Button key={i} variant="ghost" style={{ textAlign: "left" }} onClick={() => { setPicked(i); setAttempts((a) => a + 1); }}>
              {c.text}
            </Button>
          ))}
        </div>
      )}

      {choice && (
        <div className="stack">
          <GuideBubble>
            <strong>{choice.safe ? "That's the strong move! 💪" : "Good thinking it through —"}</strong> {choice.feedback}
          </GuideBubble>
          <p className="ds-muted" style={{ margin: 0 }}>The rule: {scenario.rule}</p>
          {choice.safe ? (
            <Button big onClick={() => onDone(attempts === 1)}>Done — I know the strong move</Button>
          ) : (
            <Button big onClick={() => setPicked(null)}>Try the strong move</Button>
          )}
        </div>
      )}
    </Card>
  );
}
