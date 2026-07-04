# Loci — Master Product Requirements Document

### Cognitive Skills Ecosystem for children (8 to 12), v3.1 (full build specification)

A single consolidated PRD to be handed to Claude Code as the build specification, and to serve as the strategic source of truth. v2.0 committed to an acquisition wedge, growth mechanics, competitive positioning, kill gates, a cost model, and a risk register. v2.1 made it executable by a design and build pipeline (experience spec, numeric gates, NFRs, safety-filter spec, share mechanics, data model). **v3.0 is the complete build specification:** every module in Section 4 is now specified to feature level (curriculum, loops, feature lists split MVP vs later, AI tutor behaviour, content requirements, acceptance criteria); Gambit encodes the learnings of Lotus Chess and a full move-explanation tutor pipeline (Section 4.2); a Guardian safety-education layer teaches real-world and online safety (Section 6.4, curriculum in Appendix F); and the real-world-first stance is made a product system, not a slogan (Section 6.2). The build order in Section 8 and the gates in Section 11 are unchanged and still govern. **v3.1 adds the retention and relationship layer on top of the existing build:** a named companion (Section 6.5), a dark-pattern-free return system (Section 6.6), and the Growth Journey — the child’s adventure map and the parent’s honest progress report, deliberately replacing any notion of IQ/EQ scoring (Section 6.7). These are additive to the spine; nothing already built is invalidated.

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

- **Status:** exists; integrate onto the shared spine (profile, skill map, design components, Guide, SRS engine), do not rebuild. The spec below is the target feature set; audit the existing build against it and close gaps on the spine, not beside it.

**Curriculum (belts of technique, each unlocked by demonstrated recall):**

1. **Linking stories** — chain 5 → 10 → 15 items into one silly story; foundation for everything.
2. **The memory palace (method of loci)** — a starter palace (the child’s home: door, sofa, kitchen…), place 10 items on the journey, walk it back; then build custom palaces (school route, playground).
3. **Peg systems** — number–shape pegs (1 = candle, 2 = swan…) for ordered lists; number–rhyme as the alternative.
4. **Names and faces** — feature-linking (Mr Sharma has SHARP glasses); practice deck of illustrated faces.
5. **Number systems** — number–shape for short digits, then a child-sized major-system subset for phone numbers (deliberately feeds Guardian’s “memorise a parent’s phone number,” Section 6.4).

**Game modes:** Story Chain (linking drills), Palace Builder (place-and-walk with drag-and-drop rooms), Speed Recall (span under gentle time), Faces at the Party, Number Ninja. Every mode: learn → attempt → feedback → the recalled set enters the shared SRS for scheduled review.

**Feature list — MVP:** all five belts at first two difficulty tiers; three starter palaces; SRS integration for learned sets; recall-span tracking; daily-challenge contribution (a memory feat with glyph-grid result); Guide hints (Socratic: “what was next to the sofa?”). **Later:** custom palace photos (local only, never uploaded), duel mode (two profiles, one device), themed decks (dinosaurs, cricket, planets).

- **AI role:** suggest vivid mnemonic images and stories for the child’s own lists; generate themed practice decks. Pre-generate and cache the bulk; live calls only for personal suggestions. Review scheduling is deterministic (shared SRS), no model call.

- **Acceptance criteria:** a new child completes linking level 1 in under 5 minutes with zero reading required (Guide audio); recall span and review outcomes write to the skill map and SRS; every deck item passes the safety filter.

- **Primary metric:** recall span cleared per session; return rate to reviews.

### 4.2 Gambit — Chess and strategic thinking (P0) [W]

- **Cognitive target:** calculation, planning ahead, pattern recognition, patience, learning from mistakes.

- **Wedge role:** the strongest standalone acquisition wedge; culturally hot, inherently competitive and shareable; feeds a daily puzzle.

**Learnings adopted from Lotus Chess (and the gap we fix).** Lotus Chess proved a training model worth copying: spaced-repetition mastery of lines and patterns until they are automatic rather than one-shot lessons; teaching *practical* chess that punishes the mistakes real opponents actually make instead of engine-perfect theory; personalising the next lesson from weaknesses detected in the learner’s own games; a human-like opponent that makes plausible mistakes rather than random blunders; and fully offline lessons. Its most-criticised weakness is equally instructive: it teaches moves by memorisation with no explanation of *why*, leaving learners lost the moment the line ends. **Gambit adopts the mastery loop and fixes the explanation gap: every move a child is taught can be asked “why?”, and every mistake a child makes gets a child-friendly explanation of why it was bad.** That tutor is the module’s soul and its differentiator.

**Curriculum (journey of belts):**

