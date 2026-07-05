import { Button, Card, Display, GuideBubble, ProgressRibbon, getCompanion } from "@loci/design-system";
import type { SkillId } from "@loci/module-sdk";
import type { Screen } from "../App.js";
import type { Spine } from "../spine.js";
import { MODULES } from "../registry.js";
import {
  journeyProgress,
  nextNode,
  sectionViews,
  sessionPlan,
  type NodeView,
  type PlanItem,
  type JourneySnapshot,
} from "../journey/engine.js";

/**
 * The Journey — the structured, personalised path (Learning Architecture spec
 * §9). One scrollable map across all modules: the road travelled and the road
 * ahead, with a single clear "continue", today's session recipe, mastery
 * lighting up, and cross-module connections surfaced. The same modules are
 * still browsable from the Hub — this is the guided way through them.
 */

const MODULE_EMOJI: Record<string, string> = Object.fromEntries(MODULES.map((m) => [m.id, m.emoji]));

function snapshotOf(spine: Spine): JourneySnapshot {
  const all = spine.progression().all();
  const dueCount = spine.srs().due().length;
  return {
    levelOf: (s: SkillId) => all.find((p) => p.skillId === s)?.level ?? 0,
    dueCount,
  };
}

function routeToScreen(item: PlanItem, node: NodeView | undefined): Screen {
  if (item?.route.screen === "reviews") return { name: "reviews" };
  const moduleId = node?.moduleId || (item?.route.screen === "module" ? item.route.moduleId : "");
  return { name: "module", moduleId };
}

