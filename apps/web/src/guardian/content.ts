/**
 * Guardian — the safety-education layer (PRD 6.4, curriculum Appendix F).
 * ALL content here is AUTHORED, never live-generated (content rule). Wording is
 * empowering, never frightening: every card teaches what a child CAN do.
 * Ship gate: child-safety-educator review before public launch (PRD risk #10).
 */

export interface WisdomCard {
  id: string;
  theme: 1 | 2 | 3 | 4 | 5;
  emoji: string;
  title: string;
  text: string; // read-aloud friendly, ~15 seconds
  coCard?: string; // matching parent card for the Grown-ups Corner
}

/** Sequenced easiest-first; one per day maximum, skippable without penalty. */
export const WISDOM_CARDS: WisdomCard[] = [
  // Theme 1 — If you're ever lost (the five lost-rules)
  { id: "lost-1", theme: 1, emoji: "🧍", title: "Stop and stay", text: "If you're ever lost: stop and stay where you are. You're easiest to find when you don't move." },
  { id: "lost-2", theme: 1, emoji: "👀", title: "Stand tall and look", text: "Lost? Stand tall and still, and look around slowly. Can you see your grown-up?" },
  { id: "lost-3", theme: 1, emoji: "🧕", title: "Who to ask", text: "If you need help when lost, find a mum with children, or a worker in uniform at a counter. Don't wander searching." },
  { id: "lost-4", theme: 1, emoji: "📞", title: "Know the number", text: "Can you say your grown-up's name and phone number? That's why we memorise it — memory superheroes are safe explorers!" },
  { id: "lost-5", theme: 1, emoji: "📍", title: "Never leave the place", text: "When you're lost, never leave the place with anyone — not anyone — until your own grown-up comes." },
  { id: "lost-6", theme: 1, emoji: "🤝", title: "The meeting spot", text: "Arriving somewhere crowded? Agree a meeting spot with your grown-up first, like the big clock or the main gate.", coCard: "Agree a family meeting spot every time you arrive somewhere crowded — make it a fun ritual." },
  { id: "lost-7", theme: 1, emoji: "🚨", title: "112", text: "112 is the emergency number. Free from any phone. Say where you are and what happened." },
  // Theme 2 — Tricky people
  { id: "tricky-1", theme: 2, emoji: "🐶", title: "Grown-ups ask grown-ups", text: "Safe adults don't ask children for help. A grown-up who really lost a puppy asks another grown-up. If an adult asks YOU for help — that's a tricky sign." },
  { id: "tricky-2", theme: 2, emoji: "✅", title: "Check first", text: "The check-first rule: never go anywhere with anyone — even someone you know — without checking with your grown-up first. No exceptions." },
  { id: "tricky-3", theme: 2, emoji: "🗣️", title: "NO is allowed", text: "You are allowed to say NO loudly, run, and tell — even to an adult, even if it feels rude. Being safe beats being polite." },
  { id: "tricky-4", theme: 2, emoji: "🔑", title: "The code word", text: "Tricky people might say 'it's an emergency' or 'your mum sent me.' Your family can have a secret code word. No code word? No going.", coCard: "Choose your family code word tonight. Practise it once — 'if someone comes for you, they must know the word.'" },
  // Theme 3 — My body, my rules
  { id: "body-1", theme: 3, emoji: "🩳", title: "The underwear rule", text: "The parts under your underwear are private. Nobody looks, nobody touches, nobody asks you to. That's the rule, always.", coCard: "The underwear rule lands best from you. One calm sentence tonight: 'those parts are private, and you can always tell me anything.'" },
  { id: "body-2", theme: 3, emoji: "🎁", title: "Surprises, not secrets", text: "Surprises are okay — they get told soon and make people happy. Secrets from your parents are NOT okay, especially 'don't tell your mum or dad.'", coCard: "Talk about surprises vs secrets: our family does surprises, never keep-it-from-parents secrets." },
  { id: "body-3", theme: 3, emoji: "🙌", title: "Hugs are your choice", text: "You can say no to hugs and kisses, even from relatives. A high-five or a wave is always allowed instead.", coCard: "Back your child up when they choose a high-five over a hug — it teaches that their body is theirs." },
  { id: "body-4", theme: 3, emoji: "💛", title: "Never your fault", text: "If something felt wrong, it is never your fault. Tell a grown-up you trust — and if they don't listen, keep telling until someone does.", coCard: "Tell your child directly: 'if anything ever feels wrong, tell me — you will never be in trouble for telling.'" },
  { id: "body-5", theme: 3, emoji: "🦋", title: "The uh-oh feeling", text: "That funny feeling in your tummy when something seems wrong? That's information. Trust it, and tell someone." },
  // Theme 4 — Safe online
  { id: "online-1", theme: 4, emoji: "🕵️", title: "Keep your details yours", text: "Your real name, school, address and photos in school uniform stay OFF the internet. They're yours." },
  { id: "online-2", theme: 4, emoji: "🎭", title: "Anyone can pretend", text: "People online can pretend to be anyone — even another kid. You can never be sure who's really typing." },
  { id: "online-3", theme: 4, emoji: "🚫", title: "Never meet up", text: "Never meet up with someone you only know from online, and never move a chat to a 'secret' app because someone asked." },
  { id: "online-4", theme: 4, emoji: "🗝️", title: "OTPs are house keys", text: "Passwords and OTPs are like house keys. Never share them — not even with someone who says they're 'customer care' or 'the bank.'" },
  { id: "online-5", theme: 4, emoji: "🎣", title: "Free coins are bait", text: "'Free coins! Free skins! Just click!' — that's how tricks look. Don't click. Show a grown-up instead." },
  { id: "online-6", theme: 4, emoji: "📸", title: "Screenshot, block, tell", text: "If anything online makes you feel weird or scared: screenshot, block, and tell your grown-up. You'll never be in trouble for telling." },
  // Theme 5 — Everyday smart
  { id: "smart-1", theme: 5, emoji: "🚪", title: "The door stays closed", text: "Home alone? The door stays closed. On the phone say 'Mum can't come to the phone right now' — never 'I'm alone.'" },
  { id: "smart-2", theme: 5, emoji: "📦", title: "Deliveries can wait", text: "Answer the door only with a grown-up's okay — even if the person says they're a delivery or repair person. Parcels are patient." },
  { id: "smart-3", theme: 5, emoji: "🚸", title: "Eyes up to cross", text: "Cross where you can see and be seen — and put the screen away while walking or crossing. Yes, this app too. We'll wait!" },
  { id: "smart-4", theme: 5, emoji: "🔥", title: "Out first", text: "Fire or smoke? Get out first, tell a grown-up, call 112. Things can be replaced. You can't." },
  { id: "smart-5", theme: 5, emoji: "🏪", title: "Two trusted adults", text: "Know two trusted adults outside your home you could go to — a neighbour aunty, a shopkeeper you know.", coCard: "Agree together who your child's two go-to adults outside home are, and tell those adults." },
];

