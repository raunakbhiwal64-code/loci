import { Button, Card, Display, SkillMap } from "@loci/design-system";
import { SKILLS } from "@loci/core-progression";
import type { Spine } from "../spine.js";
import { skillRows } from "../skillRows.js";

/** Screen 8 — Skill map (full view). The ecosystem made visible (PRD 6.3). */
export function SkillMapScreen({ spine, onBack }: { spine: Spine; onBack: () => void }) {
  const rows = skillRows(spine);
  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onBack}>
          ← Home
        </Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>
          Your Thinking Skills
        </Display>
      </div>
      <p className="ds-muted">
        Every activity grows a real, named skill. We show exactly which one — and we never claim it makes you
        "smarter" in general.
      </p>
      <Card>
        <SkillMap skills={rows} />
      </Card>
      <Card className="stack">
        <Display as="h3" style={{ fontSize: "1.1rem" }}>
          Which module grows what
        </Display>
        <ul className="ds-muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
          {rows.slice(0, 6).map((r) => (
            <li key={r.id}>
              <strong>{r.label}</strong> — {SKILLS[r.id as keyof typeof SKILLS].trainedBy.join(", ")}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
