# Loci — Master Product Requirements Document

### Cognitive Skills Ecosystem for children (8 to 12), v2.1 (consolidated build spec)

A single consolidated PRD to be handed to Claude Code as the build specification, and to serve as the strategic source of truth. v2.0 committed to an acquisition wedge, growth mechanics, competitive positioning, kill gates, a cost model, and a risk register. **v2.1 makes the document executable by a design and build pipeline:** it adds a product experience specification (Section 6.3) for design handoff, provisional numeric gate thresholds (Section 11), non-functional requirements and performance budgets (Section 5.9), a concrete safety-filter specification (Section 5.5), parent-mediated share mechanics (Section 2), named engine and content defaults for Gambit (Section 4.2), and a core data model sketch (Appendix E).

**Working name:** “Loci” (from the method of loci, the memory-palace technique behind the flagship). Placeholder; rename freely. Memora is the flagship memory module and already exists in this project.

**Owner:** Raunak · **Platform for v1:** Responsive web app (PWA). Native deferred to a late phase.

## Executive summary

**What.** Loci is a web-first ecosystem of small, joyful apps that teach children aged 8 to 12 real, nameable thinking skills: memory technique, chess, mental arithmetic, logical reasoning, and later spatial, verbal, and reading skills. The apps share one child profile, one progress map, one design language, and one AI layer.

**Who.** The player is a child around nine. The buyer and gatekeeper is a parent who is wary of edtech hype and wants visible, honest progress.

**Why it can win.** Three things competitors do not combine: an honestly-positioned, integrated multi-skill ecosystem (rivals are single-skill or make inflated “get smarter” claims); a distinctive, warm, non-slot-machine design; and an AI architecture that runs mostly free or on a small self-hosted open model, which is what makes a genuinely free global product survivable.

**The strategic spine.** Lead acquisition with one sharp, inherently shareable wedge (a daily challenge plus chess), and use the full ecosystem as the retention moat, not as the acquisition surface. Build reach and honest effectiveness data first; monetise and seek distribution leverage later, from proven traction.

**Build approach.** Spine first, then modules, in phases with hard exit and kill gates. Memora already exists and is integrated onto the spine, not rebuilt.

**The one risk that matters most.** Near-free acquisition. Section 2 commits to specific mechanics to test rather than leaving this open. If the lead wedge cannot pull organic growth cheaply, the whole reach-first thesis fails, so it is validated first and explicitly.

**Honesty guardrail (non-negotiable).** We claim children learn specific real skills and enjoy it. We never claim we raise general intelligence or that skills transfer to unrelated domains. This keeps us clear of the legal and trust trap that fined generic brain-training apps, and it is a market advantage in a trust-starved category.

## 0. How to use this document (read first, Claude Code)

**Current state:** Memora, the memory-palace module, is already built in this project. Everything else is built around it.

**Goal:** Turn the existing single app into an ecosystem that shares one profile, progress map, design language, and AI layer, delivered in phases so it behaves like an ecosystem from the first module.

**Before writing new code:**

- Inspect the existing Memora implementation. Identify its framework, styling approach, data/storage layer, and design tokens (parchment and ember aesthetic; Fraunces for display, Manrope for body).

- Treat Memora’s stack as the default for the ecosystem unless there is a strong reason to change it. Where this document recommends tools (Section 5), prefer what Memora already uses so the codebase stays consistent. Do not rewrite Memora in a new framework without flagging it first.

- Build the shared spine (Section 8, Phase 0) as extractable packages, then refactor Memora onto that spine (Phase 1). Memora is an integration target, not a rebuild.

**Build order is Section 8.** Respect the exit and kill gates. Do not start a phase before the previous one clears its gate. Every module plugs into the shared spine; no module gets its own account system, look, or progression logic.

## 1. Strategy

### 1.1 Vision

A trusted global home where a child builds several real thinking skills in one place and a parent sees progress they believe. Positioned for the world, built to maximise reach and engagement first, and architected so the AI layer runs cheaply and keeps data under our control.

### 1.2 The sharpened thesis: lead with a wedge, keep the ecosystem as the moat

Reach-first and a seven-module ecosystem are in tension: broad surfaces rarely go viral, sharp ones do. We resolve it explicitly.

- **Acquisition wedge (how strangers arrive):** a daily challenge with a Wordle-style habit-and-share loop, drawing on the two most inherently shareable skills, memory feats and chess puzzles. Chess is the single strongest standalone wedge right now given its cultural moment and built-in competitiveness.

- **Retention moat (why they stay and why it is defensible):** the full ecosystem, the shared profile, the cross-skill Thinking Skills Map, and the honest parent dashboard. Any one module is copyable; the integrated, honestly-measured whole is not.

Every roadmap and growth decision serves one of these two roles. If a proposed feature does neither, it waits.

### 1.3 Positioning guardrails (constrain every build decision)

- **Sell skills, not**** ****“****brain training.****”** Real, specific skills; never general-intelligence or transfer claims.

- **Engagement is the north star, not revenue,** but never at the cost of wellbeing (Section 6.2).

- **Privacy is a feature.** Minimise data, keep it under our control, never sell it, no ads ever.

- **Free and broad in v1, optionality preserved.** No monetisation, accounts, or backend in early phases; no architectural choice that forecloses a future subscription, school channel, or partner distribution.

### 1.4 Why now, and where we sit against competitors

The moment is favourable: chess is culturally ascendant; parents have turned sharply sceptical of edtech that overclaims and oversells, which rewards honesty; and open-weight models have become good and cheap enough to make a free-at-scale AI product viable, which was not true a few years ago.

The competitive gap we exploit:

| Competitor type | Example shape | Their limit | Our edge |
| --- | --- | --- | --- |
| Single-skill kids’ app | a chess-for-kids app, a math-drill app | one skill, no ecosystem, no cross-skill progress | integrated multi-skill ecosystem with one profile and map |
| Adult brain-training | generic “brain games” | weak evidence, inflated claims, adult framing | honest skill framing, child-first, real measurable skills |
| Free nonprofit generalist | a large free kids’ learning app | broad and academic, not skill-craft, not habit-loop | sharp skill-craft, daily habit loop, distinctive design |
| Heavy tutoring / test-prep | coaching platforms | expensive, resisted by children, exam-shaped | joyful, low-friction, skill-shaped, free |

