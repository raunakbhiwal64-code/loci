import { useEffect, useRef, useState, type ReactNode } from 'react'
import { t, type Key } from './i18n'
import { regional } from './content'
import { say, stopAudio, unlock } from './audio'
import { setSettings, useStore } from './store'
import type { Lang, Text } from './types'

/** The settings every screen needs: language, regional English, voice speed. */
export function useApp() {
  const { settings: s } = useStore()
  const tx = (x: Text) => regional(x[s.lang], s.lang, s.region)
  const ui = (k: Key, vars?: Record<string, string>) => regional(t(k, s.lang, vars), s.lang, s.region)
  const speak = (text: string, key?: string) => say({ text, lang: s.lang, region: s.region, rate: s.speed, key })
  return { s, lang: s.lang, band: s.band ?? 1, tx, ui, speak }
}

export function Pic({ image, label, className = '' }: { image: string; label?: string; className?: string }) {
  const isImg = image.startsWith('blob:') || image.startsWith('data:')
  return isImg ? (
    <img className={`pic photo ${className}`} src={image} alt={label ?? ''} />
  ) : (
    <span className={`pic emoji ${className}`} role="img" aria-label={label ?? ''}>{image}</span>
  )
}

export function LangToggle() {
  const { lang } = useApp()
  const pick = (l: Lang) => { unlock(); setSettings({ lang: l }) }
  return (
    <div className="seg" role="group" aria-label="Language">
      <button className={lang === 'en' ? 'on' : ''} onClick={() => pick('en')}>EN</button>
      <button className={lang === 'hi' ? 'on' : ''} onClick={() => pick('hi')}>हिं</button>
    </div>
  )
}

/** Parent gate: opens only on a 1.2 second press-and-hold, so a toddler cannot tap it open. */
export function HoldButton({ onOpen, children }: { onOpen: () => void; children: ReactNode }) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<number>(0)
  const end = () => { clearTimeout(timer.current); setHolding(false) }
  const begin = () => { setHolding(true); timer.current = window.setTimeout(() => { setHolding(false); onOpen() }, 1200) }
  useEffect(() => end, [])
  return (
    <button
      className={`hold ${holding ? 'holding' : ''}`}
      data-testid="parent-gate"
      onPointerDown={begin} onPointerUp={end} onPointerLeave={end} onPointerCancel={end}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Parents: press and hold"
    >
      <span className="holdfill" />
      <span className="holdlabel">{children}</span>
    </button>
  )
}

export function useStopAudioOnUnmount() { useEffect(() => stopAudio, []) }
