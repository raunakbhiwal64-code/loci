/**
 * FocusRead authored content — original levelled passages (PRD 4.7).
 *
 * Four reading levels, three passages each, fiction and curiosity non-fiction.
 * Every passage carries exactly three questions:
 *   - literal     — the answer is stated in the text (evidence phrase appears verbatim)
 *   - inferential — the answer needs two facts connected
 *   - detail      — the answer is a specific phrase to find in the text (drives
 *                   find-the-detail mode, where the child taps the sentence)
 * Fiction passages also carry four story-order events (scrambled) plus the
 * authored correct order. All of this is validated by content.test.ts.
 */

export type Level = 1 | 2 | 3 | 4;
export type PassageKind = "fiction" | "nonfiction";
export type QuestionKind = "literal" | "inferential" | "detail";

export interface PassageQuestion {
  kind: QuestionKind;
  prompt: string;
  /** Exactly three answer choices. */
  options: string[];
  /** Index into options (0..2). */
  correct: number;
  /** literal only: a phrase that appears verbatim in the passage text. */
  evidence?: string;
  /** detail only: the exact phrase to locate in the text (lives inside one sentence). */
  findPhrase?: string;
}

export interface StoryOrderData {
  /** Four short event summaries, listed here in scrambled display order. */
  events: string[];
  /** correctOrder[i] = index into `events` of the event that happens i-th. Permutation of 0..3. */
  correctOrder: number[];
}

export interface Passage {
  id: string;
  title: string;
  level: Level;
  kind: PassageKind;
  text: string;
  questions: PassageQuestion[];
  /** Fiction passages only. */
  storyOrder?: StoryOrderData;
}

/** Word-count bands per level (validated by tests). Level 1 ≈ 60 words → level 4 ≈ 160. */
export const LEVEL_BANDS: Record<Level, { min: number; max: number }> = {
  1: { min: 45, max: 80 },
  2: { min: 75, max: 115 },
  3: { min: 105, max: 150 },
  4: { min: 135, max: 190 },
};