1. **The pieces and their powers** — movement, capture, value; Capture Quest mini-games per piece.
2. **Rules of the game** — check, checkmate, stalemate, castling, promotion, en passant (late).
3. **Baby tactics** — hanging pieces, counting attackers vs defenders, escape from check.
4. **The big four tactics** — fork, pin, skewer, discovered attack; heavy puzzle drilling, each pattern on the SRS until automatic.
5. **Checkmates** — back-rank, mate in 1 → mate in 2, queen + king and rook + king endgame mates (play them out against the engine, Lotus-style “convert the win”).
6. **Opening principles, not opening lines** — centre, develop, castle, don’t move the same piece twice, punish early-queen attacks (Scholar’s Mate defence is a named lesson, it is the most common kid-level trap); a tiny practical repertoire (Italian-style setup as White, solid symmetric reply as Black) taught with a why for every move.
7. **First strategy** — good vs bad trades, open files, pawn structure basics, when to attack.

**Play modes:** Puzzle Path (curriculum-linked puzzles from the Lichess CC0 database, filtered to child bands, re-rated internally); Daily Chess Puzzle (feeds the Hub daily challenge); Play the Bot (strength-limited human-like opponent with named personas of increasing strength — the engine plays plausibly-imperfect moves, not random blunders); Guided Game (the Guide watches and offers optional nudges); Boss Games (beat a persona to earn the next belt); pass-and-play on one device (two children, zero networking).

**The move tutor — “why was that move bad?” (the core AI spec):**

1. **Evaluate deterministically.** Stockfish WASM scores the played move against the top engine choices (multi-PV 3, fixed movetime), giving an eval delta.
2. **Classify severity** with thresholds scaled to the child’s internal rating (what counts as a blunder for a beginner is gentler than for an advanced child); label inaccuracy / mistake / blunder, but surface child-friendly language (“oops,” “trap!”), never shaming.
3. **Diagnose with a deterministic mistake taxonomy** computed from the position, no model needed: hung a piece (undefended capture available), missed a free capture, missed a tactic (fork/pin/skewer/mate-in-N present in the best line), walked into a fork or pin, ignored the opponent’s threat, weakened the king, lost a tempo, bad trade (value counting). The taxonomy label plus the concrete squares and pieces involved form a structured fact sheet.
4. **Explain via the Gateway.** The fact sheet goes to the model with a strict template; the model’s only job is turning verified facts into one or two warm, plain sentences (“Your knight moved to a square where the bishop could take it for free — before you move, check who can capture the square you’re landing on”). The model never invents chess analysis; the engine and taxonomy did the analysis. Output is schema-checked and safety-filtered like all Gateway text.
5. **Socratic ladder before answers.** In guided play the tutor asks first: “Something of yours is in danger — can you spot it?” → “Look at your knight” → full explanation. Hint depth adapts to the child’s hint history.
6. **Post-game review.** Three key moments per game (the biggest swings), each replayable with the explanation; ends with one thing done well and one pattern to practise, which links straight to a puzzle set and joins the SRS.
7. **Economy.** Explanations cache by (position hash, move, band); the common beginner mistakes are pre-generated — the same few hundred traps account for most kid games, so the cache hit rate here should be the highest in the ecosystem.

**Feature list — MVP:** belts 1–5, Puzzle Path, daily puzzle, three bot personas, move tutor steps 1–4 and 6, pass-and-play, tactic SRS. **Later:** belts 6–7, Socratic hint ladder tuning, more personas, weakness-driven lesson picking (Lotus-style personalisation computed from the child’s own internal games — never imported accounts), opening mini-repertoire with why-annotated moves on the SRS.

- **Acceptance criteria:** engine runs fully client-side and offline after first load; a hung-queen game produces a correct, kind, taxonomy-grounded explanation with zero hallucinated squares (validated by an automated test suite of scripted games); puzzles are solvable and rated; a complete beginner reaches “can checkmate with queen + king vs king” through belts alone.

- **Primary metric:** internal puzzle rating; puzzles or games per week; repeat-mistake rate falling per taxonomy category (the direct measure that the tutor teaches).

### 4.3 Abacus — Mental math and Vedic techniques (P0) [M]

- **Cognitive target:** mental arithmetic, number sense, estimation, speed and accuracy under light time pressure.

- **Moat role:** highest parent-trust and willingness-to-pay module; its progress chart is the strongest parent-facing artefact and the anchor of any future subscription. In India, “Vedic maths” and “abacus classes” are categories parents already pay for; this module gives them free, honest, measurable.

**Curriculum (technique tracks, each: see it → guided practice → timed drill → mixed review on SRS):**

1. **Number sense foundations** — complements to 10 and 100 (the workhorse of everything), doubling and halving, rounding and estimation (“is the answer bigger or smaller than 500?”).
2. **Addition and subtraction craft** — left-to-right addition, compensation (add 99 by adding 100 minus 1), Nikhilam-style subtraction from bases (all-from-9-last-from-10).
3. **Multiplication craft** — tables as patterns not chants; Ekadhikena (squares ending in 5); Nikhilam multiplication near a base (98 × 97); doubling chains (×4, ×8); ×11 pattern; Urdhva-Tiryagbhyam (vertically-and-crosswise) as the general two-digit method, taught visually.
4. **Mental abacus visualisation** — the beads as a mental image: flash a bead pattern, read the number, then compute on the imagined abacus; bridges to working-memory training (skill-map crossover with Memora).
5. **Division and fractions intuition** — halves/quarters, sharing problems, remainder sense (P1 within the module).
6. **Applied numeracy** — money (rupees and change), time and calendars, estimation in the wild (word problems from the AI, always answer-verified deterministically).

