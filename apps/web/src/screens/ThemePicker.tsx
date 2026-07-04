import { useState } from "react";
import { Button, Display, GuideBubble } from "@loci/design-system";
import { COMPANIONS, THEMES, companionById } from "@loci/design-system";
import type { Spine } from "../spine.js";

/**
 * "Make it yours" — the kid picks a theme AND their companion. All open, no
 * locks; applied instantly and remembered per profile. Dark themes double as
 * gentle evening looks.
 */
export function ThemePicker({ spine, onBack }: { spine: Spine; onBack: () => void }) {
  const [theme, setThemeState] = useState(spine.getTheme());
  const profile = spine.activeProfile();
  const [buddy, setBuddy] = useState(profile?.companionId ?? "owl");

  const chooseTheme = (id: string) => {
    setThemeState(id);
    spine.setTheme(id);
  };
  const chooseBuddy = (id: string) => {
    setBuddy(id);
    spine.setCompanionChoice(id, profile?.companionName);
  };

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onBack}>← Home</Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>Make it yours</Display>
      </div>
      <GuideBubble>Choose a colour theme and your buddy — try a few! You can change these whenever you like.</GuideBubble>

      <Display as="h3" style={{ fontSize: "1.15rem", margin: "6px 2px 0" }}>Your buddy</Display>
      <div className="choice-grid">
        {COMPANIONS.map((c) => (
          <button
            key={c.id}
            className="choice"
            aria-pressed={c.id === buddy}
            title={c.species}
            onClick={() => chooseBuddy(c.id)}
          >
            {c.emoji}
          </button>
        ))}
      </div>
      <p className="ds-muted" style={{ margin: 0 }}>
        {profile?.companionName ?? companionById(buddy).defaultName} the {companionById(buddy).species} — your friend across every module.
      </p>

      <Display as="h3" style={{ fontSize: "1.15rem", margin: "12px 2px 0" }}>Colour theme</Display>
      <div className="tiles">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className="tile"
            style={{ borderColor: t.id === theme ? "var(--ember)" : undefined, borderWidth: t.id === theme ? 2 : 1 }}
            onClick={() => chooseTheme(t.id)}
          >
            <span
              aria-hidden
              style={{
                width: "100%",
                height: 44,
                borderRadius: "var(--r-md)",
                background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1] ?? t.swatch[0]})`,
                border: "1px solid var(--line)",
              }}
            />
            <span className="tile__name" style={{ fontSize: "1rem", marginTop: 8 }}>
              {t.label} {t.id === theme ? "✓" : ""}
            </span>
            <span className="tile__blurb">{t.note ?? (t.dark ? "dark theme" : "light theme")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
