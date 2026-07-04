import { useState } from "react";
import { Button, Display, GuideBubble } from "@loci/design-system";
import { THEMES } from "@loci/design-system";
import type { Spine } from "../spine.js";

/**
 * "Make it yours" — the kid picks a theme. All themes are open (no locks);
 * applied instantly and remembered per profile. Dark themes double as gentle
 * evening looks.
 */
export function ThemePicker({ spine, onBack }: { spine: Spine; onBack: () => void }) {
  const [current, setCurrent] = useState(spine.getTheme());

  const choose = (id: string) => {
    setCurrent(id);
    spine.setTheme(id); // applies + persists live
  };

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={onBack}>← Home</Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>Pick your look</Display>
      </div>
      <GuideBubble>Choose a colour theme — try a few! You can change it whenever you like.</GuideBubble>
      <div className="tiles">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className="tile"
            style={{ borderColor: t.id === current ? "var(--ember)" : undefined, borderWidth: t.id === current ? 2 : 1 }}
            onClick={() => choose(t.id)}
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
              {t.label} {t.id === current ? "✓" : ""}
            </span>
            <span className="tile__blurb">{t.note ?? (t.dark ? "dark theme" : "light theme")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