**Game modes:** Technique Dojo (guided lessons with animated worked examples), Sprint (60–90 second drills, problems-per-minute at fixed accuracy), Beat Your Ghost (race your own previous run — competition with self only, per Section 6.2), Bead Flash (mental-abacus mode), Word-Problem Quests (AI-generated, level-matched, deterministic answer check), Estimation Duel (closest-guess rounds).

**Feature list — MVP:** tracks 1–3 and Sprint + Dojo + Beat Your Ghost; adaptive difficulty (success-rate held in the 70–85 percent flow band); SRS mixed review of learned techniques; per-technique mastery chart (the parent artefact). **Later:** tracks 4–6, Bead Flash, word-problem quests, printable practice sheets (a parent-pleaser and an offline bridge).

- **AI role:** generate level-matched word problems (answers verified by computation before serving, never trusted from the model), Socratic hints, and explain the specific error (“you added the tens twice — watch: 47 + 30 first, then + 5”). Error explanation uses the same fact-sheet pattern as Gambit: the drill engine knows exactly which step broke; the model only phrases it.

- **Acceptance criteria:** all scoring, adaptivity, and answer-checking deterministic and offline; a technique lesson is completable without reading (Guide audio + animation); problems-per-minute chart renders per technique and over time.

- **Primary metric:** problems per minute at a fixed accuracy threshold, per technique, over time.

### 4.4 Cortex — Logic and reasoning (P0) [M]

- **Cognitive target:** deductive reasoning, inductive reasoning, basic lateral thinking, and the habit of checking one’s own reasoning.

**Puzzle catalogue (each type has a deterministic generator + solver; nothing unsolvable or multi-solution ever ships):**

- **Deduction:** logic grids (“who owns the parrot?” — 3×3 up to 5×5), knights-and-knaves (truth-tellers and liars, sized for the band), Sudoku family (4×4 → 6×6 → 9×9, plus Futoshiki-lite), Nonograms/picture logic (rewarding: solving reveals a picture), Mastermind-style code-breaking.
- **Induction:** number sequences, shape-pattern completion, odd-one-out with a stated reason (the child picks *why*, not just which — this is where reasoning is actually taught), analogy grids (visual matrix reasoning, taught honestly as pattern craft with no IQ framing, per Section 1.3).
- **Lateral (light):** one-move rearrangement puzzles, “what’s the trick?” riddles from an authored, curated pool (not AI-generated — riddles are where generation quality fails worst).

**Core loop:** pick a puzzle type → solve at increasing difficulty → unlock the next type → optional “show me the reasoning” after every solve. The explanation is the pedagogy: every puzzle can replay its own solution as a chain of deductions (“the parrot can’t be Maya’s because clue 2 says…”), generated from the solver’s actual solve path, phrased by the model, verified against the solver trace.

**Feature list — MVP:** logic grids, sequences, odd-one-out-with-reason, Sudoku 4×4/6×6, graduated hint ladder (reveal a relevant clue → narrow the options → show the step), hint-free-solve tracking, difficulty ladder per type. **Later:** knights-and-knaves, nonograms, code-breaking, daily logic bite feeding the Hub challenge, authored riddle pool.

- **AI role:** generate puzzles *into* the validated library (every generated puzzle must pass the solver for uniqueness and difficulty before a child can see it), phrase graduated hints and post-solve reasoning from solver traces. At request time almost everything is cache or deterministic.

- **Acceptance criteria:** solver validates uniqueness and grades difficulty for every item in the store; hint ladder never skips to the answer; post-solve explanations match the solver trace exactly (automated check).

- **Primary metric:** highest difficulty cleared per type; hint-free solve rate.

### 4.5 Tangra — Spatial reasoning (P1) [M]

- **Cognitive target:** mental rotation, 2D and 3D visualisation, decomposition.

**Activity catalogue:** classic tangrams (silhouette → place the seven pieces; difficulty = silhouette ambiguity), rotation match (“which of these is the same shape turned?”), nets and folding (which net folds into this box — start physical-feeling with animation payoff), mazes (plan-ahead scored: fewest wrong turns), block-count and hidden-cubes (count cubes in a 3D stack), symmetry draw (complete the mirror image on a grid).

**Feature list — MVP:** tangrams, rotation match, mazes, per-type ladders. **Later:** nets/folding with 3D fold animation, block-count, symmetry draw, printable tangram sheet (cut real pieces — a Real-World Quest tie-in, Section 6.2).

- **AI role:** minimal by design; geometry generation and validation are deterministic. The economy module.

- **Acceptance criteria:** every generated silhouette is solvable with the seven pieces (solver-checked); drag/rotate interactions hit the 100 ms input budget on the floor device.