No incumbent combines integrated multi-skill, honest positioning, distinctive design, and free-at-scale economics. That combination is the thesis.

### 1.5 Target users and jobs to be done

- **Player, a child around nine.** Job: “I want to feel clever and make visible progress at something that feels like a game, not homework.” Uses a parent’s laptop or tablet, short attention span, cannot be assumed to read instructions, motivated by progress, characters, streaks, mastery.

- **Buyer and gatekeeper, a parent.** Job: “I want my child’s screen time to build something real, from a source I trust, and to see it is working.” Wary of sales tactics, wants visible progress and honesty about limits. Decides access now and payment later.

- **Later, teacher or tutor.** Job: “give me a no-login tool my class can use and a view of their progress.” Out of scope for v1; the data model must not preclude it (it is also a growth channel, Section 2).

## 2. Acquisition strategy (the number-one risk, addressed)

Reach-first only works if new users arrive at near-zero cost. This section commits to mechanics to test, in priority order, rather than leaving growth to chance. The rule: acquisition must be a property of the product, not a marketing budget. If it ever depends on paid performance marketing, the model is broken.

**Primary loops to build and test first (Phase 1 to 3):**

- **Daily challenge (habit and share loop).** A single daily brain challenge in the Hub, drawing on memory and chess, with a shareable result card (“I recalled 20 items in 90 seconds; can you?”). Wordle proved that a simple, ego-satisfying, shareable daily loop is one of the cheapest growth engines that exists. This is the flagship growth mechanic and should exist from Phase 1.

- **Shareable feats.** Memory feats and solved-puzzle moments are inherently impressive and shareable by proud parents. Make every “wow” moment one tap from a clean share card.

**Share mechanics (design constraint, not an afterthought).** Children aged 8 to 12 largely do not hold social accounts, so the Wordle analogy only works if the loop is **parent-mediated**: the child earns the result, the parent shares it. Design implications: (a) the share card must be crafted for a proud parent’s feed or group chat, not a child’s — “Aarav recalled 20 items in 90 seconds” beats an anonymous score; (b) the primary share surface is the **Web Share API falling back to copy-to-clipboard**, with WhatsApp as the expected first channel in India and family group chats generally, not Twitter; (c) the card is a spoiler-free result summary (a Wordle-style glyph grid plus one line of copy) rendered as both text and an image, with a deep link that lands a new visitor directly in today’s challenge with zero onboarding friction; (d) no child personal data leaves the device in the card unless the parent typed it — the display name on the card comes from the profile the parent created and sharing is always an explicit tap. Instrument the full loop: card generated → shared → link opened → challenge completed → profile created.

- **Teacher and parent seeding (no-login classroom tools).** A free, no-login single-purpose tool a teacher can use with a class, or a parent with siblings, turns one adult into thirty children and thirty families. Teachers are among the most powerful organic distribution channels in children’s software. Ship at least one no-login tool early.

**Secondary loops (layer in once a primary loop shows signal):**

- **Free tools for search and content.** Standalone free tools (a daily chess puzzle, a mental-math drill, a memory trainer) that rank in search and pull traffic into the ecosystem, supported by genuinely useful parent-facing content (“how to teach your child to concentrate,” “why chess helps”), which you are well suited to write.

- **Creator partnerships.** Micro-influencers in parenting, homeschooling, and chess. The chess wedge taps an existing creator ecosystem.

- **Family referral.** Lightweight parent-invites-parent, rewarded with content rather than discounts (there is nothing to discount yet).

**What to measure (and the kill gate):** the referral or share coefficient of the daily loop, and organic signups per active family. If, after honest effort in Phases 1 to 3, no loop produces meaningful near-free growth, stop adding modules and fix acquisition before anything else. Building more product on a broken acquisition base is the classic edtech way to die.

## 3. Ecosystem architecture (conceptual)

One platform, many modules. The modules are the acquisition and engagement surface; the Hub and shared services are the moat.

                         ┌─────────────────────────┐
                         │        THE HUB          │
                         │  child profile, skill    │
                         │  map, streaks, daily      │
                         │  challenge, the Guide     │
                         └───────────┬─────────────┘
                                     │
   ┌──────────┬──────────┬──────────┼──────────┬──────────┬──────────┐
 Memora     Gambit     Abacus     Cortex     Tangra     Lexicon   FocusRead
 (memory)   (chess)   (mental    (logic &   (spatial)  (verbal)  (reading &
  EXISTS               math)     reasoning)                       attention)
   └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
                                     │
                         ┌───────────┴─────────────┐
                         │   SHARED SERVICES        │
                         │  progression engine,     │
                         │  spaced-repetition, AI    │
                         │  Gateway, analytics,      │
                         │  content store, (later)   │
                         │  parent dashboard         │
                         └─────────────────────────┘

### 3.1 The Thinking Skills Map

Every module trains one or more named cognitive skills. The Hub renders these as a visible map the child grows and the parent reads. It is the engagement glue (children fill in a map), the honest positioning (we show exactly which skill each activity trains), and the parent-facing value (progress they believe). Taxonomy in Appendix A.

## 4. The modules

Priority: **P0** launch set, **P1** fast follow, **P2** later. Roles: **[W]** contributes to the acquisition wedge, **[M]** primarily a retention-moat module. Each shares the spine but is independently shippable.

### 4.1 Memora — Memory (P0, flagship, ALREADY BUILT) [W]

- **Cognitive target:** memory technique (method of loci, linking, pegging, names and faces, number systems) and the metacognitive sense of “I can deliberately remember.”

- **Status:** exists; integrate onto the shared spine (profile, skill map, design components, Guide, SRS engine), do not rebuild.

- **Wedge role:** memory feats are inherently shareable; Memora feeds the daily challenge and share cards.

- **AI role:** suggest vivid mnemonic images and stories, generate themed practice. Pre-generate and cache the bulk; reserve live calls for personal suggestions. Review scheduling is deterministic (shared SRS), no model call.

