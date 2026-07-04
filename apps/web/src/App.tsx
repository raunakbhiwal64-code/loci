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

  // Re-render the shell whenever the spine reports a change (skill awards, etc.).
  useEffect(() => spine.onChange(() => force((n) => n + 1)), [spine]);

  const nav = (s: Screen) => setScreen(s);
  const profile = spine.activeProfile();

  // First run: no profile yet → activation gate (target < 60s to play).
  if (!profile) {
    return (
      <div className="loci-root app-shell">
        <FirstRun
          spine={spine}
          onDone={() => {
            spine.applyActiveTheme();
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
        <ProfileSwitcher spine={spine} onDone={() => { spine.applyActiveTheme(); force((n) => n + 1); nav({ name: "hub" }); }} />
      )}
      {screen.name === "daily" && <DailyChallenge spine={spine} onBack={() => nav({ name: "hub" })} />}
      {screen.name === "theme" && <ThemePicker spine={spine} onBack={() => nav({ name: "hub" })} />}
      {screen.name === "module" && (
        <ModuleHost spine={spine} moduleId={screen.moduleId} onBack={() => nav({ name: "hub" })} />
      )}
    </div>
  );
}
