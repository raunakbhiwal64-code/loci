import type { SkillId } from "@loci/module-sdk";

export interface SkillMeta {
  id: SkillId;
  label: string; // readable by a nine-year-old
  /** Module ids that primarily train this skill (PRD Appendix A). */
  trainedBy: string[];
}

/** The shared vocabulary the skill map and progression engine are built on. */
export const SKILLS: Record<SkillId, SkillMeta> = {
  "working-memory": { id: "working-memory", label: "Holding things in mind", trainedBy: ["memora", "focusread", "abacus"] },
  "long-term-memory-technique": { id: "long-term-memory-technique", label: "Memory tricks", trainedBy: ["memora"] },
  "calculation-number-sense": { id: "calculation-number-sense", label: "Number sense", trainedBy: ["abacus"] },
  "pattern-recognition": { id: "pattern-recognition", label: "Spotting patterns", trainedBy: ["gambit", "cortex"] },
  "deductive-reasoning": { id: "deductive-reasoning", label: "Figuring it out", trainedBy: ["cortex"] },
  "inductive-reasoning": { id: "inductive-reasoning", label: "Guessing the rule", trainedBy: ["cortex"] },
  "planning-foresight": { id: "planning-foresight", label: "Thinking ahead", trainedBy: ["gambit"] },
  "spatial-visualisation": { id: "spatial-visualisation", label: "Picturing shapes", trainedBy: ["tangra"] },
  "verbal-reasoning": { id: "verbal-reasoning", label: "Reasoning with words", trainedBy: ["lexicon"] },
  vocabulary: { id: "vocabulary", label: "Word collection", trainedBy: ["lexicon"] },
  "reading-comprehension": { id: "reading-comprehension", label: "Understanding reading", trainedBy: ["focusread"] },
  "sustained-attention": { id: "sustained-attention", label: "Staying focused", trainedBy: ["focusread", "abacus"] },
  metacognition: { id: "metacognition", label: "Learning to learn", trainedBy: ["memora", "gambit", "abacus", "cortex", "tangra", "lexicon", "focusread"] },
};

export const ALL_SKILLS: SkillMeta[] = Object.values(SKILLS);
