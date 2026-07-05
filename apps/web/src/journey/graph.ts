import type { SkillId } from "@loci/module-sdk";

/**
 * The structured learning journey (Learning Architecture spec §2–§3).
 *
 * One journey, composed of interleaved Units drawn from every module. The child
 * always sees a single linear path; underneath is a prerequisite graph and the
 * engine (engine.ts) chooses the one next step. Units from different modules are
 * deliberately INTERLEAVED within a Section (spec §1: interleaving beats
 * blocking) and skills return at increasing depth (spec §1: spiral curriculum).
 *
 * Mastery is read from the real progression engine: a node completes when its
 * skill reaches the required level band. This keeps the journey honest — it
 * reflects skill actually demonstrated in the modules, never clicks.
 */

/** Mastery bands, expressed as progression levels (see core-progression curve). */
export const BAND = {
  /** Learned the idea at least once. */
  LEARN: 1,
  /** Practised toward fluency. */
  PRACTISE: 3,
  /** Mastered — the checkpoint gate (spec §7: ≥ mastery + survives review). */
  MASTER: 5,
} as const;

export type NodeType = "lesson" | "practice" | "checkpoint" | "boss";

export interface JourneyNode {
  id: string;
  sectionId: string;
  /** A themed cluster label (spec §2: Unit = one module's skill at a depth). */
  unit: string;
  type: NodeType;
  /** Module this step is played in ("" for checkpoints, which are markers). */
  moduleId: string;
  /** The taxonomy skill this step grows (drives completion). */
  skillId: SkillId;
  /** Progression level that marks this node complete. */
  requireLevel: number;
  /** Node ids that must be complete before this one unlocks. */
  prerequisites: string[];
  /** Child-facing title of the step. */
  title: string;
  /** One-line "what you'll do". */
  blurb: string;
  /** Certified competency ("you can now…") emitted when complete (spec §7). */
  canNow: string;
  /**
   * A cross-module connection to surface when the linked skill is already
   * strong (spec §9: "your memory skills are helping your chess").
   */
  crossLink?: { fromSkill: SkillId; text: string };
}

export interface Section {
  id: string;
  title: string;
  blurb: string;
}

export const SECTIONS: Section[] = [
  { id: "start", title: "Getting Started", blurb: "First footholds across a few thinking skills." },
  { id: "build", title: "Building Skills", blurb: "New powers, first practice, and skills starting to help each other." },
  { id: "deeper", title: "Going Deeper", blurb: "Skills return harder, and new worlds open up." },
];

/**
 * The authored path. Order = the interleaved presentation order; the engine
 * still gates each node on its prerequisites, so the true structure is the
 * graph, not this list. Kept deliberately compact for v1 — it spirals rather
 * than trying to enumerate every lesson.
 */
