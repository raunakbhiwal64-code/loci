import { describe, it, expect } from "vitest";
import type { SkillId } from "@loci/module-sdk";
import {
  isComplete,
  isUnlocked,
  nextNode,
  journeyProgress,
  sectionViews,
  sessionPlan,
  upcomingPathNodes,
  type JourneySnapshot,
} from "./engine.js";
import { nodeById, NODES } from "./graph.js";

/** Build a snapshot from an explicit skill→level map (missing = 0). */
function snap(levels: Partial<Record<SkillId, number>>, dueCount = 0): JourneySnapshot {
  return { levelOf: (s) => levels[s] ?? 0, dueCount };
}

describe("journey engine — gating", () => {
  it("starts at the first Getting-Started lesson", () => {
    const s = snap({});
    const n = nextNode(s);
    expect(n?.id).toBe("s1-mem-learn");
  });

  it("a fresh profile has all prerequisite-free nodes unlocked and everything else locked", () => {
    const s = snap({});
    expect(isUnlocked(nodeById("s1-mem-learn")!, s)).toBe(true);
    expect(isUnlocked(nodeById("s1-che-learn")!, s)).toBe(true);
    expect(isUnlocked(nodeById("s1-mat-learn")!, s)).toBe(true);
    // depends on the first checkpoint, which needs all three L1s
    expect(isUnlocked(nodeById("s2-logic-learn")!, s)).toBe(false);
  });

  it("does not unlock the palace until working-memory is learned (prereq edge)", () => {
    expect(isUnlocked(nodeById("s2-palace-learn")!, snap({}))).toBe(false);
    expect(isUnlocked(nodeById("s2-palace-learn")!, snap({ "working-memory": 1 }))).toBe(true);
  });

  it("a checkpoint certifies only when all its gated nodes are complete", () => {
    const cp = nodeById("s1-checkpoint")!;
    expect(isComplete(cp, snap({ "working-memory": 1, "pattern-recognition": 1 }))).toBe(false);
    expect(
      isComplete(cp, snap({ "working-memory": 1, "pattern-recognition": 1, "calculation-number-sense": 1 }))
    ).toBe(true);
  });

  it("completing Section 1 unlocks Section 2's cross-checkpoint nodes", () => {
    const s = snap({ "working-memory": 1, "pattern-recognition": 1, "calculation-number-sense": 1 });
    expect(isUnlocked(nodeById("s2-logic-learn")!, s)).toBe(true);
    // and the next step moves on from the completed Section-1 lessons
    expect(nextNode(s)?.id).not.toBe("s1-mem-learn");
  });

  it("practice bands need a higher level than learn bands", () => {
    const learned = snap({ "calculation-number-sense": 1 });
    const practised = snap({ "calculation-number-sense": 3 });
    expect(isComplete(nodeById("s2-math-practise")!, learned)).toBe(false);
    expect(isComplete(nodeById("s2-math-practise")!, practised)).toBe(true);
  });
});

describe("journey engine — progress & views", () => {
  it("journeyProgress counts only real work nodes, not checkpoints", () => {
    const workNodes = NODES.filter((n) => n.type !== "checkpoint").length;
    expect(journeyProgress(snap({})).total).toBe(workNodes);
    expect(journeyProgress(snap({})).done).toBe(0);
  });

  it("sectionViews tags exactly one node as current", () => {
    const views = sectionViews(snap({}));
    const currents = views.flatMap((v) => v.nodes).filter((n) => n.status === "current");
    expect(currents).toHaveLength(1);
    expect(currents[0].id).toBe("s1-mem-learn");
  });

  it("marks a cross-link active once the linked skill is strong", () => {
    const views = sectionViews(snap({ "pattern-recognition": 1, "long-term-memory-technique": 3 }));
    const plan = views.flatMap((v) => v.nodes).find((n) => n.id === "s2-plan-learn")!;
    expect(plan.crossLinkActive).toBe(true);
  });
});

describe("journey engine — session recipe", () => {
  it("includes a recap first only when something is due", () => {
    expect(sessionPlan(snap({})).some((p) => p.kind === "recap")).toBe(false);
    const withDue = sessionPlan(snap({}, 3));
    expect(withDue[0].kind).toBe("recap");
  });

  it("offers one or two path steps", () => {
    const path = sessionPlan(snap({})).filter((p) => p.kind === "path");
    expect(path.length).toBeGreaterThanOrEqual(1);
    expect(path.length).toBeLessThanOrEqual(2);
  });

  it("adds a quick-win drawn from a mastered node, never one of today's steps", () => {
    // Finish section 1 so there is a completed node to replay.
    const s = snap({ "working-memory": 1, "pattern-recognition": 1, "calculation-number-sense": 1 });
    const plan = sessionPlan(s);
    const win = plan.find((p) => p.kind === "quickwin");
    expect(win).toBeDefined();
    const stepNodeIds = new Set(plan.filter((p) => p.kind === "path").map((p) => p.node?.id));
    expect(stepNodeIds.has(win!.node!.id)).toBe(false);
  });

  it("upcomingPathNodes respects the requested count", () => {
    expect(upcomingPathNodes(snap({}), 2).length).toBeLessThanOrEqual(2);
  });
});
