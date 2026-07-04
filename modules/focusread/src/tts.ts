/**
 * tts — a tiny, feature-detected wrapper around window.speechSynthesis so a
 * passage can be read aloud for children who like to listen along.
 *
 * Everything here is a graceful no-op when speech synthesis is unavailable
 * (older browsers, test environments), so callers never need to guard.
 */

function synth(): SpeechSynthesis | undefined {
  if (typeof window === "undefined") return undefined;
  return window.speechSynthesis ?? undefined;
}

/** True when the browser can read text aloud. */
export function canSpeak(): boolean {
  return synth() !== undefined && typeof SpeechSynthesisUtterance !== "undefined";
}

/** Stop anything currently being read. Safe to call anytime. */
export function stopReading(): void {
  const s = synth();
  if (s) s.cancel();
}

export interface ReadOptions {
  /** Called once when speech finishes or is cancelled. */
  onDone?: () => void;
}

/**
 * Read a passage aloud in a calm, child-friendly cadence. Cancels any prior
 * utterance first. Returns a stop function; calling it also fires onDone.
 */
export function readAloud(text: string, opts: ReadOptions = {}): () => void {
  const s = synth();
  if (!s || typeof SpeechSynthesisUtterance === "undefined" || !text.trim()) {
    opts.onDone?.();
    return () => {};
  }

  s.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.92; // a shade slower — easy to follow along
  u.pitch = 1.05;
  u.lang = "en";

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    opts.onDone?.();
  };
  u.onend = finish;
  u.onerror = finish;

  s.speak(u);

  return () => {
    s.cancel();
    finish();
  };
}
