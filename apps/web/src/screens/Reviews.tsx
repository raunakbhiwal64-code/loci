import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { RecallGrade } from "@loci/module-sdk";
import type { Spine } from "../spine.js";
import { findModule } from "../registry.js";
import { resolveSafetyRef } from "../guardian/logic.js";

/** Screen 9 — Reviews (SRS). Due-today queue across modules; offline-capable. */
export function Reviews({ spine, onBack }: { spine: Spine; onBack: () => void }) {
  const srs = useMemo(() => spine.srs(), [spine]);
  const [queue, setQueue] = useState(() => srs.due());
  const [i, setI] = useState(0);

  const grade = (g: RecallGrade) => {
    const item = queue[i];
    if (item) {
      srs.review(item.id, g);
      spine.analytics.emit({ kind: "review", action: g === "again" ? "missed" : "recalled", moduleId: item.moduleId });
    }
    setI((n) => n + 1);
  };

  const remaining = queue.slice(i);
  const item = remaining[0];

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onBack}>
          ← Home
        </Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>
          Reviews
        </Display>
      </div>

      {item && item.moduleId === "guardian" ? (
        <SafetyReview key={item.id} spine={spine} payloadRef={item.payloadRef} remaining={remaining.length} onGrade={grade} />
      ) : !item ? (
        <Card className="center stack">
          <div className="big-emoji">🌟</div>
          <Display as="h3">All caught up!</Display>
          <p className="ds-muted">Nothing due right now. Reviews keep what you learn from fading — come back when something's due.</p>
          <Button onClick={() => { setQueue(srs.due()); setI(0); }}>Refresh</Button>
        </Card>
      ) : (
        <>
          <GuideBubble>Can you still remember this one? Be honest — it helps me schedule the next review.</GuideBubble>
          <Card className="center stack">
            <span className="pill">{findModule(item.moduleId)?.displayName ?? item.moduleId}</span>
            <Display as="h3" style={{ fontSize: "1.4rem" }}>
              {item.payloadRef}
            </Display>
            <p className="ds-muted">{remaining.length} to review</p>
            <div className="row wrap" style={{ justifyContent: "center" }}>
              <Button variant="ghost" onClick={() => grade("again")}>Forgot</Button>
              <Button variant="ghost" onClick={() => grade("hard")}>Tricky</Button>
              <Button onClick={() => grade("good")}>Got it</Button>
              <Button onClick={() => grade("easy")}>Easy!</Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/** Guardian safety-fact review: real recall with a reveal (PRD 6.4 "safety on the SRS"). */
function SafetyReview({
  spine,
  payloadRef,
  remaining,
  onGrade,
}: {
  spine: Spine;
  payloadRef: string;
  remaining: number;
  onGrade: (g: RecallGrade) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const fact = resolveSafetyRef(spine, payloadRef);
  if (!fact) {
    return (
      <Card className="center stack">
        <p className="ds-muted">This review looks out of date.</p>
        <Button onClick={() => onGrade("good")}>Skip it</Button>
      </Card>
    );
  }
  return (
    <>
      <GuideBubble>Safety fact! Say it out loud first, then check yourself. This is real superhero knowledge.</GuideBubble>
      <Card className="center stack">
        <span className="pill">🛡️ Guardian</span>
        <Display as="h3" style={{ fontSize: "1.3rem" }}>{fact.prompt}</Display>
        <p className="ds-muted">{remaining} to review</p>
        {!revealed ? (
          <Button big onClick={() => setRevealed(true)}>I said it — show me</Button>
        ) : (
          <>
            <p style={{ fontSize: "1.05rem", lineHeight: 1.6 }}>{fact.answer || "Ask your grown-up to set this up in the Grown-ups corner!"}</p>
            <div className="row wrap" style={{ justifyContent: "center" }}>
              <Button variant="ghost" onClick={() => onGrade("again")}>Not yet</Button>
              <Button variant="ghost" onClick={() => onGrade("hard")}>Nearly</Button>
              <Button onClick={() => onGrade("good")}>Got it</Button>
              <Button onClick={() => onGrade("easy")}>Easy!</Button>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