export function Journey({ spine, nav }: { spine: Spine; nav: (s: Screen) => void }) {
  const profile = spine.activeProfile()!;
  const snap = snapshotOf(spine);
  const sections = sectionViews(snap);
  const progress = journeyProgress(snap);
  const current = nextNode(snap);
  const plan = sessionPlan(snap);
  const buddy = getCompanion().emoji;

  const goToNode = (n: NodeView) => {
    if (!n.moduleId) return; // checkpoints are markers, not activities
    nav({ name: "module", moduleId: n.moduleId });
  };

  return (
    <div className="stack">
      <div className="crumbs">
        <Button variant="ghost" onClick={() => nav({ name: "hub" })}>
          ← Home
        </Button>
        <Display as="h2" style={{ fontSize: "1.4rem" }}>
          Your Journey
        </Display>
      </div>

      <GuideBubble>
        {progress.done === 0
          ? `Let's begin, ${profile.displayName}! I'll show you exactly what to do next.`
          : `You're ${Math.round(progress.pct)}% of the way, ${profile.displayName}. Here's your next step!`}
      </GuideBubble>

      <Card className="stack">
        <div className="spread">
          <strong>Journey progress</strong>
          <span className="ds-muted">
            {progress.done} / {progress.total} steps
          </span>
        </div>
        <ProgressRibbon value={progress.pct} />
      </Card>

      {/* Today's plan — the session recipe (spec §6). */}
      {plan.length > 0 && (
        <Card className="stack">
          <Display as="h3" style={{ fontSize: "1.15rem" }}>
            Today's plan
          </Display>
          <div className="stack" style={{ gap: 10 }}>
            {plan.map((item, i) => (
              <PlanRow key={i} item={item} onStart={() => nav(routeToScreen(item, item.node as NodeView))} />
            ))}
          </div>
        </Card>
      )}

      {/* The map: sections → nodes on a lit trail. */}
      {sections.map((section) => (
        <div key={section.id} className="stack" style={{ gap: 8 }}>
          <div style={{ marginTop: 6 }}>
            <Display as="h3" style={{ fontSize: "1.15rem" }}>
              {section.title}
            </Display>
            <p className="ds-muted" style={{ margin: "2px 0 0" }}>
              {section.blurb} · {section.done}/{section.total} done
            </p>
          </div>

          <div style={{ position: "relative", paddingLeft: 6 }}>
            {section.nodes.map((node, idx) => (
              <TrailNode
                key={node.id}
                node={node}
                buddy={buddy}
                last={idx === section.nodes.length - 1}
                onGo={() => goToNode(node)}
                isCurrent={!!current && node.id === current.id}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="center" style={{ marginTop: 12 }}>
        <Button variant="ghost" onClick={() => nav({ name: "hub" })}>
          Or browse the modules yourself →
        </Button>
      </div>
    </div>
  );
}

function PlanRow({ item, onStart }: { item: PlanItem; onStart: () => void }) {
  const tag =
    item.kind === "recap" ? { emoji: "🔁", label: "Recap", color: "var(--accent-memora, var(--ember))" }
    : item.kind === "quickwin" ? { emoji: "⭐", label: "Quick win", color: "var(--gold, var(--ember))" }
    : { emoji: "🚀", label: "New step", color: "var(--ember)" };
  return (
    <div
      className="row"
      style={{
        gap: 12,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 14,
        background: "var(--surface-raised)",
        border: "1px solid var(--line)",
      }}
    >
      <span aria-hidden style={{ fontSize: 22 }}>
        {tag.emoji}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
          <strong>{item.title}</strong>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: tag.color,
            }}
          >
            {tag.label}
          </span>
        </div>
        <span className="ds-muted" style={{ fontSize: 13 }}>
          {item.blurb}
        </span>
      </div>
      <Button onClick={onStart}>Start</Button>
    </div>
  );
}

function TrailNode({
  node,
  buddy,
  last,
  onGo,
  isCurrent,
}: {
  node: NodeView;
  buddy: string;
  last: boolean;
  onGo: () => void;
  isCurrent: boolean;
}) {
  const isCheckpoint = node.type === "checkpoint";
  const done = node.status === "done";
  const locked = node.status === "locked";

  const medallion = isCheckpoint
    ? done
      ? "🏅"
      : "🚩"
    : done
      ? "✓"
      : locked
        ? "🔒"
        : MODULE_EMOJI[node.moduleId] ?? "●";

  const ring = done
    ? "var(--ember)"
    : isCurrent
      ? "var(--gold, var(--ember))"
      : locked
        ? "var(--line)"
        : "var(--ember)";
  const fill = done
    ? "var(--ember)"
    : locked
      ? "var(--parchment-2, var(--surface-raised))"
      : "var(--surface-raised)";

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
      {/* Trail rail + medallion */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 46 }}>
        <div
          aria-hidden
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: done ? 20 : 19,
            color: done ? "var(--on-ember, #fff)" : "var(--ink)",
            background: fill,
            border: `${isCurrent ? 3 : 2}px solid ${ring}`,
            boxShadow: isCurrent ? "0 0 0 4px color-mix(in srgb, var(--gold, var(--ember)) 30%, transparent)" : "none",
            opacity: locked ? 0.55 : 1,
            flex: "0 0 auto",
          }}
        >
          {medallion}
        </div>
        {!last && (
          <div
            aria-hidden
            style={{
              width: 4,
              flex: 1,
              minHeight: 22,
              margin: "4px 0",
              borderRadius: 4,
              background: done ? "var(--ember)" : "var(--line)",
            }}
          />
        )}
      </div>

      {/* Card */}
      <div style={{ flex: 1, paddingBottom: 14, minWidth: 0 }}>
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 16,
            background: isCurrent ? "var(--surface-raised)" : "transparent",
            border: isCurrent ? "2px solid var(--gold, var(--ember))" : "1px solid var(--line)",
            opacity: locked ? 0.7 : 1,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
            <strong style={{ fontSize: isCheckpoint ? "1.02rem" : "1rem" }}>
              {isCurrent && !isCheckpoint ? `${buddy} ` : ""}
              {node.title}
            </strong>
            {isCurrent && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--gold, var(--ember))",
                }}
              >
                You're here
              </span>
            )}
          </div>

          <p className="ds-muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
            {done && !isCheckpoint ? `✅ You can now ${node.canNow}.` : node.blurb}
          </p>

          {node.crossLink && node.crossLinkActive && !done && (
            <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--ember)" }}>🔗 {node.crossLink.text}</p>
          )}

          {isCurrent && !isCheckpoint && (
            <div style={{ marginTop: 10 }}>
              <Button big onClick={onGo}>
                Continue →
              </Button>
            </div>
          )}
          {node.status === "available" && !isCurrent && !isCheckpoint && (
            <div style={{ marginTop: 8 }}>
              <Button variant="ghost" onClick={onGo}>
                Practise this
              </Button>
            </div>
          )}
          {locked && (
            <p className="ds-muted" style={{ margin: "6px 0 0", fontSize: 12 }}>
              🔒 Finish the step above to unlock this.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
