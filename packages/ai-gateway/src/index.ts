import type {
  AIProvider,
  AIResult,
  AnalyticsApi,
  ExplainRequest,
  GenerateRequest,
  HintRequest,
  ReviewRequest,
} from "@loci/module-sdk";
import { checkOutput, isKnownTask, type SafetyContext } from "./safety.js";

export { checkOutput, isKnownTask } from "./safety.js";
export type { SafetyContext, SafetyResult } from "./safety.js";

/**
 * The AI Gateway (PRD 5.5). Every module calls this one interface; no module
 * calls a vendor SDK directly. Behind it: a router, a cache (keyed by prompt
 * hash), a safety filter, and swappable adapters. Swapping the model changes
 * nothing in the modules.
 */

export interface Adapter {
  /** Cost tier this adapter represents (PRD 5.6). */
  tier: 1 | 2 | 3 | 4;
  run(op: AIOp, task: string, context: Record<string, unknown>): Promise<{ text: string; data?: unknown }>;
}

export type AIOp = "explain" | "hint" | "generateContent" | "review";

export interface GatewayConfig {
  adapter: Adapter;
  analytics?: AnalyticsApi;
  safety: SafetyContext;
  /** The set of allowed task template ids (input scoping). */
  knownTasks: ReadonlySet<string>;
  /** Canned fallback used whenever a check fails — never raw model text. */
  fallbackText?: string;
  now?: () => number;
}

function hashKey(op: string, task: string, context: unknown): string {
  return `${op}|${task}|${JSON.stringify(context)}`;
}

export class Gateway implements AIProvider {
  private cache = new Map<string, AIResult>();
  private cfg: GatewayConfig;
  private now: () => number;

  constructor(cfg: GatewayConfig) {
    this.cfg = cfg;
    this.now = cfg.now ?? (() => Date.now());
  }

  private fallback(): AIResult {
    return {
      text: this.cfg.fallbackText ?? "Let's keep going — you're doing great!",
      tier: 1,
      filtered: true,
    };
  }

  private async call(op: AIOp, task: string, context: Record<string, unknown>): Promise<AIResult> {
    const started = this.now();
    // Input scoping: unknown template → deterministic redirect, no model call.
    if (!isKnownTask(task, this.cfg.knownTasks)) {
      this.emit(1, this.now() - started, false, true);
      return this.fallback();
    }
    const key = hashKey(op, task, context);
    const cached = this.cache.get(key);
    if (cached) {
      this.emit(cached.tier, this.now() - started, true, false);
      return cached;
    }
    let raw: { text: string; data?: unknown };
    try {
      raw = await this.cfg.adapter.run(op, task, context);
    } catch {
      this.emit(1, this.now() - started, false, true);
      return this.fallback();
    }
    // Output safety check — the choke point.
    const verdict = checkOutput(raw.text, this.cfg.safety);
    if (!verdict.ok) {
      this.emit(1, this.now() - started, false, true);
      return this.fallback(); // serve safe content silently
    }
    const result: AIResult = { text: raw.text, data: raw.data, tier: this.cfg.adapter.tier, filtered: false };
    this.cache.set(key, result);
    this.emit(result.tier, this.now() - started, false, false);
    return result;
  }

  private emit(tier: 1 | 2 | 3 | 4, latencyMs: number, cacheHit: boolean, guardrailTrigger: boolean) {
    this.cfg.analytics?.emit({ kind: "ai", action: "call", tier, latencyMs, cacheHit, guardrailTrigger });
  }

  explain(req: ExplainRequest) {
    return this.call("explain", req.task, req.context);
  }
  hint(req: HintRequest) {
    return this.call("hint", req.task, { ...req.context, level: req.level });
  }
  generateContent(req: GenerateRequest) {
    return this.call("generateContent", req.task, req.context);
  }
  review(req: ReviewRequest) {
    return this.call("review", req.task, req.context);
  }
}

/**
 * Stub adapter (Tier 1). Deterministic, canned, child-safe encouragement — no
 * network, no model. Lets the whole ecosystem run end-to-end before a real
 * hosted / self-hosted / on-device adapter is wired in (PRD 5.5 table).
 */
export class StubAdapter implements Adapter {
  tier = 1 as const;
  private lines: Record<string, string[]> = {
    explain: ["That worked because you thought a step ahead.", "Nice — you spotted the pattern."],
    hint: ["Try picturing it as a silly, colourful scene.", "What comes next if the pattern keeps going?"],
    generateContent: ["Imagine a bright red dragon juggling the numbers."],
    review: ["Great session! Your memory got a little stronger today."],
  };
  private critters = ["a giggling dragon", "a giant purple octopus", "a robot penguin", "a sleepy tiger", "a bouncing kangaroo"];
  async run(op: AIOp, task: string, context: Record<string, unknown>) {
    // Mnemonic templates weave the (safe, non-personal) item + place together.
    if (task === "memora.mnemonic" && context.item && context.place) {
      const critter = this.critters[Math.abs(hashString(String(context.item))) % this.critters.length];
      return {
        text: `Picture ${critter} holding ${context.item} right at ${context.place}. Make it big, silly and colourful!`,
      };
    }
    const pool = this.lines[op] ?? ["Keep going — you've got this!"];
    // Deterministic pick from the (non-personal) context so output is stable/cacheable.
    const seed = Math.abs(hashString(task + JSON.stringify(context))) % pool.length;
    return { text: pool[seed] };
  }
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
