import type { AgeBand } from "@loci/module-sdk";

/**
 * Lexicon starter content — the Word Collection packs (PRD 4.6).
 *
 * Authored, band-levelled vocabulary. Every word is met IN CONTEXT first
 * (the two-line micro-story), then tested. Each entry becomes a collectible
 * card once mastered: word, child-friendly meaning, emoji "picture",
 * example sentence, micro-story, and a "use it today" prompt.
 *
 * Authoring rules (enforced by content.test.ts):
 * - no duplicate words across packs
 * - every field non-empty; microStory is exactly two lines
 * - the example sentence contains the word itself (the learn flow blanks it)
 * - the micro-story uses the word in context
 */

export interface WordEntry {
  word: string;
  meaning: string;
  emoji: string;
  /** A fresh example sentence — always contains the word (used for fill-the-blank). */
  sentence: string;
  /** Two-line context micro-story that uses the word. */
  microStory: [string, string];
  /** A "use it today" prompt — the card's call to action. */
  useIt: string;
}

export interface WordPack {
  band: AgeBand;
  title: string;
  words: WordEntry[];
}

function w(
  word: string,
  meaning: string,
  emoji: string,
  sentence: string,
  microStory: [string, string],
  useIt: string
): WordEntry {
  return { word, meaning, emoji, sentence, microStory, useIt };
}

/* ------------------------------------------------------------------ *
 * Pack one — ages 8–9
 * ------------------------------------------------------------------ */

