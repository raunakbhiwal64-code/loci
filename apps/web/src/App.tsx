import { useEffect, useState } from "react";
import type { Spine } from "./spine.js";
import { FirstRun } from "./screens/FirstRun.js";
import { Hub } from "./screens/Hub.js";
import { SkillMapScreen } from "./screens/SkillMapScreen.js";
import { Reviews } from "./screens/Reviews.js";
import { GrownUps } from "./screens/GrownUps.js";
import { ProfileSwitcher } from "./screens/ProfileSwitcher.js";
import { ModuleHost } from "./screens/ModuleHost.js";
import { DailyChallenge } from "./daily/DailyChallenge.js";
import { ThemePicker } from "./screens/ThemePicker.js";
import { Celebration } from "./components/Celebration.js";
import type { Milestone } from "./milestones.js";

export type Screen =
  | { name: "hub" }
  | { name: "skillmap" }
  | { name: "reviews" }
  | { name: "grownups" }
  | { name: "profiles" }
  | { name: "module"; moduleId: string }
  | { name: "daily" }
  | { name: "theme" };

export function App({ spine }: { spine: Spine }) {
  const [, force] = useState(0);
  const [screen, setScreen] = useState<Screen>({ name: "hub" });
  const [celebrations, setCelebrations] = useState<Milestone[]>([]);

  // Re-render on any spine change, and queue any newly-earned milestones.
  useEffect(
    () =>
      spine.onChange(() => {
        force((n) => n + 1);
        const fresh = spine.checkMilestones();
        if (fresh.length) setCelebrations((q) => [...q, ...fresh]);
      }),
    [spine]
  );

  const profile = spine.activeProfile();

  // Baseline milestones on mount / profile switch (silent for already-earned).
  useEffect(() => {
    if (profile) spine.checkMilestones();
  }, [spine, profile?.id]);

  const nav = (s: Screen) => setScreen(s);

  // First run: no profile yet → activation gate (target < 60s to play).
  if (!profile) {
    return (
      <div className="loci-root app-shell">
        <FirstRun
          spine={spine}
          onDone={() => {
            spine.applyActivePrefs();
            force((n) => n + 1);
            setScreen({ name: "hub" });
          }}
        />
      </div>
    );
  }

  return (
    <div className="loci-root app-shell">
      {screen.name === "hub" && <Hub spine={spine} nav={nav} />}
      {screen.name === "skillmap" && <SkillMapScreen spine={spine} onBack={() => nav({ name: "hub" })} />}
      {screen.name === "reviews" && <Reviews spine={spine} onBack={() => nav({ name: "hub" })} />}
      {screen.name === "grownups" && <GrownUps spine={spine} onBack={() => nav({ name: "hub" })} />}
      {screen.name === "profiles" && (
        <ProfileSwitcher spine={spine} onDone={() => { spine.applyActivePrefs(); force((n) => n + 1); nav({ name: "hub" }); }} />
      )}
      {screen.name === "daily" && <DailyChallenge spine={spine} onBack={() => nav({ name: "hub" })} />}
      {screen.name === "theme" && <ThemePicker spine={spine} onBack={() => nav({ name: "hub" })} />}
      {screen.name === "module" && (
        <ModuleHost spine={spine} moduleId={screen.moduleId} onBack={() => nav({ name: "hub" })} />
      )}

      {celebrations[0] && (
        <Celebration
          milestone={celebrations[0]}
          childName={profile.displayName}
          onClose={() => setCelebrations((q) => q.slice(1))}
        />
      )}
    </div>
  );
}
