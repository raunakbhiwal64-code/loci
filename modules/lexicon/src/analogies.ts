/**
 * Analogy Builder content (PRD 4.6) — hot : cold :: big : ___
 *
 * Authored across five relation types. After the child answers, the UI names
 * the relation ("these are OPPOSITES") — naming the relation is the pedagogy.
 */

export type RelationType = "opposites" | "part-whole" | "category" | "function" | "intensity";

export interface Analogy {
  a: string;
  b: string;
  c: string;
  answer: string;
  /** Four choices; the answer appears exactly once (UI shuffles). */
  options: [string, string, string, string];
  relation: RelationType;
  /** Shown after answering — names and explains the relation. */
  explain: string;
}

export const RELATION_LABEL: Record<RelationType, string> = {
  opposites: "OPPOSITES",
  "part-whole": "PART & WHOLE",
  category: "SAME CATEGORY",
  function: "WHAT IT'S FOR",
  intensity: "WEAKER & STRONGER",
};

function A(
  relation: RelationType,
  a: string,
  b: string,
  c: string,
  answer: string,
  distractors: [string, string, string],
  explain: string
): Analogy {
  return { a, b, c, answer, options: [answer, ...distractors], relation, explain };
}

export const ANALOGIES: Analogy[] = [
  /* ---------------- opposites ---------------- */
  A(
    "opposites",
    "hot", "cold", "big", "small",
    ["huge", "wide", "heavy"],
    "Hot is the opposite of cold — and big is the opposite of small."
  ),
  A(
    "opposites",
    "up", "down", "fast", "slow",
    ["quick", "far", "high"],
    "Up is the opposite of down — and fast is the opposite of slow."
  ),
  A(
    "opposites",
    "day", "night", "happy", "sad",
    ["glad", "sleepy", "funny"],
    "Day is the opposite of night — and happy is the opposite of sad."
  ),
  A(
    "opposites",
    "open", "closed", "full", "empty",
    ["heavy", "round", "packed"],
    "Open is the opposite of closed — and full is the opposite of empty."
  ),
  A(
    "opposites",
    "loud", "quiet", "heavy", "light",
    ["soft", "strong", "large"],
    "Loud is the opposite of quiet — and heavy is the opposite of light."
  ),
  A(
    "opposites",
    "begin", "end", "win", "lose",
    ["play", "race", "score"],
    "Begin is the opposite of end — and win is the opposite of lose."
  ),

  /* ---------------- part-whole ---------------- */
  A(
    "part-whole",
    "finger", "hand", "toe", "foot",
    ["shoe", "leg", "ankle"],
    "A finger is part of a hand — and a toe is part of a foot."
  ),
  A(
    "part-whole",
    "wheel", "car", "wing", "airplane",
    ["sky", "pilot", "feather"],
    "A wheel is part of a car — and a wing is part of an airplane."
  ),
  A(
    "part-whole",
    "page", "book", "branch", "tree",
    ["leaf", "forest", "paper"],
    "A page is part of a book — and a branch is part of a tree."
  ),
  A(
    "part-whole",
    "petal", "flower", "feather", "bird",
    ["nest", "egg", "sky"],
    "A petal is part of a flower — and a feather is part of a bird."
  ),
  A(
    "part-whole",
    "brick", "wall", "link", "chain",
    ["metal", "lock", "fence"],
    "A brick is one piece of a wall — and a link is one piece of a chain."
  ),
  A(
    "part-whole",
    "piece", "puzzle", "slice", "pizza",
    ["knife", "plate", "cheese"],
    "A piece is part of a puzzle — and a slice is part of a pizza."
  ),

  /* ---------------- category ---------------- */
  A(
    "category",
    "apple", "fruit", "carrot", "vegetable",
    ["salad", "orange", "garden"],
    "An apple is a kind of fruit — and a carrot is a kind of vegetable."
  ),
  A(
    "category",
    "dog", "animal", "rose", "flower",
    ["thorn", "smell", "tree"],
    "A dog is a kind of animal — and a rose is a kind of flower."
  ),
  A(
    "category",
    "hammer", "tool", "flute", "instrument",
    ["music", "wood", "song"],
    "A hammer is a kind of tool — and a flute is a kind of instrument."
  ),
  A(
    "category",
    "soccer", "sport", "chess", "game",
    ["board", "king", "winner"],
    "Soccer is a kind of sport — and chess is a kind of game."
  ),
  A(
    "category",
    "oak", "tree", "salmon", "fish",
    ["river", "swimmer", "boat"],
    "An oak is a kind of tree — and a salmon is a kind of fish."
  ),
  A(
    "category",
    "Monday", "day", "July", "month",
    ["summer", "year", "calendar"],
    "Monday is one of the days — and July is one of the months."
  ),

  /* ---------------- function ---------------- */
  A(
    "function",
    "pencil", "write", "scissors", "cut",
    ["draw", "fold", "sharpen"],
    "A pencil is for writing — and scissors are for cutting."
  ),
  A(
    "function",
    "eye", "see", "ear", "hear",
    ["smell", "talk", "sing"],
    "Your eyes are for seeing — and your ears are for hearing."
  ),
  A(
    "function",
    "bird", "fly", "fish", "swim",
    ["walk", "float", "splash"],
    "A bird moves by flying — and a fish moves by swimming."
  ),
  A(
    "function",
    "key", "unlock", "broom", "sweep",
    ["dust", "fly", "brush"],
    "A key is used to unlock — and a broom is used to sweep."
  ),
  A(
    "function",
    "glove", "hand", "hat", "head",
    ["hair", "scarf", "coat"],
    "A glove goes on your hand — and a hat goes on your head."
  ),
  A(
    "function",
    "teacher", "teach", "doctor", "heal",
    ["hospital", "visit", "study"],
    "A teacher's job is to teach — and a doctor's job is to heal."
  ),

  /* ---------------- intensity ---------------- */
  A(
    "intensity",
    "warm", "hot", "cool", "cold",
    ["wet", "dark", "dry"],
    "Hot is a stronger kind of warm — and cold is a stronger kind of cool."
  ),
  A(
    "intensity",
    "big", "gigantic", "small", "tiny",
    ["short", "thin", "low"],
    "Gigantic means VERY big — and tiny means VERY small."
  ),
  A(
    "intensity",
    "talk", "shout", "walk", "run",
    ["stroll", "sit", "stand"],
    "Shouting is talking turned up — and running is walking turned up."
  ),
  A(
    "intensity",
    "happy", "thrilled", "tired", "exhausted",
    ["awake", "hungry", "grumpy"],
    "Thrilled means VERY happy — and exhausted means VERY tired."
  ),
  A(
    "intensity",
    "hill", "mountain", "pond", "ocean",
    ["river", "bridge", "boat"],
    "A mountain is a hill grown huge — and an ocean is a pond grown huge."
  ),
  A(
    "intensity",
    "like", "love", "dislike", "hate",
    ["enjoy", "ignore", "forget"],
    "Love is liking something a LOT — and hate is disliking something a LOT."
  ),
];
