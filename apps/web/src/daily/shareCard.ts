/**
 * Share-card mechanics (PRD Section 2). Parent-mediated: the child earns the
 * result, the parent shares it. Spoiler-free glyph grid + one line of copy,
 * a deep link into today's challenge, via the Web Share API with a
 * copy-to-clipboard fallback (WhatsApp / family chats are the expected channel).
 * No child personal data leaves the device except the parent-entered name.
 */

export function glyphGrid(correct: number, total: number): string {
  const cols = 5;
  const cells = Array.from({ length: total }, (_, i) => (i < correct ? "🟩" : "⬜"));
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += cols) rows.push(cells.slice(i, i + cols).join(""));
  return rows.join("\n");
}

export function deepLink(dateKey: string): string {
  const base = typeof location !== "undefined" ? location.origin : "https://loci.app";
  return `${base}/?daily=${dateKey}`;
}

export interface ShareInput {
  displayName: string;
  correct: number;
  total: number;
  dateKey: string;
}

export function buildShareText({ displayName, correct, total, dateKey }: ShareInput): string {
  return [
    `${displayName} did the Loci daily challenge!`,
    ``,
    glyphGrid(correct, total),
    ``,
    `Remembered ${correct}/${total} — can you beat it?`,
    deepLink(dateKey),
  ].join("\n");
}

/** Returns "shared" | "copied" | "cancelled". */
export async function shareResult(input: ShareInput): Promise<"shared" | "copied" | "cancelled"> {
  const text = buildShareText(input);
  const nav = navigator as Navigator & { share?: (d: { text: string; title?: string }) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ title: "Loci daily challenge", text });
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "cancelled";
  }
}
