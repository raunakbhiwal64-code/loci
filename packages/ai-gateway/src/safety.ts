/**
 * The safety filter — the single choke point on every string a child can see,
 * regardless of AI tier (PRD 5.5). Deterministic-first. Ships with an
 * adversarial test suite (see safety.test.ts) that runs in CI.
 */

export interface SafetyContext {
  /** Profile display name and any stored profile fields, for the echo check. */
  profileFields: string[];
  /** Whether this task template is explicitly allowed to use the display name. */
  allowDisplayName?: boolean;
}

export interface SafetyResult {
  ok: boolean;
  reason?: string;
}

// Deterministic blocklist / pattern pass (profanity, violence, self-harm,
// romance, contact-seeking, URLs, phone-like and email-like strings).
const BLOCK_PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /\bhttps?:\/\/|www\.[a-z0-9]/i, reason: "url" },
  { re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, reason: "email" },
  { re: /(?:\+?\d[\s-]?){7,}/, reason: "phone-like" },
  { re: /\b(kill|die|suicide|self[-\s]?harm|hurt yourself)\b/i, reason: "self-harm-violence" },
  { re: /\b(sex|sexy|kiss|boyfriend|girlfriend|dating|nude)\b/i, reason: "romance-adult" },
  { re: /\b(address|where do you live|meet me|send me|your phone|your number)\b/i, reason: "contact-seeking" },
  { re: /\b(f[u*]ck|sh[i*]t|b[i*]tch|damn|crap)\b/i, reason: "profanity" },
];

/** Check generated text before a child sees it. */
export function checkOutput(text: string, ctx: SafetyContext): SafetyResult {
  for (const { re, reason } of BLOCK_PATTERNS) {
    if (re.test(text)) return { ok: false, reason };
  }
  // Personal-data echo check: output must not contain stored profile fields
  // unless the template explicitly allows the display name.
  const [displayName, ...otherFields] = ctx.profileFields;
  for (const field of otherFields) {
    if (field && text.toLowerCase().includes(field.toLowerCase())) {
      return { ok: false, reason: "pii-echo" };
    }
  }
  if (!ctx.allowDisplayName && displayName && text.toLowerCase().includes(displayName.toLowerCase())) {
    return { ok: false, reason: "pii-echo-name" };
  }
  return { ok: true };
}

/**
 * Input scoping: free-form child text is never forwarded as an open prompt.
 * A task id must be a known template key.
 */
export function isKnownTask(task: string, known: ReadonlySet<string>): boolean {
  return known.has(task);
}