- **Primary metric:** difficulty cleared; average moves or wrong turns to solution.

### 4.6 Lexicon — Verbal reasoning and vocabulary (P1) [M]

- **Cognitive target:** vocabulary in context, analogies, classification, verbal reasoning, word play.

**Core systems:** the **Word Collection** (every mastered word is a collectible card: meaning, picture, example sentence, “use it today” prompt — collection mechanics without loot-box mechanics), words always met **in context first** (a two-line micro-story) then tested; analogy builder (hot : cold :: big : ?), odd-one-out with stated reason, classification sorts, word-play modes (anagram garden, word ladders, rhyme time for the younger band).

**Feature list — MVP:** word collection with band-levelled starter packs (authored + AI-generated, human-reviewed), context micro-stories, analogy and odd-one-out drills, SRS review of the collection (the module is the SRS’s second-biggest client after Memora). **Later:** word ladders, anagram modes, “word of the day” feeding the Hub, cross-module cameo (learned words appear inside Abacus word problems and FocusRead passages — the ecosystem visibly compounding).

- **AI role:** generate example sentences, child-appropriate definitions, micro-stories, and analogy sets — batch-generated, reading-level checked deterministically, safety-filtered, human-spot-checked into the content store. A natural first workload for the self-hosted model.

- **Acceptance criteria:** every word item carries band level, verified definition, and passing safety check; SRS intervals shared with the global engine; no duplicate words across packs.

- **Primary metric:** words mastered and retained on review; analogy accuracy.

### 4.7 FocusRead — Reading and attention (P2, ship last) [M]

- **Cognitive target:** reading comprehension, reading pace, sustained and selective attention, working memory under reading load.

- **Why last:** attention is the easiest place to overclaim. Ships when the brand and AI layer are mature. Framed strictly as focus and reading practice, never treatment, never anything ADHD-adjacent in claim or copy.

**Activity catalogue:** levelled passages (fiction and curiosity non-fiction) with comprehension checks (literal → inferential → “what happens next?” prediction), read-along pace mode (gentle highlight pacing, always adjustable, never punitive), find-the-detail (selective attention: locate the answer in the text), story-order (sequence scrambled events), listen-then-answer (audio passages for pre-fluent readers — also the accessibility bridge).

**Feature list — MVP (when its phase arrives):** passages at 4–5 reading levels with deterministic level validation, literal + inferential questions, find-the-detail, listen mode. **Later:** pace mode, prediction questions, passage series (returning characters — a retention device), Lexicon word cameos.

- **AI role:** generate level-matched passages and questions (reading level validated deterministically before storing; answers verified against the passage), summarise reading growth for the parent in plain language.

- **Acceptance criteria:** every passage carries a validated reading level and answerable questions (QA harness confirms answers exist in text); audio available for every item; zero clinical or attention-disorder vocabulary anywhere in module copy.

- **Primary metric:** comprehension accuracy at a given reading level; sustained reading time (reported neutrally, never gamified upward, per Section 6.2).

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

**The real-world-first stance (founder position, made into product systems).** The founding position is that children should live in the real world; this product exists because *if* a child is on a screen, that time should count for something. That stance is not a settings toggle, it is brand and mechanics:

- **Sessions end well.** The standard session-end state celebrates finishing and points outward: “Done for today! Go play outside 🌳.” Finishing is the win state, not a nag. A gentle daily soft-cap closes the session celebratorily when reached; it never mid-interrupts an activity.

- **Real-World Quests.** A weekly offline mission earns skill-map progress for *leaving* the app: teach a family member the memory palace; play chess with a real person on a real board; memorise the shops on your street; cut paper tangram pieces and solve one by hand; time yourself doing mental sums at the market. Parent taps to confirm completion. Quests are the only progress source that requires no screen time, which makes the stance legible in the product itself.

- **The manifesto.** A public page: “We think children should live in the real world. If they’re on a screen, it should count for something.” This is positioning no engagement-maximising competitor can copy without gutting their model; it belongs on the site, in the Grown-ups Corner, and in the parent-facing share loop.

- **Honest time reporting.** The parent view reports time neutrally and celebrates *low, consistent* usage patterns; the wellbeing monitor (Section 10.6) flags overuse for break-encouragement, never for engagement recovery.

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
| 11 | Grown-ups corner | Parent trust surface (pre-dashboard) | Behind a simple adult gate: what each module trains, the honesty stance, privacy posture, wellbeing settings, Guardian co-cards, the manifesto. Plain language. Not a dashboard yet. |
| 12 | Wisdom card (component) | Guardian micro-lesson at session end | Illustrated, read-aloud, 15 seconds, one/day max, skippable. Section 6.4. |
| 13 | Scenario player | Guardian “What Would You Do?” | Uses the shared activity player: illustrated setup → choices → warm feedback. Section 6.4. |
| 14 | Real-World Quest card | Weekly offline mission | In Hub; parent confirm tap; awards skill-map progress. Section 6.2. |
| 15 | Companion intro & naming | Meet and name the Guide at first run | Part of first-run; one friend across all modules. Section 6.5. |
| 16 | Adventure map (child) | The Growth Journey, child-facing | Regions/belts, companion travelling along, next-stop visible. Section 6.7. |
| 17 | Parent report | The Growth Journey, parent-facing | Behind adult gate: cognitive radar + learning character + safety, plain language, honesty statement. Section 6.7. |
| 18 | Milestone / certificate | Genuine milestone celebration | Shareable; feeds the parent share loop. Section 6.6. |

