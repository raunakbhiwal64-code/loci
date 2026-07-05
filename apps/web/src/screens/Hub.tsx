import { Avatar, Button, Card, DailyChallengeCard, Display, GuideBubble } from "@loci/design-system";
import type { Screen } from "../App.js";
import type { Spine } from "../spine.js";
import { MODULES } from "../registry.js";
import { dateKey } from "@loci/data-local";
import { QuestCard } from "../guardian/QuestCard.js";
import { AdventureTrail } from "../components/AdventureMap.js";
import type { SkillId } from "@loci/module-sdk";
import { journeyProgress, nextNode } from "../journey/engine.js";

/** Screen 2 — Hub home. The daily anchor (PRD 6.3). */
export function Hub({ spine, nav }: { spine: Spine; nav: (s: Screen) => void }) {
  const profile = spine.activeProfile()!;
  const streak = spine.store.streak(profile.id);
  const todayDone = spine.store.getDaily(profile.id, dateKey())?.completed ?? false;

  // The structured journey's single next step (Learning Architecture spec §9).
  const allSkills = spine.progression().all();
  const jSnap = { levelOf: (s: SkillId) => allSkills.find((p) => p.skillId === s)?.level ?? 0, dueCount: spine.srs().due().length };
  const next = nextNode(jSnap);
  const jProgress = journeyProgress(jSnap);

  return (
    <div className="stack">
      <div className="topbar">
        <h1>Loci</h1>
        <div className="row" style={{ gap: 8 }}>
          {streak > 0 && <span className="streak">🔥 {streak}</span>}
          <button
            aria-label="Make it yours — theme and buddy"
            title="Make it yours"
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

      {/* The guided journey — one clear next step (Learning Architecture spec §9). */}
      <Card className="stack" style={{ borderColor: "var(--ember)" }}>
        <div className="spread">
          <Display as="h2" style={{ fontSize: "1.3rem" }}>
            Your Journey
          </Display>
          <span className="ds-muted">{jProgress.done}/{jProgress.total} steps</span>
        </div>
        {next ? (
          <>
            <p className="ds-muted" style={{ margin: 0 }}>
              Next step: <strong style={{ color: "var(--ink)" }}>{next.title}</strong> — {next.blurb}
            </p>
            <div className="row" style={{ gap: 8 }}>
              <Button big onClick={() => nav({ name: "journey" })}>
                Continue journey →
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="ds-muted" style={{ margin: 0 }}>
              You've completed the whole journey so far — new steps arrive as you keep growing. 🎉
            </p>
            <Button onClick={() => nav({ name: "journey" })}>See your journey</Button>
          </>
        )}
      </Card>

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
            Your Adventure Map
          </Display>
          <Button variant="ghost" onClick={() => nav({ name: "skillmap" })}>
            Open map
          </Button>
        </div>
        <AdventureTrail spine={spine} />
      </Card>

      <div className="spread">
        <Display as="h2" style={{ fontSize: "1.3rem" }}>
          Explore modules freely
        </Display>
        <Button variant="ghost" onClick={() => nav({ name: "reviews" })}>
          Reviews due
        </Button>
      </div>
      <p className="ds-muted" style={{ margin: "0 0 4px" }}>
        Prefer to pick for yourself? Jump into any world.
      </p>
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
