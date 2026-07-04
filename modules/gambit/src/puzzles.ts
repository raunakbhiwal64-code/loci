/**
 * Curated Gambit puzzles — authored as FEN + first-move solution, one per teach-
 * able idea across belts 1–5. EVERY puzzle here is validated programmatically in
 * puzzles.test.ts against chess.js (legal first move; mates give mate; tactics
 * win the stated material). Prefer fewer-but-correct over many-but-wrong.
 *
 * `type` drives how the test validates and how the UI frames the ask.
 */

export type PuzzleType =
  | "capture" // grab free material
  | "mate1" // checkmate in one move
  | "mate2" // checkmate in two (only the first move is checked as forcing)
  | "escape" // get out of check
  | "fork"
  | "pin"
  | "skewer"
  | "discovered";

export type Belt = 1 | 2 | 3 | 4 | 5;

export interface Puzzle {
  id: string;
  belt: Belt;
  type: PuzzleType;
  fen: string;
  /** Solution move(s) in SAN. The FIRST is the key move the test validates. */
  solution: string[];
  /** Kid-facing prompt. */
  ask: string;
  /** Minimum material (in points) the solving side should net, for tactic types. */
  wins?: number;
}

export const PUZZLES: Puzzle[] = [
  /* ---------------- Belt 1 — Pieces & powers (Capture Quest) --------------- */
  {
    id: "b1-cap-pawn",
    belt: 1,
    type: "capture",
    fen: "4k3/8/8/8/8/4p3/3P4/4K3 w - - 0 1",
    solution: ["dxe3"],
    ask: "Snap up the free pawn — how does your pawn capture?",
    wins: 1,
  },
  {
    id: "b1-cap-bishop",
    belt: 1,
    type: "capture",
    fen: "4k3/8/8/8/2b5/3P4/8/4K3 w - - 0 1",
    solution: ["dxc4"],
    ask: "A lonely bishop! Grab it with your pawn.",
    wins: 3,
  },
  {
    id: "b1-cap-rook",
    belt: 1,
    type: "capture",
    fen: "4k3/8/8/8/8/8/r7/R3K3 w - - 0 1",
    solution: ["Rxa2"],
    ask: "Rook takes rook — win the piece.",
    wins: 5,
  },
  {
    id: "b1-cap-freebishop",
    belt: 1,
    type: "capture",
    fen: "rnbqkbnr/pppp1ppp/8/4p3/2b1P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
    solution: ["Bxc4"],
    ask: "That bishop wandered too far. Take it for free!",
    wins: 3,
  },

  /* ---------------- Belt 2 — Rules of the game ---------------------------- */
  {
    id: "b2-escape-capture",
    belt: 2,
    type: "escape",
    fen: "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1",
    solution: ["Kxe2"],
    ask: "You're in check! Best of all — capture the attacker.",
    wins: 5,
  },
  {
    id: "b2-mate-promote-idea",
    belt: 2,
    type: "capture",
    fen: "4k3/8/8/8/8/8/6P1/4K3 w - - 0 1",
    // Not a capture — but a legal pawn push toward promotion; validated as legal only.
    solution: ["g4"],
    ask: "March a pawn forward — pawns dream of becoming queens!",
  },
  {
    id: "b2-escape-block-or-run",
    belt: 2,
    type: "escape",
    fen: "6k1/8/8/8/8/8/5q2/6K1 w - - 0 1",
    solution: ["Kh1"],
    ask: "The queen checks your king. Step to safety.",
  },

  /* ---------------- Belt 3 — Baby tactics -------------------------------- */
  {
    id: "b3-hang-free-queen",
    belt: 3,
    type: "capture",
    fen: "rnb1kbnr/pppp1ppp/8/4p3/6q1/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 1",
    solution: ["fxg4"],
    ask: "The enemy queen is undefended! Win it with a pawn.",
    wins: 9,
  },
  {
    id: "b3-count-take",
    belt: 3,
    type: "capture",
    fen: "4k3/8/8/8/8/4p3/3PP3/4K3 w - - 0 1",
    solution: ["dxe3"],
    ask: "Count the guards, then take the pawn you can win.",
    wins: 1,
  },
  {
    id: "b3-escape-king",
    belt: 3,
    type: "escape",
    fen: "2k3r1/8/8/8/8/8/8/6K1 w - - 0 1",
    solution: ["Kf1"],
    ask: "Check! Walk your king to a safe square.",
  },

  /* ---------------- Belt 4 — The big four tactics ------------------------ */
  {
    id: "b4-fork-knight-KQ",
    belt: 4,
    type: "fork",
    fen: "q3k3/8/8/3N4/8/8/8/4K3 w - - 0 1",
    solution: ["Nc7+"],
    ask: "A knight fork! Check the king and hit the queen at once.",
    wins: 9,
  },
  {
    id: "b4-fork-knight-1",
    belt: 4,
    type: "fork",
    fen: "4k3/8/8/3q4/8/2N5/8/4K3 w - - 0 1",
    solution: ["Nxd5"],
    ask: "Your knight can leap in and win the queen. Find it!",
    wins: 9,
  },
  {
    id: "b4-fork-knight-2",
    belt: 4,
    type: "fork",
    fen: "4k3/8/4q3/8/5N2/8/8/4K3 w - - 0 1",
    solution: ["Nxe6"],
    ask: "Jump the knight in to snatch the queen.",
    wins: 9,
  },
  {
    id: "b4-pin-win-queen",
    belt: 4,
    type: "pin",
    fen: "4k3/8/8/4q3/8/8/8/4RK2 w - - 0 1",
    solution: ["Rxe5+"],
    ask: "The queen is pinned to the king — take it!",
    wins: 9,
  },
  {
    id: "b4-pin-win-rook",
    belt: 4,
    type: "pin",
    fen: "4k3/8/8/8/4r3/8/8/4RK2 w - - 0 1",
    solution: ["Rxe4+"],
    ask: "That rook can't run — it's pinned. Win it.",
    wins: 5,
  },
  {
    id: "b4-skewer-queen",
    belt: 4,
    type: "skewer",
    fen: "1q5k/8/8/8/8/8/8/1R5K w - - 0 1",
    solution: ["Rxb8+"],
    ask: "Line up on the queen and win it with check.",
    wins: 9,
  },
  {
    id: "b4-discovered-check",
    belt: 4,
    type: "discovered",
    fen: "4k3/1q6/8/8/4N3/8/8/4R1K1 w - - 0 1",
    solution: ["Nc5+"],
    ask: "Move the knight to unveil a check — and attack the queen too!",
    wins: 9,
  },
  {
    id: "b4-discovered-grab",
    belt: 4,
    type: "discovered",
    fen: "4k3/8/8/8/8/2q5/4N3/4R1K1 w - - 0 1",
    solution: ["Nxc3+"],
    ask: "Snatch the queen with your knight — and reveal a rook check at the same time!",
    wins: 9,
  },
  {
    id: "b4-skewer-corner",
    belt: 4,
    type: "skewer",
    fen: "k6q/8/8/8/8/8/8/6KR w - - 0 1",
    solution: ["Rxh8+"],
    ask: "Line your rook up on the queen across the board and win it with check.",
    wins: 9,
  },

  /* ---------------- Belt 5 — Checkmates ---------------------------------- */
  {
    id: "b5-backrank-1",
    belt: 5,
    type: "mate1",
    fen: "6k1/5ppp/8/8/8/8/8/R3K2R w - - 0 1",
    solution: ["Ra8#"],
    ask: "Back-rank mate! The king is trapped by its own pawns.",
  },
  {
    id: "b5-backrank-2",
    belt: 5,
    type: "mate1",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    solution: ["Re8#"],
    ask: "Slide the rook home for checkmate.",
  },
  {
    id: "b5-backrank-3",
    belt: 5,
    type: "mate1",
    fen: "2r3k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1",
    solution: ["Rxc8#"],
    ask: "Take and checkmate on the back rank!",
  },
  {
    id: "b5-rook-mate",
    belt: 5,
    type: "mate1",
    fen: "3r2k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1",
    solution: ["Rxd8#"],
    ask: "Capture and deliver mate.",
  },
  {
    id: "b5-scholars",
    belt: 5,
    type: "mate1",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1",
    solution: ["Qxf7#"],
    ask: "The Scholar's Mate — find the checkmate on f7.",
  },
  {
    id: "b5-corner-mate",
    belt: 5,
    type: "mate1",
    fen: "7k/6pp/8/8/8/8/8/R6K w - - 0 1",
    solution: ["Ra8#"],
    ask: "Trap the cornered king with your rook.",
  },
  {
    id: "b5-kr-mate",
    belt: 5,
    type: "mate1",
    fen: "k7/8/1K6/8/8/8/8/7R w - - 0 1",
    solution: ["Rh8#"],
    ask: "King and rook working together — deliver mate.",
  },
  {
    id: "b5-queen-mate",
    belt: 5,
    type: "mate1",
    fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
    solution: ["Qg7#"],
    ask: "Your king guards the queen. Finish the mate!",
  },
  {
    id: "b5-mate-in-2-a",
    belt: 5,
    type: "mate2",
    fen: "6k1/8/6K1/8/8/8/3Q4/8 w - - 0 1",
    solution: ["Qb4"],
    ask: "Mate in two! Box the king in, then finish next move.",
  },
  {
    id: "b5-mate-in-2-b",
    belt: 5,
    type: "mate2",
    fen: "5k2/8/5K2/8/8/8/8/1Q6 w - - 0 1",
    solution: ["Qb7"],
    ask: "Two moves to mate. Squeeze the king to the edge first.",
  },
];

/** All puzzles for a belt. */
export function puzzlesForBelt(belt: Belt): Puzzle[] {
  return PUZZLES.filter((p) => p.belt === belt);
}

/** Deterministic daily puzzle: pick by date so everyone gets the same one. */
export function dailyPuzzle(dateKey: string): Puzzle {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) h = (h * 31 + dateKey.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % PUZZLES.length;
  return PUZZLES[idx];
}

export function puzzleById(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}
