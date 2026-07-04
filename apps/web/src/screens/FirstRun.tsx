import { useState } from "react";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";
import type { AgeBand } from "@loci/module-sdk";
import type { Spine } from "../spine.js";

const AVATARS = ["🦊", "🐼", "🦉", "🐙", "🦁", "🐢", "🦄", "🐝"];

/** Screen 1 — First-run welcome. Get a child playing in under 60s, no account. */
export function FirstRun({ spine, onDone }: { spine: Spine; onDone: () => void }) {
  const [avatarId, setAvatar] = useState(AVATARS[0]);
  const [name, setName] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("8-9");

  const create = () => {
    spine.store.createProfile({
      displayName: name.trim() || "Explorer",
      avatarId,
      ageBand,
      settings: { audioPrompts: true, reducedMotion: false },
    });
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

      <GuideBubble>Hi! I'm your Guide. Choose a face and a name, and we'll start straight away.</GuideBubble>

      <Card className="stack">
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