**Flows to design first, in order:** (1) first run → first completed activity (the activation gate lives here; target under 60 seconds to play, zero reading required to start); (2) daily challenge → result → parent share → recipient opens deep link → plays today’s challenge (the growth loop end-to-end); (3) Memora session on the spine: Hub → module → activity → summary → skill map updates → next-day review appears (the retention loop); (4) second-module discovery: how the Hub invites a Memora child into Gambit (the cross-module gate).

**Design principles binding the pass:** every screen readable aloud by the Guide for pre-fluent readers; one primary action per screen; progress always visible, loss never dramatised; large targets, minimal text, WCAG AA; parchment-and-ember warmth with per-module accents (Section 6.1); nothing that resembles a feed, a countdown-pressure timer, or a shame state.

### 6.4 Guardian — the safety education layer (Hub-level, not a module)

**Purpose.** Children on Loci also learn to be safe in the real world and online. Guardian is a thin, warm layer woven through the Hub — not a preachy module a child would never open, and never interruptive pop-ups mid-play (fear-flavoured interruption is exactly the anxiety pattern Section 6.2 bans).

**Principles (binding):**

- **Same core curriculum for every child.** Rules are not gated or varied by gender, and gender is not collected — the age band already held (Appendix E) tunes tone and depth. This is both better protection (all children face these risks) and consistent with data minimisation (Sections 5.8, 13).

- **Empowering, never frightening.** Every card teaches what a child *can do* (“you’re allowed to say NO loudly”), never dwells on what could happen to them. Tone is the Guide’s: calm, warm, capable.

- **Evidence-shaped content.** The curriculum follows established child-safety education practice: “tricky people” and check-first framing rather than blanket stranger-danger (children may need a stranger’s help when lost); the underwear rule; surprises-vs-secrets; tell-and-keep-telling. Content is reviewed by a child-safety educator before shipping (a named gate below).

- **Parents in the loop.** The highest-stakes topics (body safety) land best from a parent; Guardian is designed to prompt that conversation, not replace it.

**Delivery mechanics (four, all at natural moments):**

1. **Wisdom cards.** One illustrated 15-second safety micro-lesson at the session-end screen — the natural “finished” moment. Read-aloud by the Guide, one per day maximum, sequenced through the curriculum (Appendix F), skippable without penalty.

2. **“What Would You Do?” scenarios.** Interactive mini-situations in the shared activity player: a short illustrated setup (“A man at the park says he lost his puppy and asks you to help look…”), two to three choices, warm feedback that explains the safe move and *why*. Scenario practice is retained far better than passive tips. One scenario pack per curriculum theme; occasionally (about weekly) a scenario is the daily challenge — and the share card becomes “we did our safety drill,” a parent-shareable growth asset.

3. **Safety on the SRS.** The genuinely novel piece: the facts a child must *retain* — a parent’s phone number, the home area, 112 (India’s emergency number), the five lost-rules — are scheduled on the shared spaced-repetition engine like any learned item, rehearsed to real memory. Memora’s number-pegging belt explicitly feeds this (learn the technique, apply it to the phone number).

4. **Parent co-cards.** For flagged topics a matching card appears in the Grown-ups Corner: “Talk about this together tonight,” with a one-paragraph script starter. Wisdom cards on those topics tell the child “this one is great to talk about with your grown-up.”

**Content rules:** every Guardian item is authored (never live-generated), safety-educator reviewed, versioned in the content store, and passes the standard filter; scenarios never depict explicit harm — the wrong choice resolves as “that’s what a tricky person might hope you’d do — here’s the strong move,” never as a bad outcome shown; no imagery of distressed children.

**Data and events:** Guardian emits only standard activity events (card served/completed, scenario choice pattern in aggregate, SRS recall of safety facts). It never stores free-text from children and adds no new personal fields.

**Build placement:** the card component and scenario pack format land with the spine (Phase 0 design-system + content store); the first Wisdom-card sequence and one scenario pack ship in Phase 1 with the daily challenge; SRS safety facts activate with Memora’s integration; co-cards ship with the Grown-ups Corner. **Gate:** no Guardian content ships without child-safety-educator review, and the curriculum (Appendix F) is re-reviewed annually.

**Metrics:** curriculum coverage per profile; safety-fact retention on SRS (the honest effectiveness number — “children who use Loci can recall their parent’s number and the five lost-rules”); scenario first-try safe-choice rate rising over the sequence; parent co-card open rate.

### 6.5 The companion — a friend who learns alongside them