- **Primary metric:** recall span cleared per session; return rate to reviews.

### 4.2 Gambit — Chess and strategic thinking (P0) [W]

- **Cognitive target:** calculation, planning ahead, pattern recognition, patience, learning from mistakes.

- **Wedge role:** the strongest standalone acquisition wedge; culturally hot, inherently competitive and shareable; feeds a daily puzzle.

- **Core loop:** learn a concept (tactic, opening idea, endgame), drill on puzzles, play guided games, review in plain language.

- **AI role:** translate deterministic engine evaluation into child-friendly “why was this good or bad,” adaptive hint depth, post-game review. A WebAssembly engine evaluates; the model only explains. Highest-value AI use in the ecosystem.

- **Concrete defaults (change only with reason):** **Stockfish compiled to WebAssembly** (stockfish.wasm / lila-stockfish-web lineage) for all evaluation, running client-side at reduced depth and strength-limited for play; the **Lichess open puzzle database (CC0, several million rated and themed puzzles)** as the puzzle corpus, filtered to child-appropriate rating bands and re-rated internally from our own solve data. Both are free, licence-clean, and remove the two largest content and engine risks from the build.

- **Primary metric:** internal puzzle rating; puzzles or games per week.

### 4.3 Abacus — Mental math and numeracy (P0) [M]

- **Cognitive target:** mental arithmetic, number sense, estimation, speed and accuracy under light time pressure.

- **Moat role:** highest parent-trust and willingness-to-pay module; its progress chart is the strongest parent-facing artefact and the anchor of any future subscription.

- **Core loop:** technique lessons (complements, Vedic shortcuts, mental-abacus visualisation), timed drills, level progression.

- **AI role:** generate level-matched word problems, Socratic hints, explain the specific error. Drills and scoring are deterministic; the model is for explanation and word problems.

- **Primary metric:** problems per minute at a fixed accuracy threshold, over time.

### 4.4 Cortex — Logic and reasoning (P0) [M]

- **Cognitive target:** deductive reasoning (logic grids, knights-and-knaves, sudoku-family), inductive reasoning (pattern and sequence completion), basic lateral thinking.

- **Core loop:** pick a puzzle type, solve at increasing difficulty, unlock new types, earn explanations on demand.

- **AI role:** generate puzzles feeding a validated library, graduated hints, post-solve reasoning. Every generated puzzle passes a deterministic solver before a child sees it.

- **Primary metric:** highest difficulty cleared per family; hint-free solve rate.

### 4.5 Tangra — Spatial reasoning (P1) [M]

- **Cognitive target:** mental rotation, 2D and 3D visualisation, decomposition (tangrams, nets, folding), mazes.

- **AI role:** minimal; mostly deterministic geometry. A deliberately low-inference module, good for economy.

- **Primary metric:** difficulty cleared; average moves to solution.

### 4.6 Lexicon — Verbal reasoning and vocabulary (P1) [M]

- **Cognitive target:** vocabulary in context, analogies, classification, verbal reasoning, word play.

- **Core loop:** words in vivid contexts, analogy and odd-one-out puzzles, a growing word collection reviewed via the shared SRS.

- **AI role:** generate example sentences and child-appropriate definitions, build analogy sets, explain why a word fits. A natural fit for the self-hosted model once stood up.

- **Primary metric:** words mastered and retained on review; analogy accuracy.

### 4.7 FocusRead — Reading and attention (P2, ship last) [M]

- **Cognitive target:** reading comprehension, reading pace, sustained and selective attention, working memory under reading load.

- **Why last:** attention is the easiest place to overclaim. Ships when the brand and AI layer are mature. Framed strictly as focus and reading practice, never treatment.

- **AI role:** generate level-matched passages and comprehension questions (reading level validated deterministically), summarise reading growth for the parent.

- **Primary metric:** comprehension accuracy at a given reading level; sustained reading time.

### 4.8 Parking lot (P2+)

Creativity and divergent thinking, debate and argument mapping (likely too advanced for the lower band), music and rhythm training, and an older-age competitive-exam aptitude variant (a deliberate future bridge to a distribution-partner audience). Documented so they are not architected out; not built now.

## 5. Technical architecture

### 5.1 Stack posture

Prefer the stack Memora already uses. Recommendations below are defaults for anything built fresh, not a mandate to change Memora. The requirements are: a component-based web frontend, a shared design-system package, PWA support (installable, offline-capable), and a local-first storage layer. The exact framework should match the existing code.

### 5.2 Monorepo structure (suggested, adapt to existing layout)

```
loci/
  packages/
    design-system/     # tokens, components, the Guide character (from Memora's tokens)
    core-progression/  # skill map + progression engine (deterministic)
    core-srs/          # spaced-repetition engine (deterministic)
    ai-gateway/        # AIProvider interface, adapters, router, cache, safety filter
    data-local/        # local-first storage (IndexedDB wrapper), the v1 data layer
    analytics/         # event schema + privacy-safe telemetry client
    module-sdk/        # the contract every module implements
  apps/
    web/               # single PWA shell that mounts the Hub, daily challenge, and modules
  modules/
    memora/            # EXISTING - refactor onto the spine
    gambit/  abacus/  cortex/  tangra/  lexicon/  focusread/
  services/            # Phase 4+
    backend/           # accounts, consent, cross-device sync, analytics store
    inference/         # self-hosted model serving config
    admin-dashboard/   # internal admin + effectiveness dashboard
```

### 5.3 Local-first v1, backend later

- **v1 (Phases 0 to 3):** no backend, no accounts. Profiles and progress on-device (IndexedDB via data-local). Matches Memora, removes the accounts, consent, and storage burden during the riskiest period, and is the cheapest way to test whether children return.

- **Phase 4:** introduce a backend only when cross-device sync, the parent dashboard, and server-side AI require it. Add accounts and verifiable parental consent together.

### 5.4 PWA

Installable, offline-capable, add-to-home-screen. One codebase, no app-store friction, instant updates, clean later path to a native shell. Native is a late, evidence-gated decision.

