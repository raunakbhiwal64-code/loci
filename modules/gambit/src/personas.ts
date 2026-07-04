/**
 * Bot personas — three named, emoji-badged opponents of increasing strength.
 * "Plausible mistakes" (Lotus-style) means a persona sometimes picks the 2nd or
 * 3rd BEST move instead of the best — never a random blunder. Weaker personas
 * search shallower AND slip more often, so they feel human, not broken.
 */
import { Chess } from "chess.js";
import { rankMoves } from "./engine.js";

export interface Persona {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  /** Search depth 1..3. */
  depth: number;
  /**
   * Probability of NOT playing the top move. When it slips it prefers the
   * 2nd-best, occasionally the 3rd-best — always a legal, plausible move.
   */
  mistakeChance: number;
}

export const PERSONAS: Persona[] = [
  {
    id: "pip",
    name: "Pip the Pigeon",
    emoji: "🐦",
    blurb: "Just learning! Pip flaps around and misses things a lot.",
    depth: 1,
    mistakeChance: 0.55,
  },
  {
    id: "rex",
    name: "Rex the Raccoon",
    emoji: "🦝",
    blurb: "Crafty and quick. Rex sees traps but still trips sometimes.",
    depth: 2,
    mistakeChance: 0.28,
  },
  {
    id: "vizier",
    name: "Vizier the Owl",
    emoji: "🦉",
    blurb: "Wise and patient. Vizier thinks ahead and rarely blunders.",
    depth: 3,
    mistakeChance: 0.08,
  },
];

export function personaById(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

/**
 * Deterministic pseudo-random in [0,1) from a seed. Keeps bot play reproducible
 * for a given (position, move-count) so tests and replays are stable.
 */
function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Choose the persona's move for the current position. Returns null if no legal
 * moves. Uses the persona's depth to rank, then applies its mistake chance to
 * pick a slightly-worse-but-plausible move. Deterministic given the position.
 */
export function personaMove(game: Chess, persona: Persona): string | null {
  const ranked = rankMoves(game, persona.depth);
  if (ranked.length === 0) return null;
  if (ranked.length === 1) return ranked[0].san;

  // Seed from ply count so the same position after the same history is stable,
  // but different positions vary. Uses history length as a cheap ply counter.
  const seed = game.history().length + ranked.length;
  const roll = seededUnit(seed);

  if (roll >= persona.mistakeChance) return ranked[0].san;

  // It slipped: pick 2nd-best, or 3rd-best on a deeper slip. Never pick a move
  // that throws away more than a rook vs the best — keep it plausible.
  const second = ranked[1];
  const third = ranked[2];
  const bestScore = ranked[0].score;
  const plausible = (m: { score: number } | undefined) => m && bestScore - m.score <= 500;

  const deepSlip = seededUnit(seed + 1) < 0.35;
  if (deepSlip && plausible(third)) return third!.san;
  if (plausible(second)) return second!.san;
  return ranked[0].san;
}