The Guide (the AI layer, Section 4) becomes a **named companion** the child meets and names at first run — one friend across the entire ecosystem, which is also what makes seven modules feel like one world rather than a menu. The companionship comes from warmth, memory, and timing, not from open-ended chat (scope boundary below).

**What the companion does:**

- Greets the child by name; remembers where they left off (“want to finish the palace we started?”).
- Reads everything aloud for pre-fluent readers (the accessibility spine, too).
- Coaches Socratically — hints before answers, depth tuned to the child’s hint history (Sections 4.2, 4.4).
- Celebrates specifically and honestly (praise rules below); reframes mistakes as growth.
- Responds to what the child *does*: a struggle streak (“this one’s tricky — let’s slow down together”), a comeback (“you got it after three tries — that’s exactly how brains grow”), a return after absence (“I missed you! Ready for today?”).
- **Is the voice of the real-world stance** — it’s the companion who says “you’ve done brilliantly today, now go play outside 🌳.” Making the friend the agent of *leaving* is what stops the friend becoming a lure to stay (Section 6.2).

**Confidence through the right kind of praise (evidence-based, binding).** Praise **effort and strategy**, never the trait: “you tried three different moves,” “you used the palace trick,” “you didn’t give up” — never “you’re so smart” or “you’re a genius.” Trait-praise makes children *less* resilient and more afraid to fail; process-praise builds the growth mindset that keeps them attempting hard things. Every celebration is (a) specific, (b) earned by a real event, and (c) tied to visible evidence on the skill map — durable confidence comes from real, visible competence, not confetti.

**Scope boundary (safety + wellbeing, binding).** The companion responds to what the child does — plays, taps, struggles, returns — **not to free-typed messages**. There is no open-ended child-to-AI chat in v1: it is the highest-risk output surface in children’s software, it invites PII, and an “always-there friend” a child pours themselves into is a parasocial dependence that displaces the real friendships and family the product exists to protect. All companion speech is template-scoped, structured, cached where possible, and safety-filtered (Section 5.5). Any future expansion of child input is a deliberate, separately-designed and separately-reviewed project — never a silent addition.

**Persona:** warm, playful, a little wise, never saccharine; encourages, never nags; endorses stopping. One consistent voice and visual across modules; the child’s chosen name for it persists in the profile (no other personal data).

### 6.6 The return system — retention without dark patterns

Retention here means one thing: **a child chooses to come back to a short daily ritual and keeps learning.** It never means time-on-device. Every mechanic optimises for consistent return, not session length, and the refusals below are what make “retention” safe to say in a children’s product.

**Loop 1 — within-session: finish feeling clever.** The strongest driver is the emotion the child leaves with. Adaptive difficulty holds success in the 70–85 percent flow band (too hard → quit, too easy → bored); every session ends on an earned win and the “go play outside” close; celebration is specific (Section 6.5). The child associates Loci with *feeling capable* — the association that brings them back tomorrow.

**Loop 2 — daily: the honest habit loop.**

- The **finite daily challenge** is the anchor ritual (Section 6.2), same slot, satisfying, minutes long; its source rotates across modules so it never gets stale.
- **SRS reviews due today** are the honest engine: the reason to return *is* the learning goal (shared SRS, Section 5). “3 reviews ready” is a real reason, not a manufactured hook — the child returns and genuinely retains more.
- **Tomorrow’s teaser** on the session-summary screen reveals what’s next (a new palace, a new puzzle type) — anticipation, not FOMO.
- **Forgiving streaks** track consistency (freezes, weekly “5 of 7” targets, “you were missed” on return) and **never destroy progress or shame a lapse** (Section 6.2).
- The companion’s **welcome-back** moment (Section 6.5).

**Loop 3 — weekly and long-term: the journey worth continuing.**

- **Skill-map belts** always show a visible near-goal (“2 puzzles from Level 4 Memory Explorer”) — the pull of a nearly-complete goal (Section 6.7).
- **Collections** with genuine value: word-cards, built palaces, mnemonic decks the child made — real accumulated work, so returning protects something they built, not a fake trophy.
- **Genuine milestones** (100 words, first checkmate, a 30-day journey) celebrated with a shareable certificate — which also feeds the parent share loop (Section 2).
- **Real-World Quests** — the weekly offline mission the child still returns to log (Section 6.2), reconciling retention with the real-world stance.
- **Seasonal / festival content packs** (a Diwali puzzle pack, a summer-holiday palace) — freshness fights boredom-churn. This is *content variety*, deliberately distinct from variable-ratio reward.

**Retention channels — who brings the child back.**

- **The child** — companion, visible progress, anticipation (above).
- **The parent — a retention channel, not just a report.** A parent who sees progress sets up the session, celebrates, and re-engages a lapsed child. The weekly digest (Section 6.7) and a gentle, opt-in “Aarav hasn’t practised this week — here’s a 5-minute quest to do together” nudge make the buyer an ally in the habit. Return nudges go to the **parent**, never as marketing notifications to the child.
- **The content** — rotating daily source, new packs, seasonal drops keep the world alive.

