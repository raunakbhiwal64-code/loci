import type { SkillId } from "@loci/module-sdk";
import { NODES, SECTIONS, type JourneyNode, type Section } from "./graph.js";

/**
 * The v1 Adaptive Journey Engine (Learning Architecture spec §5, §6, §10).
 *
 * Deterministic and on-device: it decides WHAT NEXT (the single next step),
 * WHEN TO REVIEW (recaps, from due SRS items), and composes the daily SESSION
 * recipe (§6). Mastery is read from the real progression levels — a node is
 * complete when its skill has reached the node's required band. No backend, no
 * model call (the Phase-4 population model is out of scope here, spec §10.9).
 *
 * Pure functions over a small snapshot so the whole thing is unit-testable
 * without a live spine.
 */

/** Everything the engine needs to reason about a profile's state. */
export interface JourneySnapshot {
  /** Current progression level for a skill (0 if untouched). */
  levelOf(skill: SkillId): number;
  /** How many SRS items are due right now (drives recaps, spec §4). */
  dueCount: number;
}

export type NodeStatus = "done" | "current" | "available" | "locked";

export interface NodeView extends JourneyNode {
  status: NodeStatus;
  /** True when this node's cross-link skill is already strong enough to matter. */
  crossLinkActive: boolean;
}

export interface SectionView extends Section {
  nodes: NodeView[];
  done: number;
  total: number;
}

const CROSS_LINK_MIN_LEVEL = 3; // a linked skill "helps" once it's genuinely growing

/** A node is complete when its skill has reached the required level band. */
export function isComplete(node: JourneyNode, snap: JourneySnapshot): boolean {
  if (node.type === "checkpoint") {
    // A checkpoint certifies only when everything it gates is complete.
    return node.prerequisites.every((id) => {
      const p = NODES.find((n) => n.id === id);
      return p ? isComplete(p, snap) : true;
    });
  }
  return snap.levelOf(node.skillId) >= node.requireLevel;
}

/** A node is unlocked when all its prerequisites are complete. */
export function isUnlocked(node: JourneyNode, snap: JourneySnapshot): boolean {
  return node.prerequisites.every((id) => {
    const p = NODES.find((n) => n.id === id);
    return p ? isComplete(p, snap) : true;
  });
}

/**
 * The single next step (spec §3: one next step, chosen by the engine). The
 * first authored node that is unlocked but not yet complete. Checkpoints are
 * skipped here — they certify automatically and are shown as markers, not work.
 */
export function nextNode(snap: JourneySnapshot): JourneyNode | undefined {
  return NODES.find((n) => n.type !== "checkpoint" && isUnlocked(n, snap) && !isComplete(n, snap));
}

/** Whole-journey completion, for the progress ribbon. */
export function journeyProgress(snap: JourneySnapshot): { done: number; total: number; pct: number } {
  const work = NODES.filter((n) => n.type !== "checkpoint");
  const done = work.filter((n) => isComplete(n, snap)).length;
  return { done, total: work.length, pct: work.length ? (done / work.length) * 100 : 0 };
}

/** The map view: sections, each node tagged with its status for rendering. */
export function sectionViews(snap: JourneySnapshot): SectionView[] {
  const current = nextNode(snap);
  return SECTIONS.map((s) => {
    const nodes: NodeView[] = NODES.filter((n) => n.sectionId === s.id).map((n) => {
      let status: NodeStatus;
      if (isComplete(n, snap)) status = "done";
      else if (current && n.id === current.id) status = "current";
      else if (isUnlocked(n, snap)) status = "available";
      else status = "locked";
      const crossLinkActive = !!n.crossLink && snap.levelOf(n.crossLink.fromSkill) >= CROSS_LINK_MIN_LEVEL;
      return { ...n, status, crossLinkActive };
    });
    const work = nodes.filter((n) => n.type !== "checkpoint");
    return { ...s, nodes, done: work.filter((n) => n.status === "done").length, total: work.length };
  });
}

/* ------------------------------------------------------------------ *
 * Session recipe (spec §6) — a session is a shaped mix, not one activity.
 * ------------------------------------------------------------------ */

export type PlanKind = "recap" | "path" | "quickwin";

export interface PlanItem {
  kind: PlanKind;
  title: string;
  blurb: string;
  /** Where "start" should route: a module id, or "reviews" for a recap. */
  route: { screen: "module"; moduleId: string } | { screen: "reviews" };
  node?: JourneyNode;
}

/**
 * Auto-assemble today's session (spec §6): a recap if something is due, one or
 * two path steps for progress, and a mastered "quick-win" to finish on a high.
 */
export function sessionPlan(snap: JourneySnapshot): PlanItem[] {
  const plan: PlanItem[] = [];

  // 1× recap (spaced retrieval) — retention first, inline on the path (spec §4).
  if (snap.dueCount > 0) {
    plan.push({
      kind: "recap",
      title: "Quick recap",
      blurb: `${snap.dueCount} thing${snap.dueCount === 1 ? "" : "s"} to bring back — a fast memory check before something new.`,
      route: { screen: "reviews" },
    });
  }

  // 1–2× path steps (progress).
  const steps = upcomingPathNodes(snap, 2);
  for (const node of steps) {
    plan.push({
      kind: "path",
      title: node.title,
      blurb: node.blurb,
      route: { screen: "module", moduleId: node.moduleId },
      node,
    });
  }

  // 1× quick-win (a mastered skill) — confidence and a strong finish (spec §6).
  const win = quickWin(snap, steps);
  if (win) {
    plan.push({
      kind: "quickwin",
      title: `Quick win: ${win.unit.split("·").pop()?.trim() ?? win.title}`,
      blurb: "Revisit something you're already good at — a confident finish.",
      route: { screen: "module", moduleId: win.moduleId },
      node: win,
    });
  }

  return plan;
}

/** The next N unlocked, incomplete path nodes (excludes checkpoints). */
export function upcomingPathNodes(snap: JourneySnapshot, n: number): JourneyNode[] {
  const out: JourneyNode[] = [];
  for (const node of NODES) {
    if (node.type === "checkpoint") continue;
    if (isComplete(node, snap)) continue;
    if (!isUnlocked(node, snap)) continue;
    out.push(node);
    if (out.length >= n) break;
  }
  return out;
}

/** A completed, playable node to replay for confidence, avoiding today's steps. */
function quickWin(snap: JourneySnapshot, exclude: JourneyNode[]): JourneyNode | undefined {
  const excludeIds = new Set(exclude.map((n) => n.id));
  const done = NODES.filter(
    (n) => n.type !== "checkpoint" && n.moduleId && isComplete(n, snap) && !excludeIds.has(n.id)
  );
  // Prefer the most recently reachable win (last in authored order).
  return done.length ? done[done.length - 1] : undefined;
}
