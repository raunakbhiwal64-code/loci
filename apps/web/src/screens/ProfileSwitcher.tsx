import { useState } from "react";
import { Avatar, Button, Card, Display } from "@loci/design-system";
import type { Spine } from "../spine.js";

/** Screen 10 — Profile switcher. Fast, visual, no credentials (multi-child devices). */
export function ProfileSwitcher({ spine, onDone }: { spine: Spine; onDone: () => void }) {
  const [, force] = useState(0);
  const profiles = spine.store.listProfiles();
  const active = spine.activeProfile();

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onDone}>← Home</Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>Who's playing?</Display>
      </div>

      <div className="tiles">
        {profiles.map((p) => (
          <button
            key={p.id}
            className="tile"
            style={{ borderColor: p.id === active?.id ? "var(--ember)" : undefined }}
            onClick={() => {
              spine.store.setActiveProfile(p.id);
              onDone();
            }}
          >
            <Avatar emoji={p.avatarId} label={p.displayName} />
            <span className="tile__name">{p.displayName}</span>
            <span className="tile__blurb">{p.ageBand} years · 🔥 {spine.store.streak(p.id)}</span>
          </button>
        ))}
      </div>

      <Card className="row spread">
        <span className="ds-muted">Add another child</span>
        <Button
          onClick={() => {
            // Clearing the active profile drops back to first-run to add one.
            const created = spine.store.createProfile({
              displayName: "Explorer",
              avatarId: "🐢",
              ageBand: "8-9",
              settings: { audioPrompts: true, reducedMotion: false },
            });
            spine.store.setActiveProfile(created.id);
            force((n) => n + 1);
            onDone();
          }}
        >
          + New
        </Button>
      </Card>

      {active && profiles.length > 1 && (
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm(`Remove ${active.displayName}? This deletes their progress on this device.`)) {
              spine.store.deleteProfile(active.id);
              force((n) => n + 1);
            }
          }}
        >
          Remove {active.displayName}
        </Button>
      )}
    </div>
  );
}