export const PACK_8_9: WordPack = {
  band: "8-9",
  title: "Word Explorers",
  words: [
    w(
      "gleaming",
      "shining bright, like it has just been polished",
      "✨",
      "The gleaming trophy sat on the top shelf.",
      [
        "Mia lifted the lid of the dusty old box.",
        "Inside lay a gleaming silver key, shining like a tiny star.",
      ],
      "Find something gleaming at home — a spoon, a window, a coin — and say what makes it shine."
    ),
    w(
      "curious",
      "wanting to find out about everything",
      "🧐",
      "The curious puppy sniffed every corner of the garden.",
      [
        "A strange humming sound came from behind the shed.",
        "Sam felt too curious to walk away — he had to peek.",
      ],
      "Ask one curious question today that starts with 'I wonder why…'"
    ),
    w(
      "brave",
      "ready to face something scary",
      "🦁",
      "It was brave of Leo to speak in front of the whole school.",
      [
        "The dark cave breathed cold air onto Ana's face.",
        "She took one brave step inside, holding her torch high.",
      ],
      "Do one small brave thing today, like trying a food you've never tasted."
    ),
    w(
      "gigantic",
      "extremely big — bigger than big",
      "🐘",
      "A gigantic wave rolled toward the beach.",
      [
        "Something blocked out the sun above the picnic.",
        "It was a gigantic balloon, as big as a house, drifting by.",
      ],
      "Spot the most gigantic thing on your street and name it."
    ),
    w(
      "whisper",
      "to speak very, very softly",
      "🤫",
      "You have to whisper when the baby is sleeping.",
      [
        "The two friends hid under the blanket fort.",
        "'I know a secret,' Maya said in a whisper.",
      ],
      "Whisper one kind thing to someone in your family today."
    ),
    w(
      "soggy",
      "wet and squishy all the way through",
      "🥣",
      "My cereal went soggy because I talked too long.",
      [
        "Rain poured all through the football match.",
        "By the end, Dev's socks were completely soggy.",
      ],
      "At breakfast, guess how long cereal takes to turn soggy — then test it."
    ),
    w(
      "grumpy",
      "in a bad mood and easily annoyed",
      "😾",
      "Dad is always grumpy before his morning tea.",
      [
        "The cat's food bowl was empty again.",
        "He gave everyone a grumpy stare until it was filled.",
      ],
      "If you feel grumpy today, name it out loud — 'I'm grumpy!' — and see if it helps."
    ),
    w(
      "dash",
      "to run somewhere very fast",
      "🏃",
      "We had to dash to catch the bus.",
      [
        "Thunder rumbled just as the bell rang.",
        "Everyone made a dash for the door before the rain hit.",
      ],
      "Time yourself doing a ten-second dash across the garden or hall."
    ),
    w(
      "clever",
      "quick at figuring things out",
      "🦊",
      "That was a clever way to open the sticky jar.",
      [
        "The crow could not reach the water at the bottom of the jug.",
        "So the clever bird dropped in pebbles until the water rose.",
      ],
      "Tell someone about one clever idea you had today, even a tiny one."
    ),
    w(
      "fragile",
      "easily broken — handle with care",
      "🥚",
      "The parcel was marked FRAGILE in big red letters.",
      [
        "Grandma handed Ria the tiny glass bird.",
        "'It's fragile,' she said, 'so hold it like a baby chick.'",
      ],
      "Find the most fragile thing in your room and move it somewhere safer."
    ),
    w(
      "drowsy",
      "sleepy and slow",
      "😴",
      "The warm sun made the cat drowsy.",
      [
        "The story tape hummed on in the back seat.",
        "By the third chapter, Zoe was drowsy and dreaming of dragons.",
      ],
      "Notice tonight the exact moment you start to feel drowsy."
    ),
    w(
      "gobble",
      "to eat something fast and greedily",
      "🦃",
      "Don't gobble your lunch — you'll get hiccups!",
      [
        "The picnic lasted about one minute.",
        "A seagull swooped down to gobble the last chip.",
      ],
      "At dinner, try NOT to gobble — chew each bite ten times."
    ),
    w(
      "shiver",
      "to shake a little from cold or fear",
      "🥶",
      "The icy wind made us shiver at the bus stop.",
      [
        "The pool water was colder than it looked.",
        "Nina felt a shiver run from her toes to her ears.",
      ],
      "Next time you shiver, say the word out loud — 'brrr, a shiver!'"
    ),
    w(
      "peculiar",
      "strange in an interesting way",
      "🦩",
      "A peculiar smell of pancakes filled the garage.",
      [
        "The new neighbor only ever wore one yellow glove.",
        "'How peculiar,' whispered Tom, watching from the fence.",
      ],
      "Spot one peculiar thing today and describe it to someone."
    ),
    w(
      "gather",
      "to collect things or come together in one place",
      "🧺",
      "Let's gather sticks for the campfire.",
      [
        "The storm was coming, and the sky turned purple.",
        "'Gather the toys off the grass!' called Mum.",
      ],
      "Gather five interesting things from around the house and make a mini museum."
    ),
    w(
      "gentle",
      "soft and careful, not rough",
      "🕊️",
      "Be gentle when you pat the rabbit.",
      [
        "The baby bird had fallen from its nest.",
        "With gentle hands, Aria lifted it back home.",
      ],
      "Use your most gentle voice for one whole conversation today."
    ),
    w(
      "enormous",
      "very, very big",
      "🐋",
      "An enormous pumpkin won first prize at the fair.",
      [
        "The footprint in the mud was bigger than a dinner plate.",
        "'Whatever made this,' said Jay, 'must be enormous.'",
      ],
      "Draw an enormous version of something tiny, like an ant."
    ),
    w(
      "vanish",
      "to disappear suddenly",
      "🎩",
      "The magician made the rabbit vanish.",
      [
        "One moment the cookie was on the plate.",
        "Then the dog trotted past — and it seemed to vanish.",
      ],
      "Watch an ice cube in warm water slowly vanish."
    ),
    w(
      "mumble",
      "to speak quietly and unclearly",
      "😶",
      "Please don't mumble — I can't hear you!",
      [
        "'Who ate the last biscuit?' asked Dad.",
        "'Maybe me,' came a mumble from behind the sofa.",
      ],
      "Say your name as a mumble, then loud and clear — hear the difference?"
    ),
    w(
      "speedy",
      "very fast",
      "🚀",
      "The speedy hare zoomed past the tortoise.",
      [
        "The go-kart race was about to begin.",
        "Zara's kart looked old, but it was surprisingly speedy.",
      ],
      "Wish someone a 'speedy recovery' if they're feeling poorly."
    ),
    w(
      "delighted",
      "very, very pleased",
      "😄",
      "Gran was delighted with her birthday card.",
      [
        "The letter had a paw print instead of a stamp.",
        "Milo was delighted — the shelter had said yes to the puppy!",
      ],
      "Tell someone one thing that delighted you today."
    ),
    w(
      "rummage",
      "to search by moving things around messily",
      "🎒",
      "I had to rummage through my bag to find the key.",
      [
        "'Five minutes to leave!' called Dad.",
        "Cue a wild rummage through the sock drawer for a matching pair.",
      ],
      "Rummage through a drawer and find one thing you forgot you had."
    ),
    w(
      "timid",
      "shy and easily frightened",
      "🐭",
      "The timid kitten hid behind the curtain.",
      [
        "The new boy stood alone at the classroom door.",
        "He gave a timid wave, and Ana waved back twice as big.",
      ],
      "If you see someone looking timid today, say a friendly hello."
    ),
    w(
      "sparkle",
      "to shine with tiny flashes of light",
      "💫",
      "The frost made the whole field sparkle.",
      [
        "Nia held the crystal up to the window.",
        "A hundred tiny rainbows began to sparkle inside it.",
      ],
      "Find three things that sparkle before bedtime."
    ),
    w(
      "wobble",
      "to move unsteadily from side to side",
      "🍮",
      "The jelly began to wobble as I carried the plate.",
      [
        "It was Ravi's first try without training wheels.",
        "One wobble, two wobbles… and then he was flying.",
      ],
      "Balance on one leg and count how long before you wobble."
    ),
    w(
      "snug",
      "warm, cozy and comfortable",
      "🧦",
      "The cat looked snug in its basket by the heater.",
      [
        "Outside, the rain drummed on the window.",
        "Inside, Bo was snug under three blankets with a book.",
      ],
      "Make the most snug reading spot you can tonight."
    ),
    w(
      "leap",
      "to jump high or far",
      "🐸",
      "The frog can leap right across the pond.",
      [
        "The last stepping stone was far away.",
        "Kai took a deep breath and made the leap.",
      ],
      "See how far you can leap from a standing start — then try to beat it."
    ),
    w(
      "filthy",
      "very, very dirty",
      "🐷",
      "Take off those filthy boots before you come in!",
      [
        "The puddle was deeper than it looked.",
        "Jo climbed out laughing, filthy from head to toe.",
      ],
      "Use 'filthy' today for something dirtier than just dirty — then wash your hands!"
    ),
    w(
      "dazzling",
      "so bright it almost hurts your eyes",
      "🎆",
      "The fireworks were dazzling against the night sky.",
      [
        "The curtains opened for the school play.",
        "The stage lights were so dazzling that Ivy could not see the crowd.",
      ],
      "Describe the most dazzling thing you've ever seen to someone."
    ),
    w(
      "stubborn",
      "refusing to change your mind",
      "🐐",
      "The stubborn donkey would not move a single step.",
      [
        "'That jar lid is stuck forever,' said everyone.",
        "But stubborn little Ren kept twisting… pop!",
      ],
      "Being stubborn can be a superpower — stick with one tricky puzzle today."
    ),
    w(
      "gloomy",
      "dark and sad-feeling",
      "🌧️",
      "The sky turned gloomy before the storm.",
      [
        "The power went out, and the house fell gloomy and grey.",
        "Then Dad lit a candle and started the shadow-puppet show.",
      ],
      "If the day looks gloomy, find one bright thing in it and name it."
    ),
    w(
      "chuckle",
      "to laugh quietly",
      "😁",
      "The joke made Grandpa chuckle behind his newspaper.",
      [
        "The kitten attacked its own reflection in the mirror.",
        "Priya tried not to chuckle — and failed.",
      ],
      "Tell a joke and see if you can get a chuckle from someone."
    ),
    w(
      "startle",
      "to surprise someone so they jump",
      "🎈",
      "Don't startle the cat while it's sleeping.",
      [
        "Theo crept up behind his sister with a party horn.",
        "The toot managed to startle her AND the dog AND himself.",
      ],
      "Say 'you startled me!' next time something makes you jump."
    ),
    w(
      "weary",
      "very tired",
      "🥱",
      "The weary hikers finally reached the top.",
      [
        "It took all day to build the sandcastle city.",
        "Two weary builders fell asleep on the way home.",
      ],
      "When you feel weary tonight, notice it and head to bed five minutes early."
    ),
    w(
      "glide",
      "to move smoothly and easily",
      "🦢",
      "Swans glide across the lake without a sound.",
      [
        "The paper plane caught a puff of wind.",
        "It seemed to glide forever before landing on the teacher's desk.",
      ],
      "Make a paper plane and see how far it can glide."
    ),
    w(
      "cautious",
      "very careful to avoid danger",
      "🚦",
      "Be cautious when you cross the busy road.",
      [
        "The old rope bridge creaked over the stream.",
        "Ben took slow, cautious steps, holding the rail tight.",
      ],
      "Be extra cautious today: stop and look both ways every time you cross."
    ),
    w(
      "marvel",
      "to be amazed and full of wonder",
      "🌈",
      "We stopped to marvel at the double rainbow.",
      [
        "The ant carried a crumb three times its size.",
        "The whole class gathered to marvel at it.",
      ],
      "Find one small thing to marvel at today — clouds count."
    ),
    w(
      "drenched",
      "completely soaked with water",
      "☔",
      "We got drenched running home in the rain.",
      [
        "The water balloon fight lasted one glorious minute.",
        "Every single player ended up drenched and grinning.",
      ],
      "Use 'drenched' next time you're very wet — it's stronger than just 'wet'."
    ),
    w(
      "eager",
      "excited and ready to do something",
      "🐕",
      "The students were eager to start the science experiment.",
      [
        "The swimming pool opened at nine o'clock sharp.",
        "By 8:45, a line of eager kids was already bouncing at the gate.",
      ],
      "Tell someone one thing you're eager to do this week."
    ),
    w(
      "treasure",
      "something special that you keep safe",
      "🗺️",
      "The old map showed where the treasure was buried.",
      [
        "To anyone else, it was just a smooth grey pebble.",
        "To Ori, it was treasure from the best beach day ever.",
      ],
      "Pick one small treasure of yours and tell someone its story."
    ),
  ],
};

