/**
 * session — small, neutral session helpers.
 *
 * Reading time is reported plainly, never as a score to beat. The review line
 * comes from the AI gateway when it can, with a warm deterministic fallback so
 * the child always gets a kind, specific sentence.
 */

import type { ModuleContext } from "@loci/module-sdk";

/** A calm, non-gamified phrasing of how long the reading took. */
export function readingTimeLabel(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  if (totalSeconds < 60) {
    return `You spent about ${totalSeconds} second${totalSeconds === 1 ? "" : "s"} reading.`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (seconds === 0) {
    return `You spent about ${minutes} minute${minutes === 1 ? "" : "s"} reading.`;
  }
  return `You spent about ${minutes} min ${seconds} sec reading.`;
}

/** A steady, encouraging line built only from what we know locally. */
export function fallbackReview(title: string, correct: number, asked: number): string {
  if (asked === 0) return `Lovely time with "${title}." Good readers enjoy the story first.`;
  if (correct === asked) {
    return `You read "${title}" closely and caught every detail. That's careful reading!`;
  }
  if (correct >= Math.ceil(asked / 2)) {
    return `Nice work on "${title}." Checking back in the text is exactly what good readers do.`;
  }
  return `"${title}" was a rich one. Peeking again at the words is a smart reading move — keep it up!`;
}

/**
 * Ask the gateway for a one-line session review, falling back to a warm
 * deterministic sentence. Never throws; always resolves to a friendly string.
 */
export async function sessionReview(
  ctx: ModuleContext,
  title: string,
  correct: number,
  asked: number
): Promise<string> {
  const local = fallbackReview(title, correct, asked);
  try {
    const r = await ctx.ai.review({
      task: "focusread.review",
      context: { title, correct, asked },
    });
    return r.text?.trim() ? r.text.trim() : local;
  } catch {
    return local;
  }
}