/** Friendly shelf names for the module home. */
export const LEVEL_NAMES: Record<Level, string> = {
  1: "Acorn shelf",
  2: "Sapling shelf",
  3: "Branch shelf",
  4: "Treetop shelf",
};

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Split a passage into tappable sentences (find-the-detail mode). */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const PASSAGES: Passage[] = [
  /* ---------------------------------------------------------------- *
   * Level 1 — short, simple sentences (~60 words)
   * ---------------------------------------------------------------- */
  {
    id: "l1-milo",
    title: "Milo's Big Jump",
    level: 1,
    kind: "fiction",
    text:
      "Milo the squirrel wanted the shiny red apple on the far branch. " +
      "The branch hung over the pond, and Milo did not like water. " +
      "He took a deep breath, ran, and jumped. " +
      "His paws caught the branch, and the apple dropped right into his arms. " +
      "Milo carried it home and shared it with his little sister, Pip.",
    questions: [
      {
        kind: "literal",
        prompt: "What did Milo want?",
        options: ["A shiny red apple", "A golden acorn", "A soft green leaf"],
        correct: 0,
        evidence: "shiny red apple",
      },
      {
        kind: "inferential",
        prompt: "Why did Milo take a deep breath before jumping?",
        options: [
          "He wanted to whistle a song",
          "He felt nervous about the water below",
          "He was out of breath from eating",
        ],
        correct: 1,
      },
      {
        kind: "detail",
        prompt: "Who did Milo share the apple with?",
        options: ["His friend the crow", "His grandpa", "His little sister, Pip"],
        correct: 2,
        findPhrase: "his little sister, Pip",
      },
    ],
    storyOrder: {
      events: [
        "Milo catches the branch and the apple drops into his arms.",
        "Milo spots a shiny apple on a branch over the pond.",
        "Milo shares the apple with Pip at home.",
        "Milo takes a deep breath, runs, and jumps.",
      ],
      correctOrder: [1, 3, 0, 2],
    },
  },
  {
    id: "l1-bees",
    title: "The Waggle Dance",
    level: 1,
    kind: "nonfiction",
    text:
      "Honeybees tell each other where flowers grow, but not with words. " +
      "A bee that finds food flies home and does a waggle dance. " +
      "She wiggles her body and walks in a figure of eight. " +
      "The direction of her dance points toward the flowers. " +
      "Other bees watch closely. " +
      "Then they fly straight out of the hive and find the food.",
    questions: [
      {
        kind: "literal",
        prompt: "What does a bee do when it finds food?",
        options: [
          "She flies home and does a waggle dance",
          "She buzzes as loudly as she can",
          "She hides the food under a leaf",
        ],
        correct: 0,
        evidence: "does a waggle dance",
      },
      {
        kind: "inferential",
        prompt: "Why do the other bees watch the dance so closely?",
        options: [
          "Because the dance keeps the hive warm",
          "Because they want to learn where the flowers are",
          "Because they are waiting for their turn to sleep",
        ],
        correct: 1,
      },
      {
        kind: "detail",
        prompt: "What shape does the dancing bee walk in?",
        options: ["A small square", "A figure of eight", "A zigzag line"],
        correct: 1,
        findPhrase: "figure of eight",
      },
    ],
  },
  {
    id: "l1-duck",
    title: "The Classroom Visitor",
    level: 1,
    kind: "fiction",
    text:
      "On Monday, Class 4B found muddy little footprints across their desks. " +
      "The window was open just a crack. " +
      "Priya followed the prints to the art cupboard and slowly opened the door. " +
      "Inside sat a small brown duck, nibbling a crayon. " +
      "The class laughed, gave it some water, and let it waddle back to the pond.",
    questions: [
      {
        kind: "literal",
        prompt: "Where did the footprints lead?",
        options: ["To the library", "To the art cupboard", "To the lunch room"],
        correct: 1,
        evidence: "art cupboard",
      },
      {
        kind: "inferential",
        prompt: "How did the duck most likely get into the classroom?",
        options: [
          "Through the window that was open a crack",
          "Someone carried it in a backpack",
          "It lived in the cupboard all year",
        ],
        correct: 0,
      },
      {
        kind: "detail",
        prompt: "What was the duck nibbling?",
        options: ["A paintbrush", "A sandwich", "A crayon"],
        correct: 2,
        findPhrase: "nibbling a crayon",
      },
    ],
    storyOrder: {
      events: [
        "Priya follows the prints to the art cupboard.",
        "The class lets the duck waddle back to the pond.",
        "Class 4B finds muddy footprints on their desks.",
        "Priya opens the door and finds a duck nibbling a crayon.",
      ],
      correctOrder: [2, 0, 3, 1],
    },
  },

  /* ---------------------------------------------------------------- *
   * Level 2 — a little longer, more connected ideas (~95 words)
   * ---------------------------------------------------------------- */
  {
    id: "l2-mouse",
    title: "The Squeaky Desk Mystery",
    level: 2,
    kind: "fiction",
    text:
      "Every afternoon, just before the bell, something squeaked at the back of the classroom. " +
      "Mr. Basu checked the door hinges. " +
      "He oiled the fan. " +
      "Still, the squeak came back. " +
      "On Friday, Zara stayed very still and simply listened. " +
      "The sound was coming from inside Leo's desk! " +
      "Behind a pile of notebooks, a tiny mouse had built a nest out of torn paper. " +
      "It squeaked whenever the lunch cart rolled past the door. " +
      "The class named the mouse Professor Whiskers, moved the nest gently to the garden shed, " +
      "and left one sunflower seed outside its new home every morning.",
    questions: [
      {
        kind: "literal",
        prompt: "Where had the mouse built its nest?",
        options: ["Inside Leo's desk", "Under the teacher's chair", "Behind the classroom fan"],
        correct: 0,
        evidence: "Leo's desk",
      },
      {
        kind: "inferential",
        prompt: "Why did the mouse squeak when the lunch cart rolled past?",
        options: [
          "The cart's wheels frightened away its friends",
          "It could smell food and got excited",
          "It wanted the class to open the window",
        ],
        correct: 1,
      },
      {
        kind: "detail",
        prompt: "What did the mouse use to build its nest?",
        options: ["Cotton from a coat", "Dry leaves", "Torn paper"],
        correct: 2,
        findPhrase: "torn paper",
      },
    ],
    storyOrder: {
      events: [
        "The class moves the nest to the garden shed and leaves seeds.",
        "A squeak keeps coming from the back of the classroom.",
        "The class finds a mouse and its paper nest behind the notebooks.",
        "Zara listens carefully and traces the sound to Leo's desk.",
      ],
      correctOrder: [1, 3, 2, 0],
    },
  },
  {
    id: "l2-moon",
    title: "Why the Moon Changes Shape",
    level: 2,
    kind: "nonfiction",
    text:
      "The moon does not really change shape. " +
      "It only looks different from where we stand. " +
      "The moon makes no light of its own. " +
      "Instead, sunlight bounces off its surface, the way light bounces off a mirror. " +
      "As the moon travels around Earth, we see different amounts of its sunlit side. " +
      "When we see the whole bright side, we call it a full moon. " +
      "When the sunlit side faces away from us, the moon seems to disappear. " +
      "That is called a new moon. " +
      "The moon's journey around Earth takes about one month, so the pattern repeats again and again.",
    questions: [
      {
        kind: "literal",
        prompt: "Where does the moon's light really come from?",
        options: [
          "A soft glow inside the moon",
          "Sunlight bouncing off its surface",
          "The lights of cities on Earth",
        ],
        correct: 1,
        evidence: "sunlight bounces off its surface",
      },
      {
        kind: "inferential",
        prompt: "If you cannot see the moon at all tonight, what is probably true?",
        options: [
          "The moon has stopped moving",
          "The moon has drifted too far away",
          "Its sunlit side is facing away from us",
        ],
        correct: 2,
      },
      {
        kind: "detail",
        prompt: "How long does the moon's journey around Earth take?",
        options: ["About one week", "About one month", "About one year"],
        correct: 1,
        findPhrase: "about one month",
      },
    ],
  },
  {
    id: "l2-frog",
    title: "Rani and the Rain Frog",
    level: 2,
    kind: "fiction",
    text:
      "Rani found a little green frog sitting inside her rain boot on the porch. " +
      "\"You cannot live in there,\" she laughed. " +
      "She carried the boot to the garden pond, but the frog would not hop out. " +
      "She tipped the boot near the mango tree. " +
      "The frog clung on tighter. " +
      "Then thunder rumbled far away, and the frog trembled. " +
      "At last Rani understood: the frog was not being stubborn, it was scared of the storm. " +
      "So she set the boot in the warm, dry shed, and the frog stayed until the sky cleared. " +
      "After the rain, it hopped away with one loud, happy croak.",
    questions: [
      {
        kind: "literal",
        prompt: "Where did Rani put the boot during the storm?",
        options: ["In the warm, dry shed", "Next to the garden pond", "Up in the mango tree"],
        correct: 0,
        evidence: "warm, dry shed",
      },
      {
        kind: "inferential",
        prompt: "How did Rani work out that the frog was scared?",
        options: [
          "The frog hid deeper inside the boot",
          "It trembled when the thunder rumbled",
          "It croaked sadly at the pond",
        ],
        correct: 1,
      },
      {
        kind: "detail",
        prompt: "What did the frog do after the rain?",
        options: [
          "It fell asleep in the boot",
          "It swam across the pond",
          "It hopped away with one loud, happy croak",
        ],
        correct: 2,
        findPhrase: "one loud, happy croak",
      },
    ],
    storyOrder: {
      events: [
        "Thunder rumbles and Rani realises the frog is frightened.",
        "Rani finds a frog sitting inside her rain boot.",
        "The frog waits out the storm in the shed and hops away happily.",
        "Rani tries to tip the frog out at the pond and the mango tree.",
      ],
      correctOrder: [1, 3, 0, 2],
    },
  },

  /* ---------------------------------------------------------------- *
   * Level 3 — richer clauses, layered ideas (~125 words)
   * ---------------------------------------------------------------- */
  {
    id: "l3-trains",
    title: "How Trains Stay on the Track",
    level: 3,
    kind: "nonfiction",
    text:
      "A train has no steering wheel, yet it follows every bend in the track. " +
      "The secret is hiding in the shape of its wheels. " +
      "Each wheel is not a flat cylinder but a gentle cone, wider on the inside than on the outside. " +
      "The two wheels on an axle are joined solidly together, so they always spin at exactly the same speed. " +
      "When the train drifts to one side, the wheel on that side rides up onto its wider part. " +
      "A wider circle travels farther with each spin, so that side of the train speeds up and gently steers the whole train back to the middle of the track. " +
      "Engineers discovered this trick long ago, and it still guides every train today, " +
      "from slow freight trains to expresses that fly along at three hundred kilometres per hour.",
    questions: [
      {
        kind: "literal",
        prompt: "What shape is a train wheel?",
        options: ["A flat cylinder", "A gentle cone", "A hollow ring"],
        correct: 1,
        evidence: "gentle cone",
      },
      {
        kind: "inferential",
        prompt: "What would happen if the two wheels on an axle could spin at different speeds?",
        options: [
          "The cone trick would stop steering the train back to the middle",
          "The train would travel twice as fast",
          "The wheels would become perfectly flat",
        ],
        correct: 0,
      },
      {
        kind: "detail",
        prompt: "How fast can the fastest express trains travel?",
        options: [
          "Thirty kilometres per hour",
          "One hundred kilometres per hour",
          "Three hundred kilometres per hour",
        ],
        correct: 2,
        findPhrase: "three hundred kilometres per hour",
      },
    ],
  },
  {
    id: "l3-starmapper",
    title: "The Star Mapper",
    level: 3,
    kind: "fiction",
    text:
      "The survey ship Dandelion had one old-fashioned crew member: Commander Ila, who drew star maps by hand. " +
      "The ship's computer could chart a planet in seconds, but Ila still sketched every asteroid and moon in her leather notebook. " +
      "Her crewmates teased her for wasting time. " +
      "Then, while the ship was passing the twin moons of Orin, every screen flickered and went dark. " +
      "The computer was down, and a field of drifting asteroids lay dead ahead. " +
      "The crew crowded around Ila's notebook. " +
      "There, in careful pencil, was every rock, and a narrow safe channel winding between them. " +
      "Steering by her drawings and the light of the stars, the Dandelion slipped through without a single scratch. " +
      "Nobody teased Ila after that. " +
      "In fact, three crewmates asked her to teach them to draw.",
    questions: [
      {
        kind: "literal",
        prompt: "What did Ila use to make her maps?",
        options: ["A pocket camera", "Pencil and a leather notebook", "A spare ship computer"],
        correct: 1,
        evidence: "leather notebook",
      },
      {
        kind: "inferential",
        prompt: "Why did the crew stop teasing Ila?",
        options: [
          "The captain ordered everyone to be kind",
          "She promised to stop drawing during work hours",
          "Her hand-drawn maps saved the ship when the computer failed",
        ],
        correct: 2,
      },
      {
        kind: "detail",
        prompt: "Where was the ship when the screens went dark?",
        options: [
          "Passing the twin moons of Orin",
          "Docking at a space station",
          "Circling a red comet",
        ],
        correct: 0,
        findPhrase: "twin moons of Orin",
      },
    ],
    storyOrder: {
      events: [
        "The crew steers through the asteroids using Ila's notebook.",
        "Crewmates tease Ila for drawing star maps by hand.",
        "Three crewmates ask Ila to teach them to draw.",
        "The ship's computer fails near the twin moons of Orin.",
      ],
      correctOrder: [1, 3, 0, 2],
    },
  },
  {
    id: "l3-volcano",
    title: "A Mountain with a Secret",
    level: 3,
    kind: "nonfiction",
    text:
      "A volcano looks like an ordinary mountain, but it hides a long tunnel leading deep underground. " +
      "Far below the surface, rock gets so hot that it melts into a thick, glowing liquid called magma. " +
      "Magma is lighter than the solid rock around it, so it slowly rises, the way a bubble rises through honey. " +
      "When it finds a crack, it can burst out at the top of the mountain. " +
      "Once magma flows into the open air, it gets a new name: lava. " +
      "Some volcanoes erupt with a mighty boom, while others simply ooze quietly for years. " +
      "When lava cools, it hardens into brand-new rock, and layer by layer the mountain grows a little taller. " +
      "Some islands, like the islands of Hawaii, were built entirely by volcanoes, one eruption at a time.",
    questions: [
      {
        kind: "literal",
        prompt: "What new name does magma get when it flows into the open air?",
        options: ["Crust", "Lava", "Ash"],
        correct: 1,
        evidence: "a new name: lava",
      },
      {
        kind: "inferential",
        prompt: "The passage says magma rises like a bubble through honey. What does that tell you?",
        options: [
          "Magma moves upward slowly",
          "Magma is sweet like honey",
          "Magma sinks to the bottom",
        ],
        correct: 0,
      },
      {
        kind: "detail",
        prompt: "Which islands were built entirely by volcanoes?",
        options: [
          "The islands of Britain",
          "The islands of Japan",
          "The islands of Hawaii",
        ],
        correct: 2,
        findPhrase: "islands of Hawaii",
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * Level 4 — longest passages, richest clauses (~160 words)
   * ---------------------------------------------------------------- */
  {
    id: "l4-lighthouse",
    title: "The Lighthouse Letter",
    level: 4,
    kind: "fiction",
    text:
      "When Mira's family moved into the old lighthouse cottage, she found a loose stone in her bedroom wall. " +
      "Behind it sat a dusty tin box holding a letter written eighty years ago. " +
      "\"To whoever finds this,\" it read, \"I have hidden my greatest treasure where the light touches land at exactly sunset. — E.B., keeper of the light.\" " +
      "All summer, Mira watched the lighthouse beam. " +
      "She noticed that at sunset it swept across the cliffs and rested, for one long moment, on a crooked pine tree. " +
      "On the last evening of the holidays, she dug beneath the pine, and her spade struck something hard. " +
      "It was a second tin box. " +
      "Inside there was no gold at all. " +
      "Instead, Mira found E.B.'s old diary, full of drawings of seabirds, storms, and ships, with a note on the first page: " +
      "\"The treasure is everything I noticed while I kept watch.\" " +
      "Mira smiled. " +
      "That night, she started a diary of her own.",
    questions: [
      {
        kind: "literal",
        prompt: "Where was the first tin box hidden?",
        options: [
          "Behind a loose stone in Mira's bedroom wall",
          "Under the lighthouse stairs",
          "Beneath the crooked pine tree",
        ],
        correct: 0,
        evidence: "loose stone",
      },
      {
        kind: "inferential",
        prompt: "Why did Mira dig beneath the crooked pine tree?",
        options: [
          "She wanted to plant a tree of her own",
          "The sunset beam rested there, matching the letter's clue",
          "The diary told her exactly where to dig",
        ],
        correct: 1,
      },
      {
        kind: "detail",
        prompt: "What was drawn inside E.B.'s diary?",
        options: [
          "Maps of buried gold",
          "Portraits of lighthouse keepers",
          "Seabirds, storms, and ships",
        ],
        correct: 2,
        findPhrase: "seabirds, storms, and ships",
      },
    ],
    storyOrder: {
      events: [
        "Mira digs beneath the pine and finds a second tin box.",
        "Mira finds an old letter behind a loose stone.",
        "Mira reads E.B.'s diary and starts one of her own.",
        "Mira watches the beam all summer and spots where it rests at sunset.",
      ],
      correctOrder: [1, 3, 0, 2],
    },
  },
  {
    id: "l4-octopus",
    title: "The Ocean's Quick-Change Artist",
    level: 4,
    kind: "nonfiction",
    text:
      "An octopus can do something no costume shop could ever match: it can change its whole appearance in less than a second. " +
      "Its skin is packed with thousands of tiny, stretchy sacs of colour called chromatophores. " +
      "To switch colour, the octopus squeezes muscles around these sacs, stretching some wide open and letting others shrink to dots. " +
      "Other muscles can pull its smooth skin up into bumps and spikes, so the animal can copy the texture of a rock or a clump of seaweed. " +
      "Scientists find this ability extra puzzling for one strange reason: tests suggest that octopuses are colour-blind. " +
      "How do they match colours they may not even see? " +
      "One idea is that their skin itself can sense light. " +
      "Whatever the answer, the disguise works brilliantly. " +
      "A hungry shark can glide right past an octopus dressed as a rock, " +
      "and never notice that the rock is watching it very, very carefully.",
    questions: [
      {
        kind: "literal",
        prompt: "What are the tiny colour sacs in octopus skin called?",
        options: ["Barnacles", "Chromatophores", "Tentacles"],
        correct: 1,
        evidence: "chromatophores",
      },
      {
        kind: "inferential",
        prompt: "Why might an octopus make its skin bumpy like a rock?",
        options: [
          "So hunters like sharks glide past without noticing it",
          "Because bumpy skin helps it swim faster",
          "So other octopuses can find it easily",
        ],
        correct: 0,
      },
      {
        kind: "detail",
        prompt: "What is one idea about how octopuses match colours they may not see?",
        options: [
          "Their eyes glow in the dark",
          "Their skin itself can sense light",
          "They remember every colour from birth",
        ],
        correct: 1,
        findPhrase: "their skin itself can sense light",
      },
    ],
  },
  {
    id: "l4-kiteship",
    title: "The Kite Ship",
    level: 4,
    kind: "fiction",
    text:
      "Three days from the space station, the cargo ship Persimmon's main engine sputtered and died. " +
      "\"Without it, we will drift for a month,\" sighed Captain Osei. " +
      "The youngest engineer, Tam, floated quietly down to the cargo hold and stared at their freight: " +
      "a giant roll of silver mirror foil, ordered by a telescope factory. " +
      "Tam remembered a lesson from school: sunlight gives a tiny push to everything it touches. " +
      "One small sheet would feel almost nothing, but a sail as big as a stadium could slowly pull a whole ship. " +
      "For two days, the crew stitched the foil into an enormous shining square and fastened it to the hull with steel cables. " +
      "Sunlight pressed gently against the great mirror, and the Persimmon began to glide, slowly at first, then faster, like a kite catching the wind. " +
      "They reached the station only one day late. " +
      "The dock workers stared. " +
      "The delivery had arrived, and it had sailed in on its own cargo.",
    questions: [
      {
        kind: "literal",
        prompt: "What was the Persimmon carrying?",
        options: [
          "A crate of telescope lenses",
          "A giant roll of silver mirror foil",
          "Boxes of dried food for the station",
        ],
        correct: 1,
        evidence: "silver mirror foil",
      },
      {
        kind: "inferential",
        prompt: "Why did the dock workers stare when the ship arrived?",
        options: [
          "The ship had sailed in using the very cargo it was delivering",
          "The ship was three weeks early",
          "Captain Osei forgot to radio ahead",
        ],
        correct: 0,
      },
      {
        kind: "detail",
        prompt: "How did the crew fasten the sail to the ship?",
        options: ["With steel cables", "With strong glue", "With knotted ropes"],
        correct: 0,
        findPhrase: "steel cables",
      },
    ],
    storyOrder: {
      events: [
        "The crew stitches the foil into a huge sail and fastens it to the hull.",
        "The Persimmon glides to the station and arrives one day late.",
        "The Persimmon's main engine sputters and dies.",
        "Tam remembers that sunlight gives a tiny push to everything it touches.",
      ],
      correctOrder: [2, 3, 0, 1],
    },
  },
];

/** Passages for one level, in authored order. */
export function passagesForLevel(level: Level): Passage[] {
  return PASSAGES.filter((p) => p.level === level);
}

export function passageById(id: string): Passage | undefined {
  return PASSAGES.find((p) => p.id === id);
}

export const ALL_LEVELS: Level[] = [1, 2, 3, 4];
