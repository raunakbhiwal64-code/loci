/**
 * Validates every authored lesson against chess.js so nothing incorrect ships:
 *  - each level L0–L4 has at least one lesson;
 *  - lesson ids are unique;
 *  - every example/try FEN is a legal position;
 *  - every example/try move is legal from its FEN;
 *  - every "try" step has a hint (the child can get unstuck);
 *  - checkmate moves (SAN ends in #) actually deliver mate;
 *  - check moves (SAN ends in +) actually give check.
 */
import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { LESSONS, lessonsForLevel, lessonById } from "./lessons.js";

describe("Gambit lessons", () => {
  it("covers levels L0–L4", () => {
    for (const level of [0, 1, 2, 3, 4]) {
      expect(lessonsForLevel(level).length, `level ${level} has lessons`).toBeGreaterThan(0);
    }
  });

  it("has unique ids", () => {
    const ids = new Set(LESSONS.map((l) => l.id));
    expect(ids.size).toBe(LESSONS.length);
  });

  it("lookup by id works", () => {
    for (const l of LESSONS) expect(lessonById(l.id)).toBe(l);
  });

  for (const lesson of LESSONS) {
    describe(`${lesson.id} (L${lesson.level})`, () => {
      it("has a concept and at least one actionable step", () => {
        expect(lesson.steps.some((s) => s.kind === "concept")).toBe(true);
        expect(lesson.steps.some((s) => s.kind === "example" || s.kind === "try")).toBe(true);
      });

      for (let i = 0; i < lesson.steps.length; i++) {
        const step = lesson.steps[i];
        if (step.kind === "concept") {
          it(`step ${i + 1} concept has text`, () => {
            expect(step.text.trim().length).toBeGreaterThan(0);
            expect(step.fen).toBeUndefined();
          });
          continue;
        }

        it(`step ${i + 1} (${step.kind}) has a legal FEN and a legal move`, () => {
          expect(step.fen, "actionable step needs a FEN").toBeTruthy();
          expect(step.move, "actionable step needs a move").toBeTruthy();
          const game = new Chess(step.fen!);
          expect(game.moves(), `move ${step.move} must be legal`).toContain(step.move!);
        });

        if (step.kind === "try") {
          it(`step ${i + 1} try has a hint`, () => {
            expect(step.hint && step.hint.trim().length).toBeTruthy();
          });
        }

        if (step.move?.includes("#")) {
          it(`step ${i + 1} move delivers checkmate`, () => {
            const game = new Chess(step.fen!);
            game.move(step.move!);
            expect(game.isCheckmate()).toBe(true);
          });
        } else if (step.move?.includes("+")) {
          it(`step ${i + 1} move gives check`, () => {
            const game = new Chess(step.fen!);
            game.move(step.move!);
            expect(game.isCheck()).toBe(true);
          });
        }
      }
    });
  }
});
