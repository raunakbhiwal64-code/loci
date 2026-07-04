import React from "react";
import { createRoot } from "react-dom/client";
import type { LociModule, ModuleContext } from "@loci/module-sdk";
import { Button, Card, Display, GuideBubble } from "@loci/design-system";

/**
 * "Sparks" — a throwaway demo module. Its whole job is to prove the Phase-0
 * exit gate: a new module inherits the design system, writes to the skill map,
 * emits analytics, and appears in the Hub, all through ModuleContext alone.
 */
function Sparks({ ctx }: { ctx: ModuleContext }) {
  const [count, setCount] = React.useState(0);
  const tap = () => {
    setCount((c) => c + 1);
    ctx.progression.award("pattern-recognition", 4);
    ctx.analytics.emit({ kind: "activity", action: count === 0 ? "started" : "completed", moduleId: "placeholder", skills: ["pattern-recognition"] });
  };
  return React.createElement(
    "div",
    { className: "stack" },
    React.createElement(GuideBubble, null, "This tiny module was added in minutes — that's the whole point."),
    React.createElement(
      Card,
      { className: "center stack" },
      React.createElement(Display, { as: "h3" }, "Spark tapper"),
      React.createElement("div", { className: "big-emoji" }, "✨"),
      React.createElement("p", { className: "ds-muted" }, `Sparks made: ${count}`),
      React.createElement(Button, { big: true, onClick: tap }, "Make a spark (+4 pattern skill)")
    )
  );
}

export const placeholder: LociModule = {
  id: "placeholder",
  displayName: "Sparks",
  accentToken: "--accent-placeholder",
  skillsAwarded: ["pattern-recognition"],
  mount(container, ctx) {
    const root = createRoot(container);
    root.render(React.createElement(Sparks, { ctx }));
    return () => root.unmount();
  },
};