export interface Scenario {
  id: string;
  theme: 1 | 2 | 3 | 4 | 5;
  emoji: string;
  title: string;
  setup: string;
  choices: { text: string; safe: boolean; feedback: string }[];
  rule: string; // the rule this scenario practises, named in feedback
}

/** Scenario pack seeds (PRD Appendix F). Wrong choices resolve as "that's what a tricky person might hope" — never a bad outcome shown. */
export const SCENARIOS: Scenario[] = [
  {
    id: "sc-lost-market",
    theme: 1,
    emoji: "🛒",
    title: "Lost in the market",
    setup: "You're at the big market with your grown-up. You look at a toy stall for a moment — and when you turn around, you can't see them anywhere. What do you do?",
    choices: [
      { text: "Stop, stay where I am, stand tall and look around", safe: true, feedback: "Yes! Rule one: stop and stay. You're easiest to find when you don't move. Standing tall helps you see — and be seen." },
      { text: "Run around the market looking for them", safe: false, feedback: "It's tempting — but if you both move, it's much harder to find each other. The strong move: stop, stay, stand tall." },
      { text: "Walk to the car park to wait", safe: false, feedback: "Leaving the place makes you harder to find. The strong move is to stay right where you got separated." },
    ],
    rule: "The lost-rules: stop and stay.",
  },
  {
    id: "sc-puppy",
    theme: 2,
    emoji: "🐕",
    title: "The lost puppy",
    setup: "A man at the park says he lost his puppy and asks YOU to come help look behind the trees. What do you do?",
    choices: [
      { text: "Say 'No — ask a grown-up!' and move away to my grown-up", safe: true, feedback: "Exactly right. Safe adults don't ask children for help — a grown-up who really lost a puppy asks other grown-ups. Saying no loudly is allowed and strong." },
      { text: "Help him — the puppy might be scared", safe: false, feedback: "You have a kind heart — and tricky people know that. That's what they hope a kind kid will do. The strong move: 'Ask a grown-up!' and go to yours." },
    ],
    rule: "Grown-ups ask grown-ups for help.",
  },
  {
    id: "sc-pickup",
    theme: 2,
    emoji: "🚗",
    title: "\"Your mum sent me\"",
    setup: "After school, a lady you don't know says: 'Your mum is busy — she sent me to pick you up. Come quickly!' What do you do?",
    choices: [
      { text: "Ask for the family code word", safe: true, feedback: "Perfect. No code word, no going — no matter what they say. And then tell a teacher straight away." },
      { text: "Go with her — she seems to know Mum", safe: false, feedback: "That's exactly what a tricky person hopes you'll think. The strong move: ask for the code word, and if there isn't one, stay and tell a teacher." },
      { text: "Stay put and tell my teacher", safe: true, feedback: "Great move. Check first, always — a teacher can call your mum and check for real." },
    ],
    rule: "Check first + the code word.",
  },
  {
    id: "sc-hug",
    theme: 3,
    emoji: "🤗",
    title: "The uncomfortable hug",
    setup: "At a family party, a relative you barely know wants a big hug. You don't feel like it. What do you do?",
    choices: [
      { text: "Offer a high-five or a wave instead", safe: true, feedback: "Your body, your choice — always. A high-five is friendly AND yours to give. Any good grown-up will be happy with it." },
      { text: "Hug them anyway so nobody is upset", safe: false, feedback: "Being polite is nice, but your body is YOURS. You're allowed to choose a high-five instead — that's not rude, that's your rule." },
    ],
    rule: "You can say no to hugs.",
  },
  {
    id: "sc-skins",
    theme: 4,
    emoji: "🎮",
    title: "Free skins!",
    setup: "While playing a game, a message pops up: 'FREE SKINS! Just enter your password here!' What do you do?",
    choices: [
      { text: "Don't click — show a grown-up", safe: true, feedback: "Spot on. 'Free stuff, just click' is how tricks dress up. Passwords are house keys — they never get shared." },
      { text: "Enter the password — it's just a game", safe: false, feedback: "That message is bait — that's exactly how tricks look. The strong move: don't click, show a grown-up, feel proud for spotting it." },
    ],
    rule: "Free-stuff pop-ups are bait; passwords are keys.",
  },
  {
    id: "sc-door",
    theme: 5,
    emoji: "🚪",
    title: "The knock at the door",
    setup: "You're home with your grown-up busy upstairs. Someone knocks: 'Delivery! Open up, I need a signature!' What do you do?",
    choices: [
      { text: "Keep the door closed and call my grown-up", safe: true, feedback: "Exactly. The door stays closed until a grown-up says okay. Real delivery people are happy to wait." },
      { text: "Open it — it's just a delivery", safe: false, feedback: "It probably is! But the rule keeps you safe every time: door stays closed, grown-up decides. Parcels are patient." },
    ],
    rule: "The door stays closed.",
  },
];