### 5.5 The AI Gateway (swappable, self-hosted-ready, economical)

All modules call one internal interface; no module calls a vendor SDK directly. Swapping the model changes nothing in the modules.

```
interface AIProvider {
  explain(req: ExplainRequest): Promise<AIResult>;         // why a move or answer was good/bad
  hint(req: HintRequest): Promise<AIResult>;               // graduated, Socratic
  generateContent(req: GenerateRequest): Promise<AIResult>;// puzzles, passages, word sets, mnemonics
  review(req: ReviewRequest): Promise<AIResult>;           // session/game summaries
}
```

Behind the interface sit a router, a cache, a safety filter, and three interchangeable adapters:

| Adapter | What it is | When used |
| --- | --- | --- |
| Hosted | a commercial API | prototyping and offline content authoring only; never receives child personal data |
| Self-hosted | a small open model you serve (vLLM or Ollama) on your own GPU | production; data stays on infrastructure you control |
| On-device | a small model in the browser (WebLLM / transformers.js) | high-volume simple hints; zero marginal cost; data never leaves the device |

Gateway requirements: structured JSON outputs for anything driving game logic; a single safety-filter choke point on all generated text; a hard guarantee that no child personal data is ever sent to any external adapter; a router that sends each task to the cheapest capable tier and a cache keyed by prompt hash.

**Safety filter specification (the choke point, made concrete).** Layered, deterministic-first, applied to every string a child can see regardless of tier:

- **Input scoping:** every request carries a task template; free-form child text is never forwarded as an open prompt. The Guide is scoped to the current activity — off-task input gets a friendly deterministic redirect, never a model round-trip.

- **Output checks, in order:** (1) schema validation (structured outputs must parse; failures fall back to canned content, never raw model text); (2) a deterministic blocklist and pattern pass (profanity, violence, self-harm, romance, contact-seeking, URLs, phone-like and email-like strings); (3) a personal-data echo check — output must not contain the profile name or any stored profile field unless the template explicitly allows the display name; (4) a lightweight age-appropriateness classifier pass for Tier-4 generations destined for the content store (batch time, not request time).

- **Failure behaviour:** any check fails → serve validated cached or authored content silently; log the trigger with the prompt hash (never the child content) to the wellbeing dashboard (Section 10.6).

- **Testing gate:** the filter ships with an adversarial test suite (prompt-injection attempts via activity content, PII-echo probes, unsafe-topic probes) that runs in CI; a red-team pass is part of the Phase 0 exit gate for the ai-gateway package.

### 5.6 Cost architecture: four tiers, cheapest first

- **Deterministic, no model (free).** Spaced repetition, scoring, difficulty adjustment, puzzle validity, chess evaluation. Most of the product. Always ask “can a rule do this?” first.

- **Pre-generated, cached content (near-free at scale).** Generate puzzles, passages, word sets, and standard explanations once in offline batches, validate deterministically, store, serve to everyone. Cache live responses by prompt hash. The biggest cost lever.

- **On-device model (zero marginal cost, max privacy).** High-volume simple hints run in the browser; cost moves to the user’s device and data stays on it.

- **Self-hosted small model (fixed cost, falls per-user as you scale).** Only the genuinely dynamic, higher-quality work. A fixed GPU serving many children means cost per child falls with scale, the opposite of per-token API pricing.

A hosted API appears only in prototyping and never sees child data.

### 5.7 Worked cost example (illustrative, to validate not to trust)

The point is to show the economics can close, not to promise a number. Assume, once mature, that of all AI-eligible interactions roughly 70 percent are served from pre-generated cache (Tier 2, effectively free), 20 percent on-device (Tier 3, free to us), and only 10 percent reach the self-hosted server (Tier 4). Assume one rented mid-range GPU on the order of a few hundred dollars a month serving a quantised small model. Because only the 10 percent tail hits that fixed-cost GPU, and the GPU is amortised across the entire active base, the server cost per active child per month lands in the sub-cent to low-single-digit-cents range at modest scale, and it falls as the base grows. The sensitivity that matters: cost is dominated by the fixed GPU and the cache hit rate, not by user count, which is exactly the property that makes free-at-scale viable. Validate these ratios with real usage early (they are tracked in the dashboard, Section 10); if the cache hit rate is far lower than assumed, revisit content pre-generation before scaling.

### 5.8 Data ownership and privacy architecture

Self-hosted inference plus a database you control means user data is never handed to a third-party vendor. Minimise stored data (v1 stores nothing on a server). No advertising integrations or third-party trackers, ever. The Phase 4 backend is single-tenant and under your control.

### 5.9 Non-functional requirements (build-blocking)

“Global reach” means the floor device is a shared mid-to-low-end Android phone or an ageing family laptop on a patchy connection. These budgets are acceptance criteria, enforced in CI from Phase 0, not aspirations.

- **Performance budgets:** app shell (Hub) initial load ≤ 200 KB gzipped JS; each module lazy-loaded on entry, ≤ 300 KB gzipped (Gambit may add the engine WASM as a separately cached fetch); time-to-interactive ≤ 3 s on a mid-range Android over 4G (Lighthouse mobile throttling); input latency in drills ≤ 100 ms; 60 fps target for core interactions, no animation that blocks input.

- **Browser matrix:** last 2 versions of Chrome, Safari, Firefox, Edge, plus Chrome on Android and Safari on iOS back to widely-deployed versions; graceful degradation (no WASM → Gambit unavailable with a friendly message, rest of ecosystem unaffected).

- **Offline (PWA):** the shell, the current day’s challenge, and any module the child has opened before work fully offline; SRS reviews are always available offline; pre-generated content ships in versioned packs cached by the service worker with background refresh; all progress writes are local-first and never lost to connectivity.

- **Resilience:** IndexedDB writes are transactional; a corrupted store must never destroy a profile (keep a last-known-good snapshot); storage pressure (browser eviction) is mitigated by requesting persistent storage and warning in the parent view.

- **Quality gates:** crash-free sessions ≥ 99.5 percent; WCAG AA automated checks in CI; bundle-size regression checks per package.

