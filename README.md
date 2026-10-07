# Little Learners

A calm learning app for children aged 1–3, used by a parent together with the child, in English and Hindi. This is a **separate app** from Loci: this branch (`little-learners`) has its own history and is never merged into `main`.

Built from *Little Learners: Product Spec for the Claude Code Build* (v2, 7 Oct 2026). Read `CLAUDE.md` for the learning principles and experience rules every change must follow.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (also reachable on your phone via the network URL)
npm run build      # validates content, type-checks, builds the offline PWA into dist/
npm run preview    # serve the production build
npm test           # Vitest
npm run e2e        # Playwright click-through (both languages, both age bands)
npm run build:single   # one self-contained HTML file in dist-single/
```

If Playwright can't find its browser, set `CHROMIUM_PATH` to a Chromium binary.

## Status (spec build order)

| Step | State |
| --- | --- |
| 1 Project, PWA, Vitest, Playwright | done (Cloudflare Pages deploy not yet connected) |
| 2 Content packs + validator | done: 30 JSON packs, English and Hindi |
| 3 Reading screen, tabs, age band, daily cap, parent gate | done |
| 4 Audio: parent recording, device voice, first-tap unlock | done (volunteer pack audio plugs in via `audio` fields later) |
| 5 Games, bedtime, family photos, Said it!, weekly summary | done, plus letter tracing, Your turn, .ics reminder, WhatsApp share |
| 6 Click-through test | done (`e2e/smoke.spec.ts`) |
| 7–8 Voice service and Voice Studio (Chatterbox) | not started |
| 9 Professional narration and art | not started; pictures are emoji placeholders |
| Subscriptions (US/Canada) | not started |

## Known gaps

- The prototype `little-learners.html` was not available, so pictures are emoji stand-ins, not the prototype's illustrations.
- Content is 133 pages versus the spec's 136: 3 of the 6 folk tales are written (Thirsty Crow, Big Turnip, Lion and Mouse). Little Red Hen, Tortoise and Hare and Clever Rabbit are still to do.
- All Hindi lines need review by a native speaker before any real use.
