# Loci — a thinking-skills ecosystem for children (8–12)

Loci turns the existing **Memora** memory app into an ecosystem of small, joyful
apps that teach real, nameable thinking skills — memory technique, chess, mental
arithmetic, logical reasoning and more — sharing **one child profile, one skill
map, one design language, and one swappable AI layer**.

Built to the [Loci Master PRD v2.1](./docs/Loci-Master-PRD-v2_1.md). Honesty
guardrail (non-negotiable): we claim children learn specific real skills and
enjoy it. We never claim we raise general intelligence or that skills transfer.

> **Status:** All launch-set modules are built on the shared spine — Memora
> (v2), Gambit, Abacus, Cortex, plus the P1/P2 modules Tangra, Lexicon and
> FocusRead — along with the Guardian safety layer and Real-World Quests.
> Built to PRD v3.0 (`docs/Loci-Master-PRD-v3_0.md`). See [Roadmap](#roadmap).

## What's here

A **Vite + TypeScript** monorepo using **npm workspaces**. React (the framework
Memora already used), now with a real build step so the PRD's performance
budgets, lazy-loaded modules, module contract, PWA/offline and CI gates are
achievable (§5.9).

```
loci/
  packages/
    module-sdk/        # the LociModule contract + shared types (Appendix C/E)
    core-progression/  # skill map + progression engine (deterministic)
    core-srs/          # spaced-repetition engine, SM-2 class (deterministic)
    ai-gateway/        # AIProvider interface, router, cache, safety filter, stub adapter (§5.5)
    data-local/        # local-first IndexedDB store, in-memory cache (§5.3)
    analytics/         # privacy-safe event schema + client (Appendix B)
    design-system/     # parchment-and-ember tokens + shared components (§6.1)
  apps/
    web/               # the PWA shell: Hub, daily challenge, module host, 11 screens (§6.3)
  modules/
    memora/            # the flagship memory module, refactored onto the spine (§4.1)
    placeholder/       # "Sparks" — proves the Phase-0 exit gate
```

## Run it

```bash
npm install
npm run dev        # start the app (Vite)
npm run build      # production build (PWA)
npm run typecheck  # tsc across the workspace
npm test           # safety-filter adversarial suite (vitest)
```

Open the printed local URL. No account, no backend — everything is on-device
(IndexedDB), which is the v1 posture (§5.3, §13).

## How the spine fits together

Every module implements one interface and receives one context object — it never
reaches for an account system, a look, or its own progression logic:

```ts
interface LociModule {
  id: string;
  displayName: string;
  accentToken: string;
  skillsAwarded: SkillId[];
  contributesToDaily?: boolean;
  mount(container: Element, ctx: ModuleContext): void | (() => void);
}
// ctx = { profile, progression, srs, ai, analytics, design }
```

- **Deterministic first (free tier, §5.6):** scoring, difficulty, the skill map,
  and SRS scheduling never call a model.
- **AI Gateway (§5.5):** modules call `ctx.ai` only. Behind it sit a router, a
  prompt-hash cache, swappable adapters (a `StubAdapter` ships so the whole app
  runs with zero network), and a **deterministic safety filter** on every string
  a child can see. No child personal data ever reaches an adapter.
- **Local-first (§5.3):** `data-local` keeps the small dataset in memory for
  synchronous reads and writes through to IndexedDB with a last-known-good
  snapshot (§5.9 resilience).

## Safety & privacy

- The safety filter is the single choke point on all generated text: input
  scoping (known task templates only, never free-form child prompts), a
  blocklist/pattern pass, a PII-echo check, and canned fallbacks on any failure.
  It ships with an adversarial test suite (`npm test`) — the Phase-0 exit gate.
- Nothing leaves the device in v1. No ads, no data sale, ever (§13).

## Roadmap

| Phase | What | State |
|-------|------|-------|
| 0 | The spine + Hub shell + daily-challenge slot | ✅ |
| 1 | Memora refactored onto the spine + daily challenge | ✅ |
| 2 | Gambit (chess, move tutor) + Abacus (Vedic math) | ✅ |
| 3 | Cortex (logic) — completes the free launch quartet | ✅ |
| — | Guardian safety layer + Real-World Quests (PRD 6.2/6.4) | ✅ |
| 5 | Tangra (spatial), Lexicon (verbal), FocusRead (reading) | ✅ |
| 4 | Own the stack: self-hosted model, accounts, parent dashboard | ⬜ backend phase |
| 6 | Native shell + partnerships (evidence-gated) | ⬜ |

## Notes on the Memora port

This is a **focused** port of Memora's core loop (pick palace → meet list →
placement coach → walk → active recall → done) onto the spine, with two
ready-made palaces and the planets list. The original standalone app also has a
photo-palace builder, in-app camera, more palaces, learn-a-text and number
memorisation — those carry over onto the spine in follow-up passes; the engine
here is generic enough to drive them.
