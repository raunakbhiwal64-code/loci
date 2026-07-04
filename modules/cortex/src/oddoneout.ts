import { mulberry32, shuffle } from "./random.js";
import type { Hint } from "./hints.js";

/**
 * Odd-one-out WITH REASON — the child picks which is odd AND why.
 * All 30 items are authored so that exactly one (odd, reason) pair is
 * correct by construction: the two distractor reasons are factually false
 * claims about the set, never alternative true properties of the odd item.
 */

export type OddCategory = "animals" | "shapes" | "numbers" | "words";

export interface OddOneOutItem {
  id: string;
  category: OddCategory;
  choices: string[]; // 4
  oddIndex: number;
  reasons: string[]; // 3 — exactly one is true of the odd item
  correctReason: number;
  /** Level-2 hint. Authored to never mention the odd choice. */
  clue: string;
  /** Post-solve reasoning line (deterministic explanation). */
  explanation: string;
  level: 1 | 2 | 3;
}

export const ODD_ONE_OUT_ITEMS: OddOneOutItem[] = [
  /* ---------------- animals ---------------- */
  {
    id: "an1",
    category: "animals",
    choices: ["dolphin", "shark", "goldfish", "eagle"],
    oddIndex: 3,
    reasons: [
      "It's the only one that lives in the sky, not the water",
      "It's the only one with fins",
      "It's the only grey one",
    ],
    correctReason: 0,
    clue: "Think about where each animal spends its day — splashing or soaring?",
    explanation: "Dolphin, shark and goldfish all live in water. An eagle soars through the sky instead.",
    level: 1,
  },
  {
    id: "an2",
    category: "animals",
    choices: ["cat", "dog", "rabbit", "crocodile"],
    oddIndex: 3,
    reasons: [
      "It's the only one with scales instead of fur",
      "It's the only one that can swim",
      "It's the only one with four legs",
    ],
    correctReason: 0,
    clue: "Imagine stroking each one — soft and fluffy, or bumpy?",
    explanation: "Cats, dogs and rabbits are furry mammals. A crocodile is a reptile covered in scales.",
    level: 1,
  },
  {
    id: "an3",
    category: "animals",
    choices: ["bee", "butterfly", "sparrow", "ant"],
    oddIndex: 2,
    reasons: [
      "It's the only bird — the rest are insects",
      "It's the only one that can fly",
      "It's the only yellow one",
    ],
    correctReason: 0,
    clue: "Count the legs on each one — six, or two?",
    explanation: "Bees, butterflies and ants are insects with six legs. A sparrow is a bird with two.",
    level: 2,
  },
  {
    id: "an4",
    category: "animals",
    choices: ["cow", "horse", "sheep", "lion"],
    oddIndex: 3,
    reasons: [
      "It's the only wild hunter — the rest live on farms",
      "It's the only one with a tail",
      "It's the only one that eats grass",
    ],
    correctReason: 0,
    clue: "Which of these might you meet on a farm?",
    explanation: "Cows, horses and sheep are gentle farm animals. A lion is a wild hunter of the savannah.",
    level: 1,
  },
  {
    id: "an5",
    category: "animals",
    choices: ["penguin", "ostrich", "kiwi", "parrot"],
    oddIndex: 3,
    reasons: [
      "It's the only one that can fly",
      "It's the only bird here",
      "It's the only one that lives somewhere cold",
    ],
    correctReason: 0,
    clue: "All four are birds — but there's something only one of them can do.",
    explanation: "Penguins, ostriches and kiwis are birds that cannot fly. A parrot flies happily.",
    level: 2,
  },
  {
    id: "an6",
    category: "animals",
    choices: ["frog", "duck", "fish", "camel"],
    oddIndex: 3,
    reasons: [
      "It's the only one that loves dry desert, not water",
      "It's the only one with feathers",
      "It's the only green one",
    ],
    correctReason: 0,
    clue: "Picture each one's favourite place to be.",
    explanation: "Frogs, ducks and fish all love water. A camel is built for the dry, sandy desert.",
    level: 1,
  },
  {
    id: "an7",
    category: "animals",
    choices: ["snake", "lizard", "turtle", "whale"],
    oddIndex: 3,
    reasons: [
      "It's the only mammal — the rest are reptiles",
      "It's the only one that can swim",
      "It's the only one without legs",
    ],
    correctReason: 0,
    clue: "Which of these are cold-blooded reptiles?",
    explanation: "Snakes, lizards and turtles are reptiles. A whale is a warm-blooded mammal, like us.",
    level: 3,
  },
  {
    id: "an8",
    category: "animals",
    choices: ["spider", "ant", "fly", "beetle"],
    oddIndex: 0,
    reasons: [
      "It's the only one with eight legs — the rest have six",
      "It's the only one that can't fly",
      "It's the only tiny one",
    ],
    correctReason: 0,
    clue: "Count the legs very carefully — one of these has extra.",
    explanation: "Ants, flies and beetles are insects with six legs. A spider has eight — it's an arachnid.",
    level: 3,
  },

  /* ---------------- shapes ---------------- */
  {
    id: "sh1",
    category: "shapes",
    choices: ["square", "triangle", "circle", "rectangle"],
    oddIndex: 2,
    reasons: [
      "It's the only one with no corners at all",
      "It's the only one with four sides",
      "It's the only big one",
    ],
    correctReason: 0,
    clue: "Run your finger around each edge in your head — do you bump into corners?",
    explanation: "Squares, triangles and rectangles all have corners. A circle is perfectly smooth all the way round.",
    level: 1,
  },
  {
    id: "sh2",
    category: "shapes",
    choices: ["square", "rectangle", "rhombus", "triangle"],
    oddIndex: 3,
    reasons: [
      "It's the only one with three sides — the rest have four",
      "It's the only one with equal sides",
      "It's the only one with no corners",
    ],
    correctReason: 0,
    clue: "Count the sides of each shape.",
    explanation: "Squares, rectangles and rhombuses have four sides each. A triangle has only three.",
    level: 1,
  },
  {
    id: "sh3",
    category: "shapes",
    choices: ["cube", "sphere", "pyramid", "square"],
    oddIndex: 3,
    reasons: [
      "It's the only flat, 2-D shape — the rest are solid",
      "It's the only one with corners",
      "It's the only one that can roll",
    ],
    correctReason: 0,
    clue: "Which of these could you actually hold in your hand?",
    explanation: "A cube, a sphere and a pyramid are solid 3-D shapes. A square is flat — it only lives on paper.",
    level: 2,
  },
  {
    id: "sh4",
    category: "shapes",
    choices: ["pentagon", "hexagon", "octagon", "circle"],
    oddIndex: 3,
    reasons: [
      "It's the only one with no straight sides",
      "It's the only one with five sides",
      "It's the only pointy one",
    ],
    correctReason: 0,
    clue: "Look for straight edges on each shape.",
    explanation: "Pentagons, hexagons and octagons are made of straight sides. A circle has none — just one smooth curve.",
    level: 2,
  },
  {
    id: "sh5",
    category: "shapes",
    choices: ["letter A", "letter M", "letter T", "letter F"],
    oddIndex: 3,
    reasons: [
      "It's the only letter with no mirror line — the rest are symmetrical",
      "It's the only letter made of curves",
      "It's the only letter with one stroke",
    ],
    correctReason: 0,
    clue: "Imagine folding each letter down the middle — do the halves match?",
    explanation: "A, M and T each fold neatly onto themselves down the middle. F has no line of symmetry at all.",
    level: 3,
  },
  {
    id: "sh6",
    category: "shapes",
    choices: ["cube", "box", "dice", "ball"],
    oddIndex: 3,
    reasons: [
      "It's the only one that rolls in every direction",
      "It's the only one with six faces",
      "It's the only heavy one",
    ],
    correctReason: 0,
    clue: "Which of these could you stack into a neat tower?",
    explanation: "Cubes, boxes and dice have flat faces and stack neatly. A ball has no flat faces — it rolls everywhere.",
    level: 1,
  },

  /* ---------------- numbers ---------------- */
  {
    id: "nu1",
    category: "numbers",
    choices: ["2", "4", "6", "7"],
    oddIndex: 3,
    reasons: [
      "It's the only odd number — the rest are even",
      "It's the only one you can cut into two equal halves",
      "It's the only one smaller than ten",
    ],
    correctReason: 0,
    clue: "Try splitting each number into two equal halves.",
    explanation: "2, 4 and 6 split into two equal halves — they're even. 7 always leaves one left over: it's odd.",
    level: 1,
  },
  {
    id: "nu2",
    category: "numbers",
    choices: ["3", "5", "7", "9"],
    oddIndex: 3,
    reasons: [
      "It's the only one that isn't prime — 3 × 3 makes it",
      "It's the only odd number here",
      "It's the only one bigger than ten",
    ],
    correctReason: 0,
    clue: "Which of these can be made by multiplying two smaller numbers?",
    explanation: "3, 5 and 7 are prime — nothing multiplies to make them. 9 is 3 × 3, so it isn't prime.",
    level: 3,
  },
  {
    id: "nu3",
    category: "numbers",
    choices: ["10", "20", "30", "35"],
    oddIndex: 3,
    reasons: [
      "It's the only one that doesn't end in zero",
      "It's the only one smaller than twenty",
      "It's the only one with two digits",
    ],
    correctReason: 0,
    clue: "Look at the very last digit of each number.",
    explanation: "10, 20 and 30 are round tens ending in zero. 35 breaks the pattern with a five at the end.",
    level: 1,
  },
  {
    id: "nu4",
    category: "numbers",
    choices: ["4", "9", "16", "20"],
    oddIndex: 3,
    reasons: [
      "It's the only one that isn't a square number",
      "It's the only odd number",
      "It's the only one with one digit",
    ],
    correctReason: 0,
    clue: "Which numbers can you build as a perfect square of dots?",
    explanation: "4 is 2×2, 9 is 3×3 and 16 is 4×4 — square numbers. 20 can't be made by a number times itself.",
    level: 3,
  },
  {
    id: "nu5",
    category: "numbers",
    choices: ["2", "3", "5", "8"],
    oddIndex: 3,
    reasons: [
      "It's the only one that isn't prime",
      "It's the only even number here",
      "It's the only one bigger than four",
    ],
    correctReason: 0,
    clue: "Prime numbers can only be shared by 1 and themselves.",
    explanation: "2, 3 and 5 are prime. 8 is 2 × 4, so it has extra ways to split — not prime.",
    level: 3,
  },
  {
    id: "nu6",
    category: "numbers",
    choices: ["11", "22", "33", "45"],
    oddIndex: 3,
    reasons: [
      "It's the only one whose two digits are different",
      "It's the only even number",
      "It's the only one smaller than twenty",
    ],
    correctReason: 0,
    clue: "Look at both digits of each number — spot the twins.",
    explanation: "11, 22 and 33 are made of twin digits. In 45 the two digits are different.",
    level: 2,
  },
  {
    id: "nu7",
    category: "numbers",
    choices: ["100", "200", "300", "150"],
    oddIndex: 3,
    reasons: [
      "It's the only one that isn't a whole hundred",
      "It's the only one with three digits",
      "It's the only one without a zero",
    ],
    correctReason: 0,
    clue: "Count up in hundreds — which number falls off the path?",
    explanation: "100, 200 and 300 are whole hundreds. 150 sits in between — it isn't a full hundred.",
    level: 1,
  },
  {
    id: "nu8",
    category: "numbers",
    choices: ["6", "12", "18", "22"],
    oddIndex: 3,
    reasons: [
      "It's the only one not in the six times table",
      "It's the only odd number",
      "It's the only single-digit number",
    ],
    correctReason: 0,
    clue: "Count by sixes and see who keeps up.",
    explanation: "6, 12 and 18 are all in the six times table. 22 isn't — six skips right over it.",
    level: 2,
  },

  /* ---------------- words ---------------- */
  {
    id: "wo1",
    category: "words",
    choices: ["run", "jump", "swim", "chair"],
    oddIndex: 3,
    reasons: [
      "It's the only thing — the rest are things you do",
      "It's the only word about water",
      "It's the only three-letter word",
    ],
    correctReason: 0,
    clue: "Which of these can you actually do with your body?",
    explanation: "Run, jump and swim are all actions. A chair is a thing — you sit on it, you can't 'chair' around the park.",
    level: 1,
  },
  {
    id: "wo2",
    category: "words",
    choices: ["apple", "banana", "carrot", "mango"],
    oddIndex: 2,
    reasons: [
      "It's the only vegetable — the rest are fruits",
      "It's the only one that grows on trees",
      "It's the only yellow one",
    ],
    correctReason: 0,
    clue: "Fruit bowl or veggie patch — where does each one belong?",
    explanation: "Apples, bananas and mangoes are fruits. A carrot is a vegetable that grows under the ground.",
    level: 1,
  },
  {
    id: "wo3",
    category: "words",
    choices: ["happy", "glad", "joyful", "angry"],
    oddIndex: 3,
    reasons: [
      "It's the only grumpy feeling — the rest mean happy",
      "It's the only one that isn't a feeling",
      "It's the only long word",
    ],
    correctReason: 0,
    clue: "Say each word and notice what your face wants to do.",
    explanation: "Happy, glad and joyful all mean feeling good. Angry is the grumpy one out.",
    level: 2,
  },
  {
    id: "wo4",
    category: "words",
    choices: ["whisper", "shout", "talk", "listen"],
    oddIndex: 3,
    reasons: [
      "It's the only one you do with your ears, not your mouth",
      "It's the only quiet one",
      "It's the only one you do at school",
    ],
    correctReason: 0,
    clue: "Which of these use your voice?",
    explanation: "Whispering, shouting and talking all use your voice. Listening is the ears' job.",
    level: 3,
  },
  {
    id: "wo5",
    category: "words",
    choices: ["Monday", "Friday", "Sunday", "October"],
    oddIndex: 3,
    reasons: [
      "It's the only month — the rest are days of the week",
      "It's the only weekend day",
      "It's the only word with six letters",
    ],
    correctReason: 0,
    clue: "Calendar check: some of these fit inside a week.",
    explanation: "Monday, Friday and Sunday are days of the week. October is a whole month.",
    level: 1,
  },
  {
    id: "wo6",
    category: "words",
    choices: ["pencil", "crayon", "marker", "scissors"],
    oddIndex: 3,
    reasons: [
      "It's the only one that cuts — the rest draw",
      "It's the only one you find at school",
      "It's the only tiny one",
    ],
    correctReason: 0,
    clue: "Which of these leave colourful marks on paper?",
    explanation: "Pencils, crayons and markers all draw. Scissors don't draw a thing — they cut.",
    level: 2,
  },
  {
    id: "wo7",
    category: "words",
    choices: ["star", "sun", "moon", "lamp"],
    oddIndex: 3,
    reasons: [
      "It's the only one made by people",
      "It's the only one that gives light",
      "It's the only one you see at night",
    ],
    correctReason: 0,
    clue: "Look up at the sky — which one won't you find there?",
    explanation: "Stars, the sun and the moon are up in the sky. A lamp is made by people and lives indoors.",
    level: 2,
  },
  {
    id: "wo8",
    category: "words",
    choices: ["big", "huge", "giant", "tiny"],
    oddIndex: 3,
    reasons: [
      "It's the only word that means small",
      "It's the only word about size",
      "It's the only five-letter word",
    ],
    correctReason: 0,
    clue: "Show each word's meaning with your hands — wide or pinched?",
    explanation: "Big, huge and giant all mean large. Tiny is the little one out.",
    level: 1,
  },
];