/** SRS safety-fact set (PRD Appendix F) — drilled to memory, not just shown. */
export interface SafetyFact {
  key: string;
  prompt: string; // the recall question
  needsSetup?: "phone" | "address"; // parent-entered, LOCAL ONLY, never leaves device
  fixed?: string; // authored answer for facts that need no setup
}

export const SAFETY_FACTS: SafetyFact[] = [
  { key: "phone", prompt: "Can you say your grown-up's phone number out loud?", needsSetup: "phone" },
  { key: "address", prompt: "Can you say your home area or address line?", needsSetup: "address" },
  { key: "emergency", prompt: "What number do you call in an emergency?", fixed: "112 — free from any phone." },
  {
    key: "lost-rules",
    prompt: "Say the five lost-rules!",
    fixed: "1. Stop and stay. 2. Stand tall and look. 3. Ask a mum with children or a uniformed worker at a counter. 4. Say your grown-up's name and number. 5. Never leave the place with anyone.",
  },
  { key: "codeword", prompt: "Does your family have a code word, and what's the rule?", fixed: "We have one and I know it. No code word — no going!" },
  { key: "underwear-rule", prompt: "What's the underwear rule?", fixed: "The parts under my underwear are private. Nobody looks, nobody touches, nobody asks." },
  { key: "secrets", prompt: "Surprises or secrets — which are okay?", fixed: "Surprises are okay — they get told soon. Secrets from my parents are not okay." },
];

/** Real-World Quests (PRD 6.2) — the only progress source requiring NO screen time. */
export interface Quest {
  id: string;
  emoji: string;
  title: string;
  text: string;
}

export const QUESTS: Quest[] = [
  { id: "q-teach-palace", emoji: "🏰", title: "Teach the palace", text: "Teach someone in your family the memory palace trick. Walk them through your house placing 5 things!" },
  { id: "q-real-chess", emoji: "♟️", title: "Real-board chess", text: "Play a game of chess with a real person on a real board. Winning is not the quest — playing is." },
  { id: "q-street-shops", emoji: "🏪", title: "Memorise your street", text: "Memorise the shops or houses on your street in order. Recite them at dinner!" },
  { id: "q-market-maths", emoji: "🥕", title: "Market maths", text: "At the market or shop, add up the prices in your head before the bill comes. How close were you?" },
  { id: "q-paper-tangram", emoji: "✂️", title: "Paper tangram", text: "Cut the seven tangram pieces out of paper and make an animal with your hands, not a screen." },
  { id: "q-teach-word", emoji: "📚", title: "Gift a word", text: "Teach your favourite new word to someone at home, and use it three times today — out loud!" },
  { id: "q-story-walk", emoji: "🌳", title: "Story walk", text: "On a walk, link 8 things you see into one silly story. Tell it to someone when you're back." },
  { id: "q-read-aloud", emoji: "📖", title: "Read to someone", text: "Read a page of any book out loud to someone in your family — with your best storytelling voice." },
];
