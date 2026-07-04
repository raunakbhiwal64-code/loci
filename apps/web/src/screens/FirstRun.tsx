import { useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import { COMPANIONS, companionById, setCompanion } from "@loci/design-system";
import type { AgeBand } from "@loci/module-sdk";
import type { Spine } from "../spine.js";

const AVATARS = ["🦊", "🐼", "🐵", "🐙", "🦁", "🐢", "🦄", "🐝"];

/** Screen 1 & 15 — First-run welcome + meet-and-name your companion (PRD 6.5). */
export function FirstRun({ spine, onDone }: { spine: Spine; onDone: () => void }) {
  const [avatarId, setAvatar] = useState(AVATARS[0]);
  const [name, setName] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("8-9");
  const [companionId, setCompanionId] = useState(COMPANIONS[0].id);
  const [buddyName, setBuddyName] = useState("");

  // Live-preview the chosen buddy in the GuideBubble as you pick.
  const previewBuddy = (id: string) => {
    setCompanionId(id);
    setCompanion(id, buddyName || companionById(id).defaultName);
  };

  const create = () => {
    const finalBuddyName = buddyName.trim() || companionById(companionId).defaultName;
    spine.store.createProfile({
      displayName: name.trim() || "Explorer",
      avatarId,
      ageBand,
      companionId,
      companionName: finalBuddyName,
      settings: { audioPrompts: true, reducedMotion: false },
    });
    setCompanion(companionId, finalBuddyName);
    spine.analytics.emit({ kind: "session", action: "start" });
    onDone();
  };

  return (
    <div className="stack">
      <div className="center">
        <div className="big-emoji">🗝️</div>
        <Display>Welcome to Loci</Display>
        <p className="ds-muted">Pick who's playing. No sign-up, nothing saved online.</p>
      </div>

      <GuideBubble>Hi! I'm your buddy — pick who I am and give me a name. Then choose your face, and we're off!</GuideBubble>

      <Card className="stack">
        <div>
          <div className="pill">Pick your buddy</div>
          <div className="choice-grid" style={{ marginTop: 10 }}>
            {COMPANIONS.map((c) => (
              <button
                key={c.id}
                className="choice"
                aria-pressed={c.id === companionId}
                title={c.species}
                onClick={() => previewBuddy(c.id)}
              >
                {c.emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="pill">Name your buddy</div>
          <input
            className="text"
            style={{ marginTop: 10 }}
            placeholder={companionById(companionId).defaultName}
            value={buddyName}
            maxLength={16}
            onChange={(e) => { setBuddyName(e.target.value); setCompanion(companionId, e.target.value || companionById(companionId).defaultName); }}
          />
        </div>

        <div>
          <div className="pill">Your face</div>
          <div className="choice-grid" style={{ marginTop: 10 }}>
            {AVATARS.map((a) => (
              <button key={a} className="choice" aria-pressed={a === avatarId} onClick={() => setAvatar(a)}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="pill">Your name</div>
          <input
            className="text"
            style={{ marginTop: 10 }}
            placeholder="First name or nickname"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <div className="pill">How old are you?</div>
          <div className="row" style={{ marginTop: 10 }}>
            {(["8-9", "10-12"] as AgeBand[]).map((b) => (
              <button key={b} className="choice" style={{ fontSize: "1rem", flex: 1 }} aria-pressed={b === ageBand} onClick={() => setAgeBand(b)}>
                {b} years
              </button>
            ))}
          </div>
        </div>

        <Button big onClick={create}>
          Let's go →
        </Button>
      </Card>
    </div>
  );
}
