import { Avatar, Button, Card, DailyChallengeCard, Display, GuideBubble, SkillMap } from "@loci/design-system";
import type { Screen } from "../App.js";
import type { Spine } from "../spine.js";
import { MODULES } from "../registry.js";
import { skillRows } from "../skillRows.js";
import { dateKey } from "@loci/data-local";
import { QuestCard } from "../guardian/QuestCard.js";

/** Screen 2 — Hub home. The daily anchor (PRD 6.3). */
export function Hub({ spine, nav }: { spine: Spine; nav: (s: Screen) => void }) {
  const profile = spine.activeProfile()!;
  const streak = spine.store.streak(profile.id);
  const rows = skillRows(spine).slice(0, 4);
  const todayDone = spine.store.getDaily(profile.id, dateKey())?.completed ?? false;

  return (
    <div className="stack">
      <div className="topbar">
        <h1>Loci</h1>
        <div className="row" style={{ gap: 8 }}>
          {streak > 0 && <span className="streak">🔥 {streak}</span>}
          <button
            aria-label="Pick your look"
            title="Pick your look"
            style={{ border: "1px solid var(--line)", background: "var(--surface-raised)", cursor: "pointer", fontSize: 20, width: 44, height: 44, borderRadius: "50%" }}
            onClick={() => nav({ name: "theme" })}
          >
            🎨
          </button>
          <button aria-label="Switch profile" style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }} onClick={() => nav({ name: "profiles" })}>
            <Avatar emoji={profile.avatarId} label={profile.displayName} />
          </button>
        </div>
      </div>

      <GuideBubble>
        {streak > 0 ? `Welcome back, ${profile.displayName}! ` : `Hi ${profile.displayName}! `}
        Ready to grow your thinking today?
      </GuideBubble>

      <DailyChallengeCard
        title="Today's Challenge"
        subtitle="A quick, finite brain workout — like a crossword, done in a few minutes."
        cta="Play today's challenge"
        done={todayDone}
        onStart={() => nav({ name: "daily" })}
      />

      <QuestCard spine={spine} />

      <Card className="stack">
        <div className="spread">
          <Display as="h2" style={{ fontSize: "1.3rem" }}>
            Your Thinking Skills
          </Display>
          <Button variant="ghost" onClick={() => nav({ name: "skillmap" })}>
            See all
          </Button>
        </div>
        <SkillMap skills={rows} />
      </Card>

      <div className="spread">
        <Display as="h2" style={{ fontSize: "1.3rem" }}>
          Modules
        </Display>
        <Button variant="ghost" onClick={() => nav({ name: "reviews" })}>
          Reviews due
        </Button>
      </div>
      <div className="tiles">
        {MODULES.map((m) => (
          <button key={m.id} className="tile" onClick={() => nav({ name: "module", moduleId: m.id })}>
            <span className="tile__emoji">{m.emoji}</span>
            <span className="tile__name">{m.displayName}</span>
            <span className="tile__blurb">{m.blurb}</span>
          </button>
        ))}
      </div>

      <div className="center" style={{ marginTop: 12 }}>
        <Button variant="ghost" onClick={() => nav({ name: "grownups" })}>
          Grown-ups corner
        </Button>
      </div>
    </div>
  );
}