/* ------------------------------------------------------------------ *
 * Pack two — ages 10–12
 * ------------------------------------------------------------------ */

export const PACK_10_12: WordPack = {
  band: "10-12",
  title: "Word Voyagers",
  words: [
    w(
      "reluctant",
      "not wanting to do something; dragging your feet",
      "🐢",
      "Sam was reluctant to leave the pool, even at closing time.",
      [
        "The diving board looked much higher from the top.",
        "Maya, suddenly reluctant, decided the ladder was there for a reason.",
      ],
      "Notice one thing you feel reluctant to do today — then do it first."
    ),
    w(
      "ancient",
      "very, very old — from long, long ago",
      "🏛️",
      "The museum displayed an ancient Egyptian necklace.",
      [
        "The oak in the park was planted four hundred years ago.",
        "Standing under its ancient branches felt like time travel.",
      ],
      "Find the most ancient object in your home and ask about its story."
    ),
    w(
      "genuine",
      "real and true — not fake",
      "💎",
      "Experts confirmed the coin was genuine, not a copy.",
      [
        "'Nice goal,' said the rival captain after the match.",
        "It wasn't sarcasm — his smile was completely genuine.",
      ],
      "Give someone a genuine compliment today — one you really mean."
    ),
    w(
      "vivid",
      "so bright and clear it feels real",
      "🎨",
      "She gave a vivid description of the carnival.",
      [
        "Years later, Arun could still describe the comet perfectly.",
        "Some memories stay vivid forever.",
      ],
      "Describe your morning in the most vivid way you can — colors, sounds, smells."
    ),
    w(
      "scarce",
      "hard to find; not enough of it",
      "🌵",
      "Water is scarce in the desert.",
      [
        "By August, the pond had shrunk to a puddle.",
        "With water so scarce, the herons moved on.",
      ],
      "Name one thing that is scarce where you live, and one thing there's plenty of."
    ),
    w(
      "abundant",
      "more than enough; plenty",
      "🌾",
      "The orchard had an abundant crop of apples this year.",
      [
        "After the spring rains, the whole valley woke up.",
        "Food was suddenly abundant, and every bird in the sky knew it.",
      ],
      "Spot something abundant today — leaves, bricks, clouds — and estimate how many."
    ),
    w(
      "anticipate",
      "to expect something and get ready for it",
      "🔮",
      "Good chess players anticipate their opponent's next move.",
      [
        "Nia packed an umbrella though the sky was blue.",
        "She had learned to anticipate the afternoon storms.",
      ],
      "Anticipate one thing that might go wrong tomorrow and prepare for it tonight."
    ),
    w(
      "baffled",
      "completely confused",
      "🤯",
      "The riddle left the whole class baffled.",
      [
        "The cookies had vanished from a locked tin.",
        "Even Detective Dad was baffled — until he saw the crumbs on the cat.",
      ],
      "Next time you're confused, say 'I'm baffled' — then ask one good question."
    ),
    w(
      "colossal",
      "incredibly huge",
      "🗽",
      "A colossal statue guarded the harbor.",
      [
        "From the plane window, the city looked like a toy set.",
        "Then a colossal mountain slid into view and dwarfed it all.",
      ],
      "Compare: name something big, something enormous, and something truly colossal."
    ),
    w(
      "dwindle",
      "to slowly get smaller or less",
      "🕯️",
      "Our snack supply began to dwindle by day two of the trip.",
      [
        "At sunset the bonfire roared taller than Dad.",
        "By midnight it had dwindled to a whisper of orange.",
      ],
      "Watch something dwindle today — a candle, your juice, a phone battery."
    ),
    w(
      "elated",
      "extremely happy; over the moon",
      "🎉",
      "Priya was elated when her name was called for the team.",
      [
        "The email began: 'Congratulations!'",
        "Mum read it twice, then did an elated dance around the kitchen.",
      ],
      "Use 'elated' instead of 'really happy' once today."
    ),
    w(
      "feeble",
      "very weak",
      "🍂",
      "The feeble light of one candle wasn't enough to read by.",
      [
        "'I did my homework, but a wizard erased it.'",
        "Even Milo knew it was a feeble excuse.",
      ],
      "A feeble excuse is a weak one — catch yourself before you make one today."
    ),
    w(
      "hasty",
      "done too quickly, without enough thinking",
      "🏎️",
      "He regretted his hasty answer as soon as he said it.",
      [
        "Rani glued the model plane together in five minutes flat.",
        "The hasty job came apart on its very first flight.",
      ],
      "Before your next hasty decision, count to five and check it."
    ),
    w(
      "hilarious",
      "extremely funny",
      "🤣",
      "The blooper reel was the most hilarious part of the movie.",
      [
        "The dog stole Coach's whistle mid-practice.",
        "The chase that followed was, everyone agreed, hilarious.",
      ],
      "Retell the most hilarious thing you've ever seen — with actions."
    ),
    w(
      "immense",
      "extremely large; vast",
      "🌌",
      "Astronauts describe the immense silence of space.",
      [
        "The library's main hall swallowed their footsteps.",
        "Rows of shelves rose into the immense, dusty quiet.",
      ],
      "Look up tonight and think about how immense the sky really is."
    ),
    w(
      "jubilant",
      "so happy you want to celebrate",
      "🏆",
      "The jubilant fans sang all the way home.",
      [
        "The final whistle blew: underdogs 1, champions 0.",
        "A jubilant roar shook the little stadium.",
      ],
      "What was your most jubilant moment ever? Tell someone about it."
    ),
    w(
      "keen",
      "very interested and eager",
      "🔭",
      "Zoya is keen on astronomy and never misses a meteor shower.",
      [
        "The coding club had one rule: bring questions.",
        "Dev arrived with eleven — the keenest member by far.",
      ],
      "Name one thing you're keen to learn this year."
    ),
    w(
      "luminous",
      "giving off light; glowing",
      "🌕",
      "The watch has luminous hands you can read at night.",
      [
        "Deep in the cave, the guide switched off her lamp.",
        "The walls stayed luminous with a soft blue glow — glow-worms!",
      ],
      "Find something luminous after dark — stars, clock hands, street signs."
    ),
    w(
      "meticulous",
      "very careful about every small detail",
      "📐",
      "She kept meticulous notes on every experiment.",
      [
        "Every rivet on the model bridge was placed with tweezers.",
        "Judges called it the most meticulous build of the fair.",
      ],
      "Do one small task today in a completely meticulous way."
    ),
    w(
      "nimble",
      "quick and light in movement",
      "🤸",
      "The nimble goalkeeper tipped the ball over the bar.",
      [
        "The squirrel crossed the wire like a tightrope walker.",
        "Nimble feet never even paused.",
      ],
      "Test how nimble your fingers are: time yourself tying a shoelace."
    ),
    w(
      "obstacle",
      "something that blocks your way",
      "🚧",
      "The fallen tree was an obstacle on the cycle path.",
      [
        "Level nine had lava, spikes, and a moving wall.",
        "Ana grinned — every obstacle was just a puzzle wearing a costume.",
      ],
      "Build a mini obstacle course and time yourself through it."
    ),
    w(
      "persistent",
      "refusing to give up",
      "🧗",
      "Her persistent practice finally paid off at the recital.",
      [
        "The wall said no. The rope said no. Gravity said no.",
        "But Iman was persistent, and on try nineteen the summit said yes.",
      ],
      "Pick one hard thing and be persistent for ten extra minutes."
    ),
    w(
      "quench",
      "to get rid of your thirst with a drink",
      "🥤",
      "Nothing can quench your thirst like cold water.",
      [
        "Three laps in the summer heat left the team gasping.",
        "One icy water fountain quenched them all.",
      ],
      "After playing hard, notice how good it feels to quench your thirst."
    ),
    w(
      "resilient",
      "able to bounce back after something hard",
      "🎾",
      "Resilient plants grow back even after a fire.",
      [
        "The sandcastle fell to the third wave of the tide.",
        "The resilient builders just moved up the beach and started again.",
      ],
      "Being resilient means bouncing back — name a time you did."
    ),
    w(
      "sincere",
      "truly meaning what you say",
      "💌",
      "He offered a sincere apology for the broken window.",
      [
        "'Your project inspired mine,' said the note in her locker.",
        "It was a small note, but a sincere one, and Lila kept it.",
      ],
      "Write one sincere thank-you note to someone today."
    ),
    w(
      "thrive",
      "to grow strong and do really well",
      "🍋",
      "Tomato plants thrive in warm sunshine.",
      [
        "Everyone said the tiny lemon tree wouldn't survive the balcony.",
        "Two summers later it continued to thrive, taller than the railing.",
      ],
      "What do YOU need to thrive? Name your top three."
    ),
    w(
      "unravel",
      "to come undone thread by thread — or to solve something tangled",
      "🧶",
      "Pull that loose thread and the whole sweater will unravel.",
      [
        "The mystery had seven clues and no suspects.",
        "Then one bus ticket made the whole case unravel beautifully.",
      ],
      "Watch a mystery show and try to unravel it before the detective does."
    ),
    w(
      "versatile",
      "useful in many different ways; good at many things",
      "🛠️",
      "A versatile player can defend and attack.",
      [
        "Grandpa's pocket knife had opened crates, fixed toys, and sliced mangoes.",
        "'Versatile,' he said, 'beats fancy every time.'",
      ],
      "Find the most versatile object in your house — how many uses can you list?"
    ),
    w(
      "wary",
      "careful because something might be risky",
      "🦌",
      "Deer are wary of any sudden movement.",
      [
        "The stray cat wanted the food but kept its distance.",
        "Weeks of gentle patience slowly made it less wary.",
      ],
      "It's smart to be wary of strangers online — name two reasons why."
    ),
    w(
      "drastic",
      "sudden and extreme",
      "⚡",
      "Cutting the whole team was a drastic decision.",
      [
        "The recipe was ruined: salt instead of sugar.",
        "Only a drastic move could save dessert — Operation Ice Cream.",
      ],
      "Describe the most drastic change in weather you've ever experienced."
    ),
    w(
      "exhilarating",
      "so thrilling it fills you with excited energy",
      "🎢",
      "The first drop of the roller coaster was exhilarating.",
      [
        "The sled tipped over the crest of the hill.",
        "The exhilarating rush of speed made both riders whoop.",
      ],
      "Rank your top three most exhilarating moments ever."
    ),
    w(
      "frigid",
      "freezing cold",
      "🧊",
      "A frigid wind swept down from the mountains.",
      [
        "The lake dared them every winter morning.",
        "One toe in the frigid water was enough for most.",
      ],
      "Use 'frigid' next time something is truly freezing — it's colder than 'cold'."
    ),
    w(
      "gratitude",
      "the feeling of being thankful",
      "🙏",
      "She sent a card to show her gratitude to the firefighters.",
      [
        "The neighbor rescued Milo's kite from the tallest tree.",
        "Milo's gratitude arrived the next morning: warm cookies.",
      ],
      "Say one sentence of gratitude at dinner tonight."
    ),
    w(
      "hoard",
      "to collect and hide away a large amount of something",
      "🐿️",
      "Squirrels hoard acorns for the winter.",
      [
        "Under the floorboard, Tara found her brother's secret stash.",
        "Ninety-one bottle caps — quite a hoard.",
      ],
      "Do you hoard anything? Count your collection today."
    ),
    w(
      "inevitable",
      "certain to happen; impossible to avoid",
      "⏳",
      "With those dark clouds, rain felt inevitable.",
      [
        "Jo's tower of blocks reached the ceiling fan's breeze.",
        "The crash was inevitable — the only question was when.",
      ],
      "Predict one inevitable thing about tomorrow and see if you're right."
    ),
    w(
      "lurk",
      "to wait hidden, ready to appear",
      "🐊",
      "Crocodiles lurk just beneath the surface.",
      [
        "Something rustled behind the curtain before the party.",
        "Six cousins had chosen the same place to lurk.",
      ],
      "In hide-and-seek, find the best place to lurk — then stay perfectly silent."
    ),
    w(
      "mimic",
      "to copy someone's actions, sounds, or voice",
      "🦜",
      "Parrots can mimic human speech.",
      [
        "The lyrebird ran through its playlist at dawn.",
        "It could mimic a chainsaw, a camera, and a car alarm.",
      ],
      "Try to mimic your favorite cartoon voice — who guesses it first?"
    ),
    w(
      "ponder",
      "to think about something slowly and deeply",
      "🤔",
      "He sat by the window to ponder the chess problem.",
      [
        "'Where does the sky end?' asked her little brother.",
        "Asha had to ponder that one all the way home.",
      ],
      "Pick one big question to ponder before you sleep tonight."
    ),
    w(
      "summit",
      "the very top of a mountain",
      "🏔️",
      "The climbers reached the summit at sunrise.",
      [
        "Forty minutes of huffing brought them above the clouds.",
        "From the summit, their town looked like a map of itself.",
      ],
      "Find the 'summit' of your area — the highest point you can safely reach."
    ),
    w(
      "treacherous",
      "dangerous, with hidden risks",
      "⚠️",
      "Black ice makes the roads treacherous in winter.",
      [
        "The path down the cliff looked easy from the top.",
        "Loose stones made it treacherous, so they took the long way.",
      ],
      "Spot one treacherous spot nearby — a wet floor, a loose step — and warn someone."
    ),
  ],
};

/* ------------------------------------------------------------------ */

export const PACKS: WordPack[] = [PACK_8_9, PACK_10_12];

export const ALL_WORDS: WordEntry[] = PACKS.flatMap((p) => p.words);

export function packFor(band: AgeBand): WordPack {
  return band === "8-9" ? PACK_8_9 : PACK_10_12;
}

export function findWord(word: string): WordEntry | undefined {
  const key = word.toLowerCase();
  return ALL_WORDS.find((entry) => entry.word.toLowerCase() === key);
}