**The hook model, deliberately amended.** The standard trigger → action → reward → investment retention loop is used with its most-abused element removed: the **reward is predictable and earned, never variable/slot-machine**, and “investment” is *real* accumulated learning (SRS memory, collections, built palaces), not sunk-cost gimmickry. Predictable earned reward plus genuine progress retains children honestly; intermittent reward exploits them.

**What we refuse (binding — the retention banned-patterns list):**

- No variable-ratio / slot-machine / loot-box rewards.
- No FOMO countdown timers; no “your streak dies in 2 hours” pressure.
- No notification spam; no notifications engineered to pull a child back mid-life — child-return nudges go to the parent.
- No leaderboards or rankings against other children (competition is with self only — Beat Your Ghost, Section 4.3).
- No pay-to-progress, no energy/lives-refill purchases, no advertising, ever (Sections 5.8, 13).
- Nothing that optimises for session length or daily time-on-device.

Reconciliation with the founder stance (Section 6.2): every mechanic pulls toward *coming back tomorrow for a short ritual*, none toward *staying longer today*. Retention and the real-world-first stance are the same policy seen from two sides.

### 6.7 The Growth Journey — the child’s adventure and the parent’s report

One progression system, two audiences: an adventure map for the child, a credible progress report for the parent. Both read the same underlying skill/level data (Appendix A, Appendix E); neither invents a number.

**What is reported — honest dimensions the app actually trains and observes.** IQ and EQ are deliberately **not** reported: neither can be measured from gameplay, and claiming to raise “IQ” from brain-games is precisely the claim the FTC penalised Lumosity for. The trustworthy report — in a market full of ones parents can’t trust — covers only what Loci genuinely trains and can see:

- **Cognitive Skills (the across-the-board view, a radar):** Memory, Mental Math, Logical Reasoning, Spatial Reasoning, Language & Vocabulary, Focus & Reading, Strategic Thinking. Each maps to a real metric already specified — recall span, problems-per-minute, puzzle difficulty cleared, reading level, internal chess rating, and so on (Section 4).
- **Learning Character (the honest stand-in for “EQ,” observed from gameplay — never a fabricated emotion score):** perseverance (retries after a failure), focus (session completion, sustained attention), handling mistakes (recovery after error), curiosity (breadth of modules and content explored), patience (thinking time before acting). All are behaviours the telemetry actually sees (Appendix B).
- **Safety Awareness (uniquely trust-building):** Guardian curriculum coverage and safety-fact retention on the SRS (Section 6.4). No competitor shows a parent this.

**The journey framing.** Each dimension is a visible belt progression the child travels — “Level 3 Memory Explorer → next stop: Peg Systems.” The child sees an **adventure map** (regions to explore, belts to earn, the companion travelling with them); the parent sees the **same data as a progress report** (strengths, current levels, growth over time). Strengths are celebrated; gaps are framed as “next adventures,” **never** as red, failing, or behind.

**Parent report contents (behind the adult gate):** the cognitive radar and character view in plain language; what each dimension means and how it is measured (transparency builds trust); recent milestones; suggested Real-World Quests to extend a strength or shore up a gap; Guardian coverage; the honesty and privacy statement. Written for a proud, slightly-anxious parent — clear, warm, jargon-free.

**Guardrails (binding):**

- No IQ, no EQ, no g-factor, no single “brain score.”
- No normative comparison to other children (“ahead of / behind X%”).
- No clinical or diagnostic language, ever (no ADHD, dyslexia, giftedness, disorder).
- Every report states plainly: **this is a record of learning progress in the app, not a psychological or clinical assessment.**
- Parent-gated; adds no new personal data; the child’s view carries no numbers that could shame.

**Phasing.** v1 (Phases 1–3): a **local snapshot** — current levels and the journey map, computed on-device from the profile. v2 (Phase 4, with the backend): **longitudinal trends** and an opt-in **weekly email digest** (“Aarav’s week: memory up a level, first checkmate, focus steady — try this weekend’s quest”), which is also a primary re-engagement channel (Section 6.6). The digest never contains child free-text and follows the same privacy posture (Section 5.8).