## 6. Design and wellbeing principles

### 6.1 Design system

Extend Memora’s established system.

- **Aesthetic:** parchment and ember. Warm, scholarly, workshop-of-the-mind, with playful energy. Differentiates sharply from the cold, neon, slot-machine look of most kids’ apps and signals “serious but warm” to parents.

- **Typography:** Fraunces for display, Manrope for body, across all modules.

- **Per-module accent:** one accent per module within the shared palette (Memora amber, Gambit deep teal, Abacus terracotta, Cortex indigo) so modules feel distinct yet one family.

- **Shared component library (hard requirement):** buttons, cards, progress elements, the Guide, modals, the skill-map visual, the daily-challenge card. Built once in design-system, themed per module; extract from Memora’s components where possible.

- **Accessibility:** large touch targets, minimal text, audio support for pre-fluent readers, high contrast, WCAG AA baseline.

### 6.2 Wellbeing by design (a first-class principle, not a footnote)

Because the north star is engagement, wellbeing must be an explicit counterweight, or the product drifts toward the manipulative patterns that make parents distrust the category.

- Generous, non-punitive progression: no streak shaming, no loss framing, no anxiety-inducing timers.

- No dark patterns, no manipulative notifications, no infinite feeds.

- We do not maximise time on app. The product actively encourages breaks and celebrates finishing, and the dashboard monitors for overuse (Section 10.6).

- The daily challenge is designed to be satisfying and finite, like a crossword, not endless. This is both an ethical stance and, in a trust-starved market, a competitive one.

### 6.3 Product experience specification (design handoff)

This section is the brief for the design pass. It defines the screen inventory and the flows that carry the strategy; visual exploration happens within Memora’s established system (Section 6.1).

**Screen inventory (v1, Phases 0 to 3):**

| # | Screen | Purpose | Notes |
| --- | --- | --- | --- |
| 1 | First-run welcome | Get a child playing in under 60 seconds | No account. Pick avatar, first name or nickname, age band (8–9 / 10–12). Age band tunes copy length, audio prompts, and starting difficulty. |
| 2 | Hub home | The daily anchor | Today’s challenge card (dominant), skill map (growing, tappable), module tiles, streak state (celebratory, never shaming), the Guide greeting. |
| 3 | Daily challenge flow | The habit and share loop | Intro → play (finite, 2–4 minutes) → result → share card. Result screen is the emotional peak: what you did, which skill grew, one-tap parent share, “come back tomorrow” with tomorrow’s teaser. |
| 4 | Share card | The growth artefact | Glyph-grid result plus one line of copy plus deep link; renders as text and image; child’s display name only; designed for WhatsApp and family chats. |
| 5 | Module home (template) | Consistent entry into any module | Same skeleton every module: continue-where-you-left-off, lesson path, drill/practice entry, module accent colour. One template, themed per module. |
| 6 | Activity player (template) | Learn → practise → feedback | Shared chrome (progress, exit, hint via the Guide); module supplies the activity body through the module contract (Appendix C). |
| 7 | Session summary | Finish feeling clever | What was practised, skill-map progress earned, scheduled review preview, celebration that endorses stopping (Section 6.2). |
| 8 | Skill map (full view) | The ecosystem made visible | Named skills (Appendix A), per-skill growth, which modules feed each skill; readable by a nine-year-old, credible to a parent. |
| 9 | Reviews (SRS) | Retention of learning | Due-today queue across modules; short, satisfying, offline-capable. |
| 10 | Profile switcher | Multi-child devices | Fast, visual, no credentials. |
| 11 | Grown-ups corner | Parent trust surface (pre-dashboard) | Behind a simple adult gate: what each module trains, the honesty stance, privacy posture, wellbeing settings. Plain language. Not a dashboard yet. |

**Flows to design first, in order:** (1) first run → first completed activity (the activation gate lives here; target under 60 seconds to play, zero reading required to start); (2) daily challenge → result → parent share → recipient opens deep link → plays today’s challenge (the growth loop end-to-end); (3) Memora session on the spine: Hub → module → activity → summary → skill map updates → next-day review appears (the retention loop); (4) second-module discovery: how the Hub invites a Memora child into Gambit (the cross-module gate).

**Design principles binding the pass:** every screen readable aloud by the Guide for pre-fluent readers; one primary action per screen; progress always visible, loss never dramatised; large targets, minimal text, WCAG AA; parchment-and-ember warmth with per-module accents (Section 6.1); nothing that resembles a feed, a countdown-pressure timer, or a shame state.

## 7. Shared platform systems

- **Child profile:** v1 local, on-device (name, avatar, age band), multiple profiles per device, no login. Phase 4 adds an optional parent-owned account with verifiable consent and cross-device sync; the child never holds credentials.

- **Skill map and progression engine:** one cross-module model; each activity awards progress to named skills (Appendix A). Deterministic. Generous and non-punitive (Section 6.2).

- **Spaced-repetition engine:** one shared deterministic scheduler (SM-2 class), reused by Memora, Lexicon, and any retained-content module. No model call.

- **Daily challenge:** a Hub-level daily activity drawing on modules (memory, chess) with a shareable result card. The primary growth mechanic (Section 2); build in Phase 1.

- **The Guide:** one consistent, friendly, Socratic tutor character across modules (asks before telling), backed by the AI Gateway so the model behind it is swappable. Hard guardrails: age-appropriate, never collects personal information, scoped to the learning task only, never open-ended chat.

- **Content store:** shared service for lessons, puzzles, passages, word sets; supports authored and validated AI-generated content. Validation is always deterministic (a solver for puzzles, a reading-level checker for passages, a safety filter for all generated text).

- **Parent dashboard (Phase 4):** honest, plain-language per-skill progress including plateaus, and which real skill each module trains.

## 8. Phased build plan

Guiding principle: **spine first, then modules.** Build the shared skeleton so adding a module is fast and consistent, then drop modules in one at a time. Each phase has an exit gate (proceed only when met) and, where relevant, a kill gate (stop and fix, do not build more). Effort is relative; no invented dates.