export const NODES: JourneyNode[] = [
  /* ── Section 1 · Getting Started ─────────────────────────────────── */
  {
    id: "s1-mem-learn",
    sectionId: "start",
    unit: "Memory · First tricks",
    type: "lesson",
    moduleId: "memora",
    skillId: "working-memory",
    requireLevel: BAND.LEARN,
    prerequisites: [],
    title: "Remember more",
    blurb: "Meet your first memory trick and hold more in your head.",
    canNow: "hold a short list in your head",
  },
  {
    id: "s1-che-learn",
    sectionId: "start",
    unit: "Chess · Safe pieces",
    type: "lesson",
    moduleId: "gambit",
    skillId: "pattern-recognition",
    requireLevel: BAND.LEARN,
    prerequisites: [],
    title: "Keep your pieces safe",
    blurb: "Spot which pieces are in danger — the first chess superpower.",
    canNow: "tell when a piece is safe or in danger",
  },
  {
    id: "s1-mat-learn",
    sectionId: "start",
    unit: "Maths · Number friends",
    type: "lesson",
    moduleId: "abacus",
    skillId: "calculation-number-sense",
    requireLevel: BAND.LEARN,
    prerequisites: [],
    title: "Make ten",
    blurb: "Find the number friends that add up to ten.",
    canNow: "spot pairs that make ten",
  },
  {
    id: "s1-checkpoint",
    sectionId: "start",
    unit: "Checkpoint",
    type: "checkpoint",
    moduleId: "",
    skillId: "metacognition",
    requireLevel: BAND.LEARN,
    prerequisites: ["s1-mem-learn", "s1-che-learn", "s1-mat-learn"],
    title: "First badges earned!",
    blurb: "You've taken your first steps in memory, chess and maths.",
    canNow: "start growing three different thinking skills",
  },

  /* ── Section 2 · Building Skills ─────────────────────────────────── */
  {
    id: "s2-palace-learn",
    sectionId: "build",
    unit: "Memory · Memory palace",
    type: "lesson",
    moduleId: "memora",
    skillId: "long-term-memory-technique",
    requireLevel: BAND.LEARN,
    prerequisites: ["s1-mem-learn"],
    title: "Build a memory palace",
    blurb: "Store a whole list by walking through a place you know.",
    canNow: "memorise a list with a memory palace",
  },
  {
    id: "s2-logic-learn",
    sectionId: "build",
    unit: "Logic · Guess the rule",
    type: "lesson",
    moduleId: "cortex",
    skillId: "inductive-reasoning",
    requireLevel: BAND.LEARN,
    prerequisites: ["s1-checkpoint"],
    title: "Guess the rule",
    blurb: "Look at a pattern and work out the hidden rule.",
    canNow: "work out the rule behind a pattern",
  },
  {
    id: "s2-plan-learn",
    sectionId: "build",
    unit: "Chess · Thinking ahead",
    type: "lesson",
    moduleId: "gambit",
    skillId: "planning-foresight",
    requireLevel: BAND.LEARN,
    prerequisites: ["s1-che-learn"],
    title: "Think a move ahead",
    blurb: "Plan a little trap by looking one move into the future.",
    canNow: "plan one move ahead",
    crossLink: {
      fromSkill: "long-term-memory-technique",
      text: "Your memory tricks help here — remembering patterns makes planning easier.",
    },
  },
  {
    id: "s2-math-practise",
    sectionId: "build",
    unit: "Maths · Fast tens",
    type: "practice",
    moduleId: "abacus",
    skillId: "calculation-number-sense",
    requireLevel: BAND.PRACTISE,
    prerequisites: ["s1-mat-learn"],
    title: "Speed up your tens",
    blurb: "Practise number friends until they're quick and easy.",
    canNow: "make ten quickly, without counting",
  },
  {
    id: "s2-checkpoint",
    sectionId: "build",
    unit: "Checkpoint",
    type: "checkpoint",
    moduleId: "",
    skillId: "metacognition",
    requireLevel: BAND.LEARN,
    prerequisites: ["s2-palace-learn", "s2-logic-learn", "s2-plan-learn", "s2-math-practise"],
    title: "Skills are teaming up!",
    blurb: "Memory, logic, chess and maths are all growing together.",
    canNow: "use several thinking skills together",
  },

  /* ── Section 3 · Going Deeper ────────────────────────────────────── */
  {
    id: "s3-spatial-learn",
    sectionId: "deeper",
    unit: "Shapes · Picture it",
    type: "lesson",
    moduleId: "tangra",
    skillId: "spatial-visualisation",
    requireLevel: BAND.LEARN,
    prerequisites: ["s2-checkpoint"],
    title: "Picture shapes in your mind",
    blurb: "Turn and flip shapes using just your imagination.",
    canNow: "rotate a shape in your mind",
  },
  {
    id: "s3-words-learn",
    sectionId: "deeper",
    unit: "Words · Word collector",
    type: "lesson",
    moduleId: "lexicon",
    skillId: "vocabulary",
    requireLevel: BAND.LEARN,
    prerequisites: ["s2-checkpoint"],
    title: "Collect brilliant words",
    blurb: "Meet new words in little stories and add them to your collection.",
    canNow: "learn and use new words",
  },
  {
    id: "s3-read-learn",
    sectionId: "deeper",
    unit: "Reading · Read closely",
    type: "lesson",
    moduleId: "focusread",
    skillId: "reading-comprehension",
    requireLevel: BAND.LEARN,
    prerequisites: ["s2-checkpoint"],
    title: "Read like a detective",
    blurb: "Read a short story and find the details that matter.",
    canNow: "find key details in what you read",
  },
  {
    id: "s3-palace-practise",
    sectionId: "deeper",
    unit: "Memory · Bigger palace",
    type: "practice",
    moduleId: "memora",
    skillId: "long-term-memory-technique",
    requireLevel: BAND.PRACTISE,
    prerequisites: ["s2-palace-learn"],
    title: "A bigger memory palace",
    blurb: "The same trick, now for longer lists — practice makes it stick.",
    canNow: "memorise a longer list with a palace",
  },
  {
    id: "s3-deduce-learn",
    sectionId: "deeper",
    unit: "Logic · Figure it out",
    type: "lesson",
    moduleId: "cortex",
    skillId: "deductive-reasoning",
    requireLevel: BAND.LEARN,
    prerequisites: ["s2-logic-learn"],
    title: "Crack the case",
    blurb: "Use clues to rule things out and figure out the answer.",
    canNow: "use clues to reason step by step",
    crossLink: {
      fromSkill: "inductive-reasoning",
      text: "Guessing rules trained your brain for this — now you prove them.",
    },
  },
  {
    id: "s3-plan-boss",
    sectionId: "deeper",
    unit: "Chess · Real plans",
    type: "boss",
    moduleId: "gambit",
    skillId: "planning-foresight",
    requireLevel: BAND.PRACTISE,
    prerequisites: ["s2-plan-learn"],
    title: "Plan two moves ahead",
    blurb: "Put your thinking-ahead to the test in a tougher challenge.",
    canNow: "plan two moves ahead",
  },
  {
    id: "s3-checkpoint",
    sectionId: "deeper",
    unit: "Checkpoint",
    type: "checkpoint",
    moduleId: "",
    skillId: "metacognition",
    requireLevel: BAND.LEARN,
    prerequisites: ["s3-spatial-learn", "s3-words-learn", "s3-read-learn", "s3-palace-practise", "s3-deduce-learn", "s3-plan-boss"],
    title: "A well-rounded thinker!",
    blurb: "Seven skills, all growing. Your journey keeps spiralling upward.",
    canNow: "grow every kind of thinking skill",
  },
];

export function nodeById(id: string): JourneyNode | undefined {
  return NODES.find((n) => n.id === id);
}

export function nodesInSection(sectionId: string): JourneyNode[] {
  return NODES.filter((n) => n.sectionId === sectionId);
}
