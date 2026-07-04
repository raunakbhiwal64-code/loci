import { useMemo, useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { RecallGrade } from "@loci/module-sdk";
import type { Spine } from "../spine.js";
import { findModule } from "../registry.js";

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

      {!item ? (
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
