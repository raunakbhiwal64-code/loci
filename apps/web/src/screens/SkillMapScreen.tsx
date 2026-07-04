import { Button, Card, Display, GuideBubble, SkillMap } from "@loci/design-system";
import { SKILLS } from "@loci/core-progression";
import type { Spine } from "../spine.js";
import { skillRows } from "../skillRows.js";
import { AdventureMap } from "../components/AdventureMap.js";

/** Screen 8 & 16 — the Adventure Map (child Growth Journey, PRD 6.3/6.7). */
export function SkillMapScreen({ spine, onBack }: { spine: Spine; onBack: () => void }) {
  const rows = skillRows(spine);
  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onBack}>
          ← Home
        </Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>
          Your Adventure Map
        </Display>
      </div>
      <GuideBubble>Every region is a thinking skill you can grow. Earn stars, and I'll travel the trail with you!</GuideBubble>

      <Card>
        <AdventureMap spine={spine} />
      </Card>

      <Card className="stack">
        <Display as="h3" style={{ fontSize: "1.1rem" }}>
          Which module grows what
        </Display>
        <p className="ds-muted" style={{ margin: 0 }}>
          Every activity grows a real, named skill — we show exactly which, and never claim it makes you "smarter" in general.
        </p>
        <ul className="ds-muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
          {rows.slice(0, 6).map((r) => (
            <li key={r.id}>
              <strong>{r.label}</strong> — {SKILLS[r.id as keyof typeof SKILLS].trainedBy.join(", ")}
            </li>
          ))}
        </ul>
      </Card>

      <details>
        <summary className="ds-muted" style={{ cursor: "pointer" }}>See exact levels</summary>
        <Card style={{ marginTop: 10 }}>
          <SkillMap skills={rows} />
        </Card>
      </details>
    </div>
  );
}
