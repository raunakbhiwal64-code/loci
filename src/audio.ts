import { getBlob, putBlob, delBlob } from './idb'
import type { Lang } from './types'
import type { Region } from './store'

// Narration order (spec): parent recording -> (cloned clip, later) -> pack audio -> device voice.
let unlocked = false
let current: HTMLAudioElement | null = null
const hasTTS = () => typeof speechSynthesis !== 'undefined'

/** Browsers block sound until the first tap. Call this from the first touch. */
export function unlock() {
  if (unlocked) return
  unlocked = true
  try { if (hasTTS()) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u) } } catch { /* ignore */ }
}
export function stopAudio() {
  try { if (hasTTS()) speechSynthesis.cancel() } catch { /* ignore */ }
  if (current) { current.pause(); current = null }
}

const tag = (lang: Lang, region: Region) => (lang === 'hi' ? 'hi-IN' : { UK: 'en-GB', US: 'en-US', CA: 'en-CA', IN: 'en-IN' }[region])
const recKey = (lang: Lang, key: string) => `rec:${lang}:${key}`

export const hasRecording = async (lang: Lang, key: string) => !!(await getBlob(recKey(lang, key)))
export const saveRecording = (lang: Lang, key: string, b: Blob) => putBlob(recKey(lang, key), b)
export const removeRecording = (lang: Lang, key: string) => delBlob(recKey(lang, key))

function playBlob(b: Blob): Promise<void> {
  return new Promise((res) => {
    const a = new Audio(URL.createObjectURL(b))
    current = a
    a.onended = a.onerror = () => res()
    a.play().catch(() => res())
  })
}

export interface SayOpts { text: string; lang: Lang; region: Region; rate: number; key?: string }

/** Resolves when the narration ends (or after a safety timeout, since some browsers never fire `end`). */
export async function say({ text, lang, region, rate, key }: SayOpts): Promise<void> {
  stopAudio()
  if (key) {
    const rec = await getBlob(recKey(lang, key))
    if (rec) return playBlob(rec)
  }
  if (!hasTTS()) return new Promise((r) => setTimeout(r, Math.min(4000, text.length * 70)))
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    const t = tag(lang, region)
    u.lang = t; u.rate = rate; u.pitch = 1.05
    const v = speechSynthesis.getVoices().find((x) => x.lang.replace('_', '-') === t) ?? speechSynthesis.getVoices().find((x) => x.lang.startsWith(lang))
    if (v) u.voice = v
    const done = () => { clearTimeout(timer); resolve() }
    const timer = setTimeout(done, Math.max(2000, (text.length * 110) / rate))
    u.onend = done; u.onerror = done
    speechSynthesis.speak(u)
  })
}

export interface Recorder { stop(): Promise<Blob> }
export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const rec = new MediaRecorder(stream)
  const chunks: BlobPart[] = []
  rec.ondataavailable = (e) => chunks.push(e.data)
  rec.start()
  return {
    stop: () => new Promise<Blob>((res) => {
      rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); res(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })) }
      rec.stop()
    }),
  }
}
export function playTemp(b: Blob): Promise<void> { stopAudio(); return playBlob(b) }

/** Resize a picked photo to 900px on the long side to keep storage small. */
export async function resizePhoto(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, 900 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('resize failed'))), 'image/jpeg', 0.82))
}
