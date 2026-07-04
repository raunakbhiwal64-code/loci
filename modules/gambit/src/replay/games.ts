/**
 * Curated complete games for Annotated Game Replay (the Chernev mode, PRD 4.2).
 * Each game is a short, CORRECT sequence of SAN moves with a per-move authored
 * one-line PURPOSE annotation in child language, grouped by a theme. Every game
 * is validated to replay legally with chess.js in replay.test.ts (each move is
 * legal from the resulting position; the final position is reachable), so no
 * illegal or free-generated content ever ships.
 *
 * Annotations are authored (never model-generated) so they are always correct.
 * The `predict` flag marks moves worth a pause-and-predict ("what would you
 * play here?") before revealing the played move and its purpose.
 */

/** Which side is to move for a given step (derived, but stored for clarity). */
export type Side = "w" | "b";

export interface ReplayMove {
  /** The move in SAN, exactly as chess.js accepts it. */
  san: string;
  /** Authored, correct, kid-language explanation of this move's PURPOSE. */
  note: string;
  /** If true, offer pause-and-predict before revealing this move. */
  predict?: boolean;
}

export interface ReplayGame {
  id: string;
  /** Chernev-style theme grouping. */
  theme: string;
  title: string;
  emoji: string;
  /** One-line kid-facing description shown on the index tile. */
  blurb: string;
  /** The complete game, White and Black moves interleaved. */
  moves: ReplayMove[];
  /** A warm closing line shown when the replay finishes. */
  outro: string;
}

export const REPLAY_GAMES: ReplayGame[] = [
  /* ------------------------------ Kingside attack ------------------------- */
  {
    id: "scholars-mate",
    theme: "A quick attack",
    title: "The Four-Move Checkmate",
    emoji: "⚡",
    blurb: "See how a fast attack on f7 can end the game — and how to spot it.",
    outro:
      "That's the Scholar's Mate! It works when the other side forgets to guard f7. Now you know it, you can attack it AND defend against it.",
    moves: [
      { san: "e4", note: "White grabs the centre and opens paths for the queen and bishop. Almost every plan starts with a centre pawn." },
      { san: "e5", note: "Black answers in the centre too — meeting a centre pawn with a centre pawn is fair and strong." },
      { san: "Bc4", note: "The bishop develops and aims straight at f7 — the weakest square near Black's king." },
      { san: "Nc6", note: "Black develops a knight toward the centre, guarding e5. Good — but it does nothing about f7." },
      { san: "Qh5", note: "The queen comes out early and joins the bishop in aiming at f7. Two attackers on one weak spot!", predict: true },
      { san: "Nf6", note: "Black develops the other knight — but this attacks the queen instead of defending f7. The danger is missed." },
      { san: "Qxf7#", note: "Checkmate! The queen takes f7, guarded by the bishop, and the king has no escape. Always check what your opponent is threatening." },
    ],
  },

  /* ------------------------------ Piece sacrifice ------------------------- */
  {
    id: "legall-mate",
    theme: "A quick attack",
    title: "Légal's Mate — a famous trap",
    emoji: "🎩",
    blurb: "A daring knight leap ignores the queen to deliver a checkmate. Watch closely!",
    outro:
      "Légal's Mate! White gave up the queen because three little pieces worked together for checkmate. Piece teamwork can beat a lone queen.",
    moves: [
      { san: "e4", note: "White takes the centre and frees the bishop and queen. A classic first move." },
      { san: "e5", note: "Black stakes a claim in the centre right back." },
      { san: "Nf3", note: "The knight develops and attacks the e5 pawn. Develop pieces AND make a threat when you can." },
      { san: "d6", note: "Black defends the e5 pawn. Safe, but a little passive." },
      { san: "Bc4", note: "White develops the bishop toward f7 — the target square again." },
      { san: "Bg4", note: "Black pins White's knight to the queen. A clever idea, but it will backfire here." },
      { san: "Nc3", note: "White quietly develops another piece and gets ready for the trick to come." },
      { san: "g6", note: "Black weakens the kingside, not seeing the storm coming." },
      { san: "Nxe5", note: "The knight grabs the pawn and IGNORES the pin — White is happy to give up the queen!", predict: true },
      { san: "Bxd1", note: "Black takes the queen, thinking they've won big. But watch what three pieces can do…" },
      { san: "Bxf7+", note: "The bishop checks the king with support. The king must move — right into the net." },
      { san: "Ke7", note: "The king steps up, the only square available. Now the final blow lands." },
      { san: "Nd5#", note: "Checkmate! The knights and bishop trap the king together. Teamwork beat the queen." },
    ],
  },

  /* ------------------------------ Control the centre --------------------- */
  {
    id: "centre-squeeze",
    theme: "Control the centre",
    title: "Building a strong centre",
    emoji: "🎯",
    blurb: "No fireworks — just calm, strong moves that take over the middle of the board.",
    outro:
      "No checkmate here — just healthy development and a strong centre. This is how good players build a winning position: one solid move at a time.",
    moves: [
      { san: "d4", note: "White claims the centre with a pawn. Central pawns give your pieces more room to work." },
      { san: "d5", note: "Black meets it head-on, planting a pawn in the centre too." },
      { san: "c4", note: "White offers a second pawn to challenge Black's centre and grab even more space." },
      { san: "e6", note: "Black supports the d5 pawn with another pawn — building a firm centre." },
      { san: "Nc3", note: "White develops a knight, adding pressure on the centre square d5." },
      { san: "Nf6", note: "Black develops a knight to defend d5 and control the centre. Knights belong near the middle." },
      { san: "Bg5", note: "The bishop develops actively, pinning the knight and eyeing the centre.", predict: true },
      { san: "Be7", note: "Black develops and breaks the pin, getting ready to castle. Safety first." },
      { san: "e3", note: "White opens a path for the last bishop. Every piece needs a job." },
      { san: "O-O", note: "Black castles — the king is safe and the rook joins the game. A super-important habit!" },
      { san: "Nf3", note: "White develops the knight toward the centre, almost ready to castle too." },
      { san: "b6", note: "Black prepares to fianchetto the bishop, aiming it at the long diagonal and the centre." },
    ],
  },
];

/** All distinct themes, in first-seen order. */
export function replayThemes(): string[] {
  const seen: string[] = [];
  for (const g of REPLAY_GAMES) if (!seen.includes(g.theme)) seen.push(g.theme);
  return seen;
}

export function gamesForTheme(theme: string): ReplayGame[] {
  return REPLAY_GAMES.filter((g) => g.theme === theme);
}

export function replayGameById(id: string): ReplayGame | undefined {
  return REPLAY_GAMES.find((g) => g.id === id);
}
