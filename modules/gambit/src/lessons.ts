/**
 * Lessons (Learn) — spec §2 "Learn", §8 ChessLesson. Short, kid-warm,
 * companion-narrated lessons authored for levels L0–L4. Each lesson is:
 *   concept  → a one-line idea in kid language
 *   example  → a worked position (FEN) with the move that shows the idea
 *   try-it   → a position the child acts on, plus the move that proves it
 *
 * Every FEN here is validated legal by chess.js in lessons.test.ts, and every
 * example/try-it move is validated legal from its FEN. Nothing free-generated:
 * these are authored, correct, and small. The companion (GuideBubble) narrates.
 */

export interface LessonStep {
  /** "concept" is text-only; "example" shows the move; "try" asks for the move. */
  kind: "concept" | "example" | "try";
  /** Kid-facing narration for this step. */
  text: string;
  /** Position for example/try steps (FEN). Absent for concept steps. */
  fen?: string;
  /** The move (SAN) — the one shown (example) or expected from the child (try). */
  move?: string;
  /** For "try" steps: a gentle hint if the child is stuck. */
  hint?: string;
}

export interface Lesson {
  id: string;
  /** The Path level this lesson belongs to (0..8). */
  level: number;
  /** Short concept id (matches conceptId in the data model). */
  conceptId: string;
  title: string;
  emoji: string;
  steps: LessonStep[];
}

