import type { Babies, Band, Lang, Letters, Missions, PageData, Story, Text, Word, WordSet } from './types'
import type { Region } from './store'

const mods = import.meta.glob('./content/packs/*.json', { eager: true, import: 'default' }) as Record<string, any>
const all = Object.values(mods)
const ofKind = <T,>(k: string) => all.filter((d) => d.kind === k) as T[]
const forBand = <T extends { ages: number[] }>(xs: T[], b: Band) => xs.filter((x) => x.ages.includes(b))

export const wordSets = (b: Band) => forBand(ofKind<WordSet>('wordset'), b)
export const allWordSets = () => ofKind<WordSet>('wordset')
export const storiesOf = (kind: Story['kind'], b: Band) => forBand(all.filter((d) => d.kind === kind) as Story[], b)
export const getStory = (id: string) => (all.filter((d) => ['story', 'habit', 'bigday', 'rhyme'].includes(d.kind)) as Story[]).find((s) => s.id === id)!
export const missions = (b: Band) => forBand(ofKind<Missions>('missions'), b)[0].missions
export const babies = () => ofKind<Babies>('babies')[0].pairs
export const letters = () => ofKind<Letters>('letters')[0]

// ---- regional English: one pack, four countries ----
const US_MAP: [RegExp, string][] = [
  [/\bcolours?\b/g, 'color'], [/\bColours?\b/g, 'Color'], [/\bMum\b/g, 'Mom'], [/\bmum\b/g, 'mom'],
  [/\bnappy\b/g, 'diaper'], [/\bnappies\b/g, 'diapers'], [/\bplayschool\b/g, 'preschool'], [/\bPlayschool\b/g, 'Preschool'],
  [/\bPyjamas\b/g, 'Pajamas'], [/\bpyjamas\b/g, 'pajamas'], [/\bneighbour\b/g, 'neighbor'],
]
export function regional(s: string, lang: Lang, region: Region): string {
  if (lang !== 'en' || (region !== 'US' && region !== 'CA')) return s
  // Canada keeps "colour" and "neighbour" but says Mom, diaper and preschool.
  return US_MAP.reduce((acc, [re, to]) => {
    if (region === 'CA' && /colo|neighbo|yjama/.test(to)) return acc
    return acc.replace(re, to)
  }, s)
}
export const tr = (x: Text, lang: Lang, region: Region) => regional(x[lang], lang, region)

// ---- pages ----
const cap1 = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Every word is said twice ("Apple. Apple!") or with its sound ("Cow. Moo!"). */
export function wordPage(set: WordSet, w: Word): PageData {
  const mk = (l: Lang) => (w.sound ? `${cap1(w.word[l])}. ${w.sound[l]}` : `${cap1(w.word[l])}. ${cap1(w.word[l])}${l === 'en' ? '!' : '!'}`)
  return {
    key: `${set.id}/${w.id}`, image: w.image, caption: { en: mk('en'), hi: mk('hi') },
    action: w.action, word: w.word, wordKey: `${set.id}/${w.id}`,
  }
}
export const wordSetPages = (set: WordSet): PageData[] => set.words.map((w) => wordPage(set, w))
export const storyPages = (s: Story): PageData[] =>
  s.pages.map((p, i) => ({ key: `${s.id}/p${i + 1}`, image: p.image, caption: p.text, action: p.action }))

/** Four words that rotate daily; feelings and opposites teach better in context, so they are left out. */
export function todaysWords(b: Band, day: number): { set: WordSet; word: Word }[] {
  const pool = wordSets(b).filter((s) => s.id !== 'feelings' && s.id !== 'opposites').flatMap((set) => set.words.map((word) => ({ set, word })))
  return Array.from({ length: 4 }, (_, i) => pool[(day * 4 + i) % pool.length])
}
export const todaysMission = (b: Band, day: number) => { const m = missions(b); return m[day % m.length] }

export const wordLabel = (w: Word, lang: Lang, region: Region) => regional(w.word[lang], lang, region)