**Resourcing reality (read this).** This is an ambitious ecosystem for a very small team. The phasing is deliberately sequential so you are never building two hard things at once, and the launch set is only four modules, one of them already built. Be ruthless about the gates: they exist so you do not build Tangra through FocusRead before knowing whether anyone returns. If capacity is tighter than hoped, the honest minimum viable ecosystem is the spine plus Memora plus one wedge module plus the daily challenge. Everything after Phase 2 is earned by evidence, not scheduled by optimism.

### Phase 0 — The spine (heavy)

Build shared packages: design-system (extract from Memora), core-progression, core-srs, ai-gateway (interface + hosted adapter for prototyping + router + cache + safety filter), data-local, analytics (event schema + telemetry client), module-sdk. Build the apps/web PWA shell, the Hub (profile, skill map, streaks, Guide frame), and the daily-challenge slot. Encode the skill taxonomy. **Exit gate:** a throwaway placeholder module can be added in under a day, inherits the design system, writes to the skill map, and appears in the Hub.

### Phase 1 — Integrate Memora and ship the daily challenge (medium)

Refactor Memora onto the shared spine (shared profile, skill map, design components, Guide, SRS). Remove Memora-specific duplicates of what the spine now provides. Ship the first daily challenge (memory-based) with a shareable result card. **Exit gate:** a child completes a full Memora journey inside the Hub (learn, practise, score, see skill-map progress, return next day to a scheduled review), and the daily challenge produces a share card.

### Phase 2 — The wedge: Gambit, plus Abacus (medium each, parallelisable)

Build Gambit (WebAssembly engine for evaluation, AI Guide for explanation, daily chess puzzle feeding the daily challenge) and Abacus (deterministic timed drills and scoring, AI for word problems and hints). **Exit gate:** a meaningful share of active children use more than one module in a week (cross-module adoption). **Kill gate (acquisition):** at least one growth loop from Section 2 shows near-free organic acquisition. If not, stop and fix acquisition before Phase 3. Target hypotheses in Section 11.

### Phase 3 — Complete the free launch quartet: Cortex (medium)

Build Cortex (deterministic puzzle types, a solver validating every puzzle including AI-generated ones, AI hints and post-solve explanations). **Exit gate:** launch set stable; day-7 and day-30 return meet the Section 11 targets; AI cost per active child within target. This is the readiness gate for owning the AI stack.

### Phase 4 — Own the stack, add accounts and dashboard (heavy)

Stand up the self-hosted model adapter and migrate production inference to it (module code unchanged). Add the optional parent account with verifiable consent, cross-device sync, and the parent dashboard, on the first real backend. Begin routing simple interactions on-device. Stand up the admin and effectiveness dashboard (Section 10). **Dependency (blocking):** a children’s-data compliance review before any server-side personal data exists. **Exit gate:** production inference on your own model at target cost; accounts and consent live and compliant; parent dashboard showing real per-skill progress.

### Phase 5 — Extend (medium, ongoing)

Add Tangra, then Lexicon, then FocusRead (last, strict claim discipline). Each plugs into the spine on the same bar as before, and each must clear the same engagement bar or it does not ship.

### Phase 6 — Native and leverage (decision-gated)

Wrap the PWA in a native shell only if web traction proves demand and native unlocks something the PWA cannot. Begin partnership or funding conversations only with real engagement, retention, and honest effectiveness numbers in hand. Optionally build the older-age aptitude variant as a bridge to a partner audience.

### What each phase deliberately does NOT do

Phases 0 to 3 collect no server-side personal data. No monetisation until after the launch set proves engagement (Section 12). No native, school features, or parent accounts until the phase that introduces them.

## 9. Localization and international sequencing

“Position for the world” needs a concrete language plan, because AI content generation and reading-level control are language-specific.

- **Launch in English** (widest reach, simplest content pipeline), with the architecture internationalised from the start (all copy externalised, no hard-coded strings, locale-aware content store).

- **Second language: Hindi**, given your context and market, once the English loop is proven. This is also where a strongly multilingual open model (Section 5) or an Indian-language model earns its place.

- **Skill-craft modules localise more easily than language modules.** Abacus, Gambit, Cortex, Tangra are light on text and port quickly; Memora, Lexicon, and FocusRead are language-heavy and localise last per language.

- Do not localise broadly before the core loop works in one language. Breadth of language before depth of engagement is the same trap as breadth of modules before retention.

## 10. Admin and effectiveness dashboard (internal)

**Purpose:** answer honestly whether the platform is performing (children come, stay, spread) and whether it is effective (children get better at the skills). Internal only.

### 10.1 The honesty constraint

Measure in-skill growth (chess rating, problems per minute, recall span, puzzle difficulty). Never infer transfer from it. A transfer claim needs a deliberate controlled study (Section 10.5), a separate optional project, not a dashboard inference.

### 10.2 Local-first phasing

- **Dashboard Phase 1 (with local-first v1):** anonymous aggregate telemetry only, no names, no contact details, no cross-device identity, no child-produced content, only anonymous device-scoped aggregates. Enough for engagement, retention by anonymous id, funnel, content health, and aggregate in-skill growth, while collecting essentially no personal data.

- **Dashboard Phase 2 (with the Phase 4 backend and consented accounts):** full per-child longitudinal growth, cohort retention, and the deeper methodology, tied to consented accounts, under your control, never sold. Phase 1 metrics keep working unchanged.

### 10.3 Performance metrics

Acquisition and growth (new profiles by source; share and referral coefficient of the daily loop; organic signups per active family; activation). Engagement and retention (north star, below; day-1/7/30 return; sessions per week; activities per session; multi-week cohorts). Ecosystem effect (cross-module adoption; module-to-module flow; skill-map breadth). AI and infra economics (AI cost per active child, must fall with scale; tier mix; cache hit rate; latency; GPU utilisation). Content health (per-item completion and abandon; too-easy/too-hard detection; AI-generated validation pass rate; stale content). Technical health (errors, latency, PWA install rate, offline share, crash-free sessions).

### 10.4 Effectiveness measurement