/* ------------------------------------------------------------------ *
 * Rounds — seeded pick + shuffle so the correct pair moves around
 * ------------------------------------------------------------------ */

export interface OddOneOutRound {
  id: string;
  category: OddCategory;
  choices: string[];
  oddIndex: number;
  reasons: string[];
  correctReason: number;
  clue: string;
  explanation: string;
}

export const ODD_MAX_LEVEL = 3;

export function oddRounds(seed: number, level: number, count = 3): OddOneOutRound[] {
  const rng = mulberry32(seed);
  const band = Math.max(1, Math.min(ODD_MAX_LEVEL, level)) as 1 | 2 | 3;
  const pool = ODD_ONE_OUT_ITEMS.filter((i) => i.level === band);
  const picked = shuffle(rng, pool).slice(0, Math.min(count, pool.length));
  return picked.map((item) => {
    const order = shuffle(rng, [0, 1, 2, 3]);
    const rOrder = shuffle(rng, [0, 1, 2]);
    return {
      id: item.id,
      category: item.category,
      choices: order.map((i) => item.choices[i]),
      oddIndex: order.indexOf(item.oddIndex),
      reasons: rOrder.map((i) => item.reasons[i]),
      correctReason: rOrder.indexOf(item.correctReason),
      clue: item.clue,
      explanation: item.explanation,
    };
  });
}

/* ------------------------------------------------------------------ *
 * Hint ladder
 * ------------------------------------------------------------------ */

export function oddHint(round: OddOneOutRound, level: number): Hint {
  const lvl = Math.max(1, Math.min(3, level));
  if (lvl === 1) {
    return {
      level: 1,
      givesAnswer: false,
      text: "Try sorting them into a club — three of these belong together. Which one won't fit?",
    };
  }
  if (lvl === 2) {
    return { level: 2, givesAnswer: false, text: round.clue };
  }
  return {
    level: 3,
    givesAnswer: true,
    text: `Look closely at "${round.choices[round.oddIndex]}" — how is it different from the other three?`,
  };
}