**Metrics:** parent report open rate; digest → child-return rate (the retention contribution); and, as the honest north star, the share of children showing real measured growth on the dimensions over time.

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
| Sessions per week (active profile) | ≥ 3 | retention health |
| SRS reviews completed (of those due) | ≥ 50% | Phase 3 (honest retention) |
| Return-after-lapse (returns within 7 days of a 3+ day gap) | ≥ 25% | retention health |
| Parent digest → child return within 48h | ≥ 15% | Phase 4 |
| Mistake-recovery rate (retry and succeed after a failure) | rising over time | confidence proxy |

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
| 10 | Guardian content frightens children or misteaches safety | Severe (trust, wellbeing) | Low if gated | Authored-only content; child-safety-educator review gate before any Guardian item ships; empowering-never-frightening rule; annual curriculum re-review (Section 6.4) |
| 11 | Parasocial dependence on the companion displaces real relationships | Medium-High (wellbeing, brand) | Medium | No open-ended child chat; companion endorses stopping and points outward (Sections 6.5, 6.2); wellbeing monitor flags overuse (Section 10.6) |
| 12 | Retention mechanics drift into engagement dark patterns | High (contradicts brand, harms children) | Low if enforced | Binding banned-patterns list (Section 6.6); optimise for return-to-ritual not time-on-device; no variable rewards, no child-facing FOMO or notifications |
| 13 | Parent report misread as an IQ / clinical assessment | High (trust, legal — the Lumosity trap) | Low if gated | No IQ/EQ/brain-score, no peer comparison, no clinical language; every report states it is learning progress, not assessment (Section 6.7) |

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
| Safety awareness (real-world and online) | Guardian layer (Hub-wide), SRS safety facts, Memora (number pegging) |

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

## Appendix F — Guardian safety curriculum bank (v1)

The authored message bank behind Wisdom cards, scenarios, and SRS safety facts (Section 6.4). Sequenced roughly easiest-first; every item ships only after child-safety-educator review. Age band tunes wording, not substance. India-first details (112, OTP) noted; localise per geography with the same review gate.

**Theme 1 — If you’re ever lost (the five lost-rules; all five are SRS facts):**

1. Stop and stay where you are — you’re easiest to find when you don’t move.
2. Look around: can you see your grown-up if you stand tall and still?
3. If you need help, find a **mum with children** or a **worker in uniform at a counter** — don’t wander searching.
4. Say your grown-up’s **name and phone number** (this is why we memorise it!).
5. Never leave the place — not with anyone — until your grown-up comes.

Supporting cards: agree a meeting spot whenever you arrive somewhere crowded; know your home area and one parent’s full name; 112 is the emergency number (SRS fact).

**Theme 2 — Tricky people (check-first, not stranger-fear):**

- Safe adults don’t ask children for help. A grown-up who has really lost a puppy asks another grown-up. If an adult asks *you* for help — that’s a tricky sign.
- The check-first rule: never go anywhere with anyone — even someone you know — without checking with your grown-up first. No exceptions, no matter what they say.
- You are allowed to say **NO** loudly, run, and tell — even to an adult, even if it feels rude. Being safe beats being polite.
- Tricky people might say “it’s an emergency” or “your mum sent me.” Families can set a secret **code word**; no code word, no going. (Parent co-card: choose your family code word tonight.)

**Theme 3 — My body, my rules (parent co-card on every item):**

- The underwear rule: the parts under your underwear are private. Nobody looks, nobody touches, and nobody asks you to — and nobody asks you to look or touch either.
- Surprises are okay — they get told soon and make people happy. **Secrets from your parents are not okay** — especially “don’t tell your mum or dad.” A grown-up who asks you to keep that kind of secret is being tricky.
- You can say no to hugs and kisses, even from relatives. A high-five or a wave is always allowed instead.
- If something felt wrong, it is **never your fault**. Tell a grown-up you trust — and if they don’t listen, keep telling until someone does.
- The uh-oh feeling: that funny feeling in your tummy when something seems wrong is information. Trust it and tell someone.

**Theme 4 — Safe online (natural fit — they are on a screen right now):**

- Your real name, school, address, and photos in school uniform stay off the internet.
- People online can pretend to be **anyone** — even another kid. You can never be sure who’s really typing.
- Never meet up with someone you only know from online, and never move a chat to a “secret” app because someone asked.
- Passwords and **OTPs are like house keys** — never share them with anyone, even someone who says they’re “customer care” or “the bank.”
- “Free coins! Free skins! Just click!” — that’s how tricks look. Don’t click; show a grown-up.
- If anything online makes you feel weird or scared: screenshot, block, and tell your grown-up. You will never be in trouble for telling.

**Theme 5 — Everyday smart (home and street):**

- Home alone: the door stays closed, and on the phone say “Mum can’t come to the phone,” never “I’m alone.”
- Answer the door only with a grown-up’s okay — even if the person says they’re a delivery or repair person.
- Cross where you can see and be seen; put the screen away while walking or crossing (yes, this app too — Section 6.2 means it).
- Fire or smoke: get out first, tell a grown-up, call 112 — things can be replaced, you can’t.
- Know two trusted adults outside your home you could go to (a neighbour aunty, a shopkeeper you know). (Parent co-card: agree who they are.)

**SRS safety-fact set (drilled to memory, not just shown):** parent’s phone number · home area/address line · 112 · the five lost-rules · the family code word exists (never the word itself stored — the child rehearses “we have one and I know it”) · the underwear rule one-liner · surprises-vs-secrets one-liner.

**Scenario pack seeds (one pack per theme):** the lost-in-market walkthrough; the puppy-help ask; the “your mum sent me” pickup; the uncomfortable-hug refusal; the online “free skins” DM; the stranger-at-the-door knock. Each: setup → 2–3 choices → warm feedback naming the rule used.
