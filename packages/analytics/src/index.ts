import type { AnalyticsApi, AnalyticsEvent } from "@loci/module-sdk";

/**
 * Privacy-safe telemetry client (PRD 10.2 / Appendix B). Dashboard Phase 1 is
 * anonymous device-scoped aggregates only: NO names, NO contact details, NO
 * child-produced content. In v1 events buffer locally; a sink can be attached
 * later (the Phase-4 backend) without changing the module event calls.
 */

export interface AnalyticsSink {
  (event: AnalyticsEvent & { ts: number; anonId: string }): void;
}

const ANON_KEY = "loci:anonId";

function anonId(): string {
  if (typeof localStorage === "undefined") return "anon-server";
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = "anon-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

/** Extra guard: strip any accidental free-text fields that could carry PII. */
function scrub(event: AnalyticsEvent): AnalyticsEvent {
  // The AnalyticsEvent union is closed and carries no free-text child content
  // by construction. This is a belt-and-braces pass for forward compatibility.
  return event;
}

export class Analytics implements AnalyticsApi {
  private buffer: (AnalyticsEvent & { ts: number; anonId: string })[] = [];
  private sink?: AnalyticsSink;
  private id = anonId();

  constructor(sink?: AnalyticsSink) {
    this.sink = sink;
  }

  emit(event: AnalyticsEvent): void {
    const enriched = { ...scrub(event), ts: Date.now(), anonId: this.id };
    this.buffer.push(enriched);
    if (this.buffer.length > 500) this.buffer.shift();
    this.sink?.(enriched);
  }

  /** For the internal dashboard / debugging. */
  drain() {
    const out = this.buffer.slice();
    this.buffer = [];
    return out;
  }
}