export const LESSONS: Lesson[] = [
  /* ---------------------------- L0 · Board & Pieces ---------------------- */
  {
    id: "l0-rook",
    level: 0,
    conceptId: "rook-moves",
    title: "The Rook",
    emoji: "♜",
    steps: [
      {
        kind: "concept",
        text: "The rook moves in straight lines — up, down, left, and right, as far as it likes. Think of it as a train on rails!",
      },
      {
        kind: "example",
        text: "Watch: this rook slides all the way across the row to grab the pawn.",
        fen: "4k3/8/8/8/8/8/R5p1/4K3 w - - 0 1",
        move: "Rxg2",
      },
      {
        kind: "try",
        text: "Your turn! Slide your rook straight up to take the free pawn.",
        fen: "4k3/8/8/8/8/R7/p7/4K3 w - - 0 1",
        move: "Rxa2",
        hint: "Rooks go in straight lines. Send it down the a-file!",
      },
    ],
  },
  {
    id: "l0-bishop",
    level: 0,
    conceptId: "bishop-moves",
    title: "The Bishop",
    emoji: "♝",
    steps: [
      {
        kind: "concept",
        text: "The bishop moves in diagonals — always on the slant. Each bishop stays on one colour of square forever!",
      },
      {
        kind: "example",
        text: "See how the bishop travels along the diagonal to capture the pawn — and gives check too!",
        fen: "7k/6p1/8/8/8/8/1B6/4K3 w - - 0 1",
        move: "Bxg7+",
      },
      {
        kind: "try",
        text: "Now you: slide your bishop along the diagonal to win the pawn.",
        fen: "4k3/6p1/8/8/8/2B5/8/4K3 w - - 0 1",
        move: "Bxg7",
        hint: "Bishops move on the slant. Follow the diagonal up to the right.",
      },
    ],
  },
  {
    id: "l0-values",
    level: 0,
    conceptId: "piece-values",
    title: "How Much Is Each Piece Worth?",
    emoji: "💎",
    steps: [
      {
        kind: "concept",
        text: "Pieces have points: pawn = 1, knight and bishop = 3, rook = 5, queen = 9. The king is priceless — you can never lose it!",
      },
      {
        kind: "concept",
        text: "Counting points helps you decide trades. Winning a rook (5) for a bishop (3) is a great deal!",
      },
      {
        kind: "try",
        text: "The queen is worth the most. Take the free queen with your rook!",
        fen: "4k3/8/8/8/8/1q6/8/1R2K3 w - - 0 1",
        move: "Rxb3",
        hint: "Your rook and the queen share the b-file. Line up and take!",
      },
    ],
  },

  /* ------------------------------- L1 · Rules --------------------------- */
  {
    id: "l1-check",
    level: 1,
    conceptId: "check",
    title: "Check!",
    emoji: "⚠️",
    steps: [
      {
        kind: "concept",
        text: "When a piece attacks the enemy king, that's CHECK. The king must get to safety right away — you can never ignore a check.",
      },
      {
        kind: "example",
        text: "The rook slides over and says check! The king is under attack.",
        fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1",
        move: "Ra8+",
      },
      {
        kind: "try",
        text: "Give check with your rook — slide it up to attack the enemy king!",
        fen: "3k4/8/8/8/8/8/8/R3K3 w - - 0 1",
        move: "Ra8+",
        hint: "Send your rook all the way up its file to the enemy's back row — that attacks the king!",
      },
    ],
  },
  {
    id: "l1-castling",
    level: 1,
    conceptId: "castling",
    title: "Castling — King Safety",
    emoji: "🏰",
    steps: [
      {
        kind: "concept",
        text: "Castling is a special move: the king hops two squares toward a rook, and the rook jumps to the other side. It tucks your king away safe AND wakes up a rook — two jobs at once!",
      },
      {
        kind: "example",
        text: "Watch the king castle kingside. Safe king, active rook!",
        fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1",
        move: "O-O",
      },
      {
        kind: "try",
        text: "Your king and rook are ready. Castle kingside to get safe!",
        fen: "r3k3/8/8/8/8/8/8/4K2R w K - 0 1",
        move: "O-O",
        hint: "Castling kingside is written O-O. Move your king toward the h-rook.",
      },
    ],
  },
  {
    id: "l1-promotion",
    level: 1,
    conceptId: "promotion",
    title: "Pawns Become Queens",
    emoji: "👑",
    steps: [
      {
        kind: "concept",
        text: "If a pawn marches all the way to the far end of the board, it PROMOTES — it turns into any piece you want. Almost always, choose a queen!",
      },
      {
        kind: "example",
        text: "One step to glory — the pawn reaches the end and becomes a queen.",
        fen: "4k3/6P1/8/8/8/8/8/4K3 w - - 0 1",
        move: "g8=Q+",
      },
      {
        kind: "try",
        text: "Push your pawn to the last row and make a new queen!",
        fen: "4k3/2P5/8/8/8/8/8/4K3 w - - 0 1",
        move: "c8=Q+",
        hint: "March the c-pawn one square forward to the 8th rank and choose a queen.",
      },
    ],
  },

  /* -------------------------- L2 · Piece Safety ------------------------- */
  {
    id: "l2-is-it-safe",
    level: 2,
    conceptId: "is-it-safe",
    title: "Is My Piece Safe?",
    emoji: "🛡️",
    steps: [
      {
        kind: "concept",
        text: "Before every move, ask: is the square I'm landing on safe? A piece is safe if no enemy can take it for free.",
      },
      {
        kind: "example",
        text: "This knight grabs a pawn, stays totally safe, and even gives check!",
        fen: "4k3/8/5p2/3N4/8/8/8/4K3 w - - 0 1",
        move: "Nxf6+",
      },
      {
        kind: "try",
        text: "Take the pawn with your bishop — but only because it's a safe capture. Grab it!",
        fen: "4k3/8/8/8/5p2/8/8/2B1K3 w - - 0 1",
        move: "Bxf4",
        hint: "Follow the bishop's diagonal to the f4 pawn. Check first — nothing can take you back!",
      },
    ],
  },
  {
    id: "l2-dont-hang",
    level: 2,
    conceptId: "dont-hang",
    title: "Don't Leave Pieces Hanging",
    emoji: "🔓",
    steps: [
      {
        kind: "concept",
        text: "A piece is 'hanging' when an enemy can capture it for free. The blunder-check habit — is it safe? what can they take? — stops this. Do it EVERY move.",
      },
      {
        kind: "example",
        text: "Here the smart move wins the enemy queen with check — and keeps your own queen safe.",
        fen: "4k3/3q4/8/8/8/8/8/3QK3 w - - 0 1",
        move: "Qxd7+",
      },
      {
        kind: "try",
        text: "The enemy queen is attacking yours. Take it first — win the queen with check, keep yours safe!",
        fen: "4k3/8/8/4q3/8/8/8/4QK2 w - - 0 1",
        move: "Qxe5+",
        hint: "Your queen and the enemy queen share the e-file. Capture down the file with check!",
      },
    ],
  },

  /* --------------------------- L3 · Basic Tactics ---------------------- */
  {
    id: "l3-fork",
    level: 3,
    conceptId: "fork",
    title: "The Fork",
    emoji: "🍴",
    steps: [
      {
        kind: "concept",
        text: "A FORK is one piece attacking two things at once. The knight is the best forker — it can hit two pieces they can't both save!",
      },
      {
        kind: "example",
        text: "The knight leaps in and attacks the king AND the queen at the same time. They save the king, you grab the queen!",
        fen: "q3k3/8/8/3N4/8/8/8/4K3 w - - 0 1",
        move: "Nc7+",
      },
      {
        kind: "try",
        text: "Jump your knight in to fork the king and the queen. Find the check!",
        fen: "4k3/8/1q6/3N4/8/8/8/4K3 w - - 0 1",
        move: "Nc7+",
        hint: "Land your knight where it checks the king and hits the queen too.",
      },
    ],
  },
  {
    id: "l3-pin",
    level: 3,
    conceptId: "pin",
    title: "The Pin",
    emoji: "📌",
    steps: [
      {
        kind: "concept",
        text: "A PIN freezes a piece: it can't move because something more valuable is right behind it. Then you can win the pinned piece!",
      },
      {
        kind: "example",
        text: "The queen is pinned against its own king — it can't run. Take it!",
        fen: "4k3/8/8/4q3/8/8/8/4RK2 w - - 0 1",
        move: "Rxe5+",
      },
      {
        kind: "try",
        text: "That rook is pinned to the king and can't escape. Win it!",
        fen: "4k3/8/8/8/4r3/8/8/4RK2 w - - 0 1",
        move: "Rxe4+",
        hint: "Line your rook up on the enemy rook — the king behind it means it can't run.",
      },
    ],
  },
  {
    id: "l3-skewer",
    level: 3,
    conceptId: "skewer",
    title: "The Skewer",
    emoji: "🍢",
    steps: [
      {
        kind: "concept",
        text: "A SKEWER is like a pin flipped around: attack a valuable piece so when it moves out of the way, you win the piece behind it.",
      },
      {
        kind: "example",
        text: "Check the king — when it steps aside, the queen behind falls.",
        fen: "1q5k/8/8/8/8/8/8/1R5K w - - 0 1",
        move: "Rxb8+",
      },
      {
        kind: "try",
        text: "Line up on the king with check, and win the queen behind it!",
        fen: "6qk/8/8/8/8/8/8/6RK w - - 0 1",
        move: "Rxg8+",
        hint: "Attack along the file where the king and queen line up.",
      },
    ],
  },

  /* ---------------------------- L4 · Checkmates ------------------------ */
  {
    id: "l4-backrank",
    level: 4,
    conceptId: "back-rank-mate",
    title: "Back-Rank Mate",
    emoji: "🚪",
    steps: [
      {
        kind: "concept",
        text: "A king hiding behind its own pawns can get trapped on the back row. A rook or queen sliding to that row is checkmate — the pawns block the king's escape!",
      },
      {
        kind: "example",
        text: "The rook zooms to the back rank. The king is boxed in by its own pawns — checkmate!",
        fen: "6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1",
        move: "Ra8#",
      },
      {
        kind: "try",
        text: "Deliver the back-rank checkmate with your rook!",
        fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
        move: "Re8#",
        hint: "Slide your rook to the enemy's back row. The pawns trap the king.",
      },
    ],
  },
  {
    id: "l4-kq-mate",
    level: 4,
    conceptId: "kq-mate",
    title: "King + Queen Checkmate",
    emoji: "👑",
    steps: [
      {
        kind: "concept",
        text: "With a king and queen you can checkmate a lone king. Use the queen to trap the king at the edge, and your OWN king to guard the queen. Never stalemate — always leave the king a legal move until it's mate!",
      },
      {
        kind: "example",
        text: "The king guards the queen, and the queen delivers mate in the corner.",
        fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
        move: "Qg7#",
      },
      {
        kind: "try",
        text: "Your king protects the queen. Step the queen in for checkmate!",
        fen: "6k1/5Q2/6K1/8/8/8/8/8 w - - 0 1",
        move: "Qg7#",
        hint: "Move the queen right next to the enemy king — your king guards it from behind.",
      },
    ],
  },
];

/** All lessons for a Path level, in authored order. */
export function lessonsForLevel(level: number): Lesson[] {
  return LESSONS.filter((l) => l.level === level);
}

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