In-skill growth curves per module (the backbone, stated only as in-skill improvement). Mastery and progression velocity. Retention of learning (recall success on scheduled reviews at increasing intervals). Difficulty calibration and flow (success rate against a productive band, roughly 70 to 85 percent). Cohort comparisons (engaged vs light, correlational and labelled as such; A/B tests of teaching variants, clean causal evidence about your own teaching).

### 10.5 Optional efficacy study

Any claim beyond in-skill growth needs a defined external measure, a comparison group, pre and post assessment, and ideally an academic partner (also credibility gold in a trust-sensitive market). Separate research project; flagged so the dashboard does not pretend to deliver it. Note the loop: this honest effectiveness data is also the marketing and partner-pitch asset.

### 10.6 Wellbeing monitoring (counter to engagement maximisation)

Guardrail-trigger rate on generated text, with examples for review. Overuse detection: flag unusually long or compulsive usage so the product can encourage breaks. Frustration signals (repeated fails, rage-quits, hint-loops) used to fix difficulty, not to upsell.

### 10.7 Build approach

Internal, access-controlled web dashboard reading from your own analytics store (lands with the Phase 4 backend; Phase 1 telemetry uses a minimal privacy-preserving pipeline into the same store). Favour a simple, cheap, self-hosted analytics stack; the event schema matters more than the visualisation tool. Build views in use order: engagement and retention, then AI cost, then effectiveness, then content health, then wellbeing and technical health.

## 11. Success metrics and target hypotheses

North star: **weekly active children completing activities across three or more separate sessions per week.**

Targets below are starting hypotheses with provisional numbers, chosen from consumer-web and kids-edtech norms so the gates in Section 8 are testable from day one. Recalibrate against the real Phase 1 baseline; a recalibration is a documented decision, not a silent move of the goalposts. Anchor on engaged, returning children, never on registration counts.

| Metric | Provisional threshold | Gate it informs |
| --- | --- | --- |
| First-session activation (complete one full activity) | ≥ 60% of new profiles, same session | Phase 1 |
| Time to first play (first run) | ≤ 60 seconds, median | Phase 1 |
| Day-7 return (per profile / anonymous id) | ≥ 20% | Phase 3 exit |
| Day-30 return | ≥ 8% | Phase 3 exit |
| Cross-module adoption (weekly actives using 2+ modules) | ≥ 30% | Phase 2 exit |
| Daily-challenge share rate (completions → card shared) | ≥ 5% | Phase 2 kill gate input |
| Viral factor of the daily loop (new profiles per sharing family) | k ≥ 0.15 and rising | Phase 2 kill gate |
| AI cost per active child / month | ≤ $0.03 and falling with scale | Phase 3 exit |
| Crash-free sessions | ≥ 99.5% | every phase |

## 12. Monetisation thesis and trigger conditions (future)

Documented to keep optionality open and to bound the free period, not to build now.

- **Default future model:** a family subscription for the full ecosystem, weighted to annual, anchored on the modules parents already value most (Abacus first). Realistic pricing is set later against the market, kept modest given price sensitivity.

- **Trigger conditions (do not introduce paid until all hold):** the launch set clears the Phase 3 retention targets; at least one organic growth loop works; and the parent dashboard exists to make value visible. Monetising before these is how trust-sensitive parents churn.

- **Never:** ads, or selling data, in a children’s product. Ever.

- **Other paths kept open:** a school or phygital channel (needs the teacher features left out of v1); partner distribution or acquisition, where engaged users, funnel quality, and honest effectiveness data are the leverage; mission or grant funding. The free, privacy-first, self-hosted, modular architecture supports all of these without committing to any. Note the earlier tension: a partner-distribution endgame values depth in the partner’s geography over global breadth, so if it becomes primary, re-weight accordingly.

## 13. Privacy, safety, and compliance

- **Applicable regimes:** COPPA (US), GDPR and children’s provisions (EU and UK), India’s Digital Personal Data Protection Act with its children’s-data rules. Positioning globally, assume the strictest applicable standard.

- **Posture:** verifiable parental consent before any personal data is collected; no behavioural tracking or profiling of children for advertising; no targeted advertising to children; data minimisation; no data sale, ever.

- **Architecture helps:** v1’s local-first design means essentially no personal data at launch, de-risking the riskiest period. Consent and accounts arrive together in Phase 4.

- **Blocking open item:** a proper legal review of children’s-data obligations across launch geographies before Phase 4. This summary is not legal advice.

## 14. Risk register

| # | Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- | --- |
| 1 | Acquisition is not near-free; growth stalls | Fatal to reach-first thesis | Medium-High | Section 2 loops built and measured early; Phase 2 kill gate; do not scale product on a broken funnel |
| 2 | Retention is weak; children do not return | Fatal | Medium | Wedge plus daily loop plus ecosystem designed for return; hard Phase 3 retention gate before building more |
| 3 | Overclaiming effectiveness; legal or trust damage | Severe | Low if disciplined | Honesty guardrail in every layer; dashboard measures in-skill only; no transfer claims without a study |
| 4 | Children’s-data non-compliance | Severe (legal) | Low if handled | Local-first v1 collects almost nothing; legal review blocks Phase 4; strictest-standard posture |
| 5 | Small-team overreach; too many modules too soon | High (burnout, thin product) | High | Sequential phasing; four-module launch set; gates; documented minimum viable ecosystem |
| 6 | AI cost does not stay low at scale | High | Low-Medium | Four-tier routing; cache-first; on-device tail; self-hosted fixed cost; cost tracked in dashboard from day one |
| 7 | A well-funded incumbent copies a single module | Medium | Medium | Moat is the integrated, honestly-measured ecosystem, not any one module |
| 8 | Model or license change in the open-weight ecosystem | Low-Medium | Medium | Gateway abstraction makes the model swappable; favour Apache 2.0 / MIT to avoid caps and restrictions |
| 9 | Share loop underperforms because it depends on parent mediation, not child virality | High (weakens the wedge) | Medium | Design the card for the parent’s feed (Section 2); measure share rate and k explicitly; teacher/no-login seeding as the parallel loop; Phase 2 kill gate catches it early |

## 15. Open questions (only the genuinely undecided)

