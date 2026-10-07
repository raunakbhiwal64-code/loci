# Little Learners: rules for every change

A calm learning app for young children, used by a parent with the child, in English and Hindi. These sections come from the product spec (v2, 7 Oct 2026). When a feature idea conflicts with a rule, the rule wins.

**Decision after the spec (Oct 2026): one audience, ages 2-3.** The 1-2 age band is dropped and the app no longer asks the child's age. Everything the spec gave to either band is shown to everyone, the daily cap defaults to 3, and tapping a word or picture says its name aloud for all children. Wherever the sections below say 1-2 or 2-3, read it as this single audience. Content keeps its `ages` field so a younger band can return later.

## Learning principles

Every feature must pass these eight rules. When a feature idea conflicts with one, the rule wins.

1. **Do it together.** The app starts an interaction between parent and child; it never replaces one. Every page carries one prompt for the parent ("Touch your nose", "Find a cup at home").
2. **Act, don't just watch.** Each page asks for one action: point, copy a sound, move, find a real object. Passive tapping through pages is a failure.
3. **Repeat on purpose.** Short refrains ("Plop! Plop!", "Heave-ho!"), each word said twice, and the same 4 words returning across days. Repetition is how toddlers learn words.
4. **Real over screen.** Realistic, single-object pictures on plain backgrounds, then a mission that takes the word into the real world. Family photos beat drawings.
5. **Familiar voice.** A parent's or grandparent's voice beats a synthetic one. Narration order: recording, then cloned parent voice, then device voice.
6. **Calm by default.** One slow fade between pages, muted colours, no flashing, no sound effects beyond the story, nothing that plays by itself.
7. **Sessions end themselves.** A daily cap on activities (default 2 for ages 1-2, 3 for ages 2-3) leads to a "time to rest" screen. For under-2s, the app says to use it together, for a few minutes at a time.
8. **No pressure.** Games have two choices and no scores. A wrong tap gets a gentle "That one is banana. Try again!" and the next tap succeeds. No stars, streaks or badges.

## Experience rules

The app should feel like a calm picture book with a parent beside it. These rules are testable in QA.

**Age bands**

- The parent picks 1-2 or 2-3 on first launch; it changes only in parent settings.
- Ages 1-2 see words (6 sets), routines, rhymes, big days and games. No folk tales, colours, shapes, counting or opposites.
- Children aged 1-2 cannot read yet, so the 1-2 band never relies on text alone: when the child taps a word or picture, the app says the word's name aloud.
- Choosing 2-3 opens the Stories tab first; choosing 1-2 opens Words.
- Ages 2-3 practise writing with a finger: letter tracing happens on the touchscreen, never with a pencil, pen or stylus.

**Sessions**

- A finished item counts as one activity. The daily cap shows a "time to rest" screen and disables every card until midnight.
- Auto page-turning is off by default. Bedtime listening is the only mode that plays through, and it stops by itself.
- Today's words never uses feelings or opposites, which teach better in context.

**Reading screen**

- One picture, one caption (3 to 10 words), one action prompt, then three controls: back, listen, next.
- Tapping the picture replays the narration. Swipe left or right turns pages.
- In the 1-2 band, tapping a word or picture speaks the word's name aloud (audio naming on tap), because children that age cannot read.
- Each word is said twice ("Apple. Apple!") or with its sound ("Cow. Moo!").
- One 0.6 second fade between pages; nothing else moves. Respect the phone's reduce-motion setting.

**Parent gate and controls**

- Parent settings open only on a 1.2 second press-and-hold, so a toddler can't open them by tapping.
- Settings hold: age, voice, speed, daily limit, recording, cloned voice, family photos, weekly summary, sharing, reminders.

**Accessibility and languages**

- Touch targets at least 56 pixels; the main next button 92 pixels. Text at least 24 pixels on story captions.
- Light and dark themes; every control readable in both.
- English and Hindi are switchable from home. All UI text, captions, prompts and game lines exist in both.

**Regional English.** One English pack serves four countries, so a few words differ by region. The app picks the variant from the phone's region, and the parent can change it. Variants needed in V1: colour and color, Mum and Mom, nappy and diaper, playschool and preschool. Hindi needs no variants.

## Project conventions

- Content lives only in `src/content/packs/*.json` (one file per item). Never hard-code content in components. `npm run validate` fails the build on a missing translation, picture or action prompt.
- Everything stays on the device. No analytics, no third-party SDKs, no links out from child screens.
- Free, open-source libraries only.
- Run `npm test` (Vitest) and `npm run e2e` (Playwright click-through, both languages and both age bands) before pushing.
