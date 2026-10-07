# Little Learners

A calm learning app for young children (now ages 2–3 only), used by a parent together with the child, in English and Hindi. This is a **separate app** from Loci: this branch (`little-learners`) has its own history and is never merged into `main`.

Built from *Little Learners: Product Spec for the Claude Code Build* (v2, 7 Oct 2026). Read `CLAUDE.md` for the learning principles and experience rules every change must follow.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (also reachable on your phone via the network URL)
npm run build      # validates content, type-checks, builds the offline PWA into dist/
npm run preview    # serve the production build
npm test           # Vitest
npm run e2e        # Playwright click-through (both languages)
npm run build:single   # one self-contained HTML file in dist-single/
```

If Playwright can't find its browser, set `CHROMIUM_PATH` to a Chromium binary.

**One audience:** the 1–2 age band was dropped. There is no age question; everything is shown to everyone, with a daily cap of 3.

## Status (spec build order)

| Step | State |
| --- | --- |
| 1 Project, PWA, Vitest, Playwright | done (Cloudflare Pages deploy not yet connected) |
| 2 Content packs + validator | done: 30 JSON packs, English and Hindi |
| 3 Reading screen, tabs, age band, daily cap, parent gate | done |
| 4 Audio: parent recording, device voice, first-tap unlock | done (volunteer pack audio plugs in via `audio` fields later) |
| 5 Games, bedtime, family photos, Said it!, weekly summary | done, plus letter tracing, Your turn, .ics reminder, WhatsApp share |
| 6 Click-through test | done (`e2e/smoke.spec.ts`) |
| 7 Voice service (`voice/`) | done: laptop API + ZeroGPU Space entry, tests; real model run on CPU once (see `voice/README.md`) |
| 8 Voice Studio in the app | not started |
| 9 Professional narration and art | not started; pictures are emoji placeholders |
| Subscriptions (US/Canada) | not started |

## Known gaps

- The prototype `little-learners.html` was not available, so pictures are emoji stand-ins, not the prototype's illustrations.
- All 6 folk tales are written. Content is 148 pages, above the spec's 136.
- All Hindi lines need review by a native speaker before any real use.

## Free hosting

`.github/workflows/pages.yml` builds the app and publishes `dist/` to the `gh-pages` branch on every push to `little-learners`. One-time setup: repo Settings → Pages → Source: *Deploy from a branch* → `gh-pages` / root. GitHub Pages on a private repo needs a paid plan; Cloudflare Pages (connect the repo, build `npm run build`, output `dist`) is free either way.