- **[Strategy]** Primary endgame (global venture, partner distribution or acquisition, mission). Left open by choice; will eventually re-weight the roadmap, especially acquisition geography. Non-blocking now.

- **[Growth]** Which Section 2 loop performs best is an empirical question answered in Phases 1 to 3. Non-blocking to start; blocking to scale.

- **[Legal]** Children’s-data compliance review across launch geographies (blocking for Phase 4) and permissible anonymous telemetry during local-first v1 (blocking for Dashboard Phase 1).

- **[Engineering]** Final Tier 4 model choice (Qwen3 vs Gemma 4, and Sarvam for Hindi) by testing on real prompts and languages; own GPU vs rented vs serverless. Blocking for Phase 4.

- **[Data]** Final event schema and activity-to-skill mapping. Blocking for Phase 0 instrumentation.

- **[Design]** Final ecosystem name; whether Memora stays a sub-brand or the ecosystem renames around it. Non-blocking.

## Appendix A — Cognitive skill taxonomy (draft)

The shared vocabulary the skill map and progression engine are built on.

| Skill | Trained primarily by |
| --- | --- |
| Working memory | Memora, FocusRead, Abacus |
| Long-term memory technique | Memora |
| Calculation and number sense | Abacus |
| Pattern recognition | Gambit, Cortex |
| Deductive reasoning | Cortex |
| Inductive reasoning | Cortex |
| Planning and foresight | Gambit |
| Spatial visualisation | Tangra |
| Verbal reasoning | Lexicon |
| Vocabulary | Lexicon |
| Reading comprehension | FocusRead |
| Sustained attention | FocusRead, Abacus (timed drills) |
| Metacognition (learning to learn) | All modules, via the Guide |

## Appendix B — Event taxonomy (shared by modules and dashboard)

Define once in analytics, built into every module from the first one. Minimum families: **Session** (start, end, module opened, anonymous or Phase 2 account id, device class); **Activity** (started, completed, abandoned; module, skill(s) awarded, difficulty, success or accuracy, time taken, hints used); **Progression** (mastery milestone, skill-map award, streak state); **Review** (SRS item due, attempted, recalled or missed, interval); **Daily challenge** (served, completed, shared); **AI** (tier used, latency, cache hit or miss, cost estimate, guardrail trigger; never log child-produced personal content); **Content** (item id, served, completed, difficulty-vs-success, validation pass or fail); **Wellbeing** (long-session flag, frustration-pattern flag). Hard rules: no personal data in Phase 1 events; in Phase 2 only under verifiable parental consent, tied to accounts you control, never sold, minimised by default.

## Appendix C — Module contract (module-sdk)

Every module implements a shared contract so the Hub can mount it and it inherits the spine.

```
interface LociModule {
  id: string;                    // e.g. "abacus"
  displayName: string;
  accentToken: string;           // design-system accent
  skillsAwarded: SkillId[];      // from Appendix A
  contributesToDaily?: boolean;  // feeds the daily challenge (memory, chess)
  mount(container: Element, ctx: ModuleContext): void;
}
interface ModuleContext {
  profile: ProfileApi;           // current child profile (local in v1)
  progression: ProgressionApi;   // award skill progress, read skill map
  srs: SrsApi;                   // schedule and fetch reviews
  ai: AIProvider;               // the gateway (never a vendor SDK)
  analytics: AnalyticsApi;       // emit events from the shared schema
  design: DesignSystem;          // shared components and tokens
}
```

Building a new module means implementing LociModule and using only ModuleContext for cross-cutting concerns.

## Appendix D — Glossary

- **Hub:** the shared home with profile, skill map, streaks, daily challenge, and the Guide.

- **Module:** one skill app within the ecosystem.

- **Wedge:** the sharp, shareable acquisition surface (daily challenge plus chess).

- **Moat:** the integrated, honestly-measured ecosystem that makes retention defensible.

- **The Guide:** the single AI tutor character shared across modules.

- **AI Gateway:** the internal abstraction that makes the model swappable across hosted, self-hosted, and on-device adapters.

- **Local-first:** data lives on the device with no server; the v1 default.

- **Skill Map:** the visible cross-module progress representation.

- **Tier (cost):** which of the four cost tiers (rule, cache, on-device, self-hosted) serves an AI task.

## Appendix E — Core data model sketch (local-first v1)

The minimum shared entities, stored in IndexedDB via data-local. Fields illustrative; finalise with the event schema (Appendix B). All ids are locally generated; nothing here leaves the device in Phases 0 to 3.

```
interface Profile {
  id: string;                 // local uuid
  displayName: string;        // parent-entered nickname
  avatarId: string;
  ageBand: "8-9" | "10-12";
  createdAt: number;
  settings: { audioPrompts: boolean; reducedMotion: boolean };
}
```

```
interface SkillProgress {
  profileId: string;
  skillId: SkillId;           // Appendix A taxonomy
  xp: number;                 // deterministic, module-agnostic
  level: number;
  lastAwardedAt: number;
}
```

```
interface SrsItem {
  id: string;
  profileId: string;
  moduleId: string;
  payloadRef: string;         // content-store item
  ease: number; intervalDays: number; dueAt: number;  // SM-2 class
  history: { at: number; recalled: boolean }[];
}
```

```
interface DailyChallengeResult {
  profileId: string;
  dateKey: string;            // YYYY-MM-DD, local
  challengeId: string;
  completed: boolean;
  scoreSummary: string;       // the glyph grid, precomputed
  shared: boolean;
  streakAfter: number;
}
```

```
interface ContentItem {
  id: string;
  moduleId: string;
  kind: "lesson" | "puzzle" | "passage" | "wordset" | "mnemonic";
  difficulty: number;
  packVersion: string;        // versioned offline packs (Section 5.9)
  validated: true;            // nothing unvalidated is storable
  body: unknown;              // module-defined, schema-checked
}
```

Rules: progression and SRS writes are transactional with a last-known-good snapshot (Section 5.9); deleting a profile deletes everything keyed to it; the Phase 4 sync layer maps these entities one-to-one so migration is mechanical, not a redesign.
