import { useSyncExternalStore } from 'react'
import { clearBlobs, delBlob } from './idb'
import type { Band, Lang } from './types'

export type Region = 'UK' | 'US' | 'CA' | 'IN'
export interface Settings {
  lang: Lang
  band: Band | null
  speed: number
  cap: number | null // null = default for the age band
  theme: 'auto' | 'light' | 'dark'
  region: Region
  recordMode: boolean
}
export interface Day { done: number; words: Record<string, number> }
export interface FamilyMember { id: string; name: string }
interface State { settings: Settings; days: Record<string, Day>; family: FamilyMember[] }

const KEY = 'll.v1'
const detectRegion = (): Region => {
  const l = (typeof navigator !== 'undefined' ? navigator.language : 'en-GB').toUpperCase()
  return l.endsWith('-US') ? 'US' : l.endsWith('-CA') ? 'CA' : l.endsWith('-IN') ? 'IN' : 'UK'
}
const detectLang = (): Lang => (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('hi') ? 'hi' : 'en')
const initial = (): State => ({
  settings: { lang: detectLang(), band: 2, speed: 0.85, cap: null, theme: 'auto', region: detectRegion(), recordMode: false },
  days: {},
  family: [],
})
function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as State
      // One audience now (ages 2-3): any earlier 1-2 choice is folded into it.
      return { ...initial(), ...s, settings: { ...initial().settings, ...s.settings, band: 2 } }
    }
  } catch { /* storage may be blocked; run in memory */ }
  return initial()
}

let state = load()
const subs = new Set<() => void>()
const commit = (next: State) => {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  subs.forEach((f) => f())
}
export const useStore = () => useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => state)

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const dayNumber = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000)
export const capFor = (s: Settings) => s.cap ?? (s.band === 1 ? 2 : 3)
export const doneToday = (s: State) => s.days[dayKey()]?.done ?? 0

export const setSettings = (patch: Partial<Settings>) => commit({ ...state, settings: { ...state.settings, ...patch } })

const withToday = (f: (d: Day) => Day): State => {
  const k = dayKey()
  const cur = state.days[k] ?? { done: 0, words: {} }
  return { ...state, days: { ...state.days, [k]: f(cur) } }
}
export const completeActivity = () => commit(withToday((d) => ({ ...d, done: d.done + 1 })))
export const saidIt = (wordKey: string) =>
  commit(withToday((d) => ({ ...d, words: { ...d.words, [wordKey]: (d.words[wordKey] ?? 0) + 1 } })))

export const addFamily = (m: FamilyMember) => commit({ ...state, family: [...state.family, m] })
export const removeFamily = (id: string) => {
  void delBlob('photo:' + id)
  commit({ ...state, family: state.family.filter((f) => f.id !== id) })
}
export async function wipeAll() {
  await clearBlobs()
  commit({ ...initial(), settings: { ...state.settings, band: state.settings.band } })
}

export function weekSummary(s: State) {
  let activities = 0
  const words: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const day = s.days[dayKey(d)]
    if (!day) continue
    activities += day.done
    for (const [k, n] of Object.entries(day.words)) words[k] = (words[k] ?? 0) + n
  }
  return { activities, words, wordCount: Object.values(words).reduce((a, b) => a + b, 0) }
}
