/**
 * Every authored replay game must replay LEGALLY with chess.js: each move is
 * legal from the position it reaches, and the final position is therefore
 * reachable. Games claiming a checkmate must actually deliver it. This is the
 * guarantee that Annotated Replay never ships illegal or wrong content.
 */
import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { REPLAY_GAMES, replayThemes, gamesForTheme, replayGameById } from "./games.js";

describe("annotated replay games", () => {
  it("has at least two authored games grouped by theme", () => {
    expect(REPLAY_GAMES.length).toBeGreaterThanOrEqual(2);
    expect(replayThemes().length).toBeGreaterThanOrEqual(2);
  });

  it("has unique ids", () => {
    const ids = new Set(REPLAY_GAMES.map((g) => g.id));
    expect(ids.size).toBe(REPLAY_GAMES.length);
  });

  it("themes and lookups are consistent", () => {
    for (const theme of replayThemes()) {
      expect(gamesForTheme(theme).length).toBeGreaterThan(0);
    }
    for (const g of REPLAY_GAMES) {
      expect(replayGameById(g.id)).toBe(g);
    }
  });

  for (const game of REPLAY_GAMES) {
    describe(`${game.id} (${game.theme})`, () => {
      it("replays every move legally from the start", () => {
        const chess = new Chess();
        for (let i = 0; i < game.moves.length; i++) {
          const step = game.moves[i];
          const legal = chess.moves();
          expect(legal, `move ${i + 1} "${step.san}" must be legal`).toContain(step.san);
          expect(() => chess.move(step.san)).not.toThrow();
        }
      });

      it("every move has a non-empty authored purpose note", () => {
        for (const m of game.moves) {
          expect(m.note.trim().length).toBeGreaterThan(0);
        }
      });

      it("if the last move is a checkmate SAN (#), the game is actually mate", () => {
        const chess = new Chess();
        for (const m of game.moves) chess.move(m.san);
        const last = game.moves[game.moves.length - 1];
        if (last.san.includes("#")) {
          expect(chess.isCheckmate()).toBe(true);
        }
      });

      it("has at least one pause-and-predict move", () => {
        expect(game.moves.some((m) => m.predict === true)).toBe(true);
      });
    });
  }
});
