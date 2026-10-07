import { useEffect, useMemo, useRef, useState } from 'react'
import { Pic, useApp, useStopAudioOnUnmount } from './ui'
import { completeActivity, saidIt } from './store'
import { hasRecording, playTemp, removeRecording, saveRecording, startRecording, stopAudio, type Recorder } from './audio'
import { babies, letters } from './content'
import type { PageData, Text, Word } from './types'

/* ---------------- Reading screen ---------------- */
export function Reader({ title, pages, tip, moral, onClose }: { title: string; pages: PageData[]; tip?: Text; moral?: Text; onClose: () => void }) {
  const { s, band, tx, ui, speak } = useApp()
  const [i, setI] = useState(0)
  const [finished, setFinished] = useState(false)
  const [said, setSaid] = useState(false)
  const [rec, setRec] = useState<Recorder | null>(null)
  const [hasRec, setHasRec] = useState(false)
  const [child, setChild] = useState<{ r?: Recorder; blob?: Blob }>({})
  const sx = useRef(0)
  const p = pages[i]
  useStopAudioOnUnmount()
  useEffect(() => { setSaid(false); hasRecording(s.lang, p.key).then(setHasRec); stopAudio() }, [i, s.lang, p.key])

  const listen = () => speak(tx(p.caption), p.key)
  const tapPicture = () => (band === 1 && p.word ? speak(tx(p.word)) : listen())
  const go = (d: number) => {
    if (d > 0 && i === pages.length - 1) { completeActivity(); setFinished(true); return }
    setI(Math.max(0, Math.min(pages.length - 1, i + d)))
  }
  const toggleRecord = async () => {
    if (rec) { const b = await rec.stop(); setRec(null); await saveRecording(s.lang, p.key, b); setHasRec(true); return }
    try { setRec(await startRecording()) } catch { alert('Microphone not available.') }
  }
  const yourTurn = async () => {
    if (child.r) { const blob = await child.r.stop(); setChild({ blob }); await playTemp(blob); setChild({}); return }
    try { setChild({ r: await startRecording() }) } catch { alert('Microphone not available.') }
  }

  if (finished)
    return (
      <div className="screen center" data-testid="finished">
        <Pic image="🌼" className="big" />
        <h2>{ui('allDone')}</h2>
        {moral && <p className="note"><b>{ui('moral')}:</b> {tx(moral)}</p>}
        {tip && <p className="note"><b>{ui('parentTip')}:</b> {tx(tip)}</p>}
        <button className="primary" onClick={onClose}>{ui('close')}</button>
      </div>
    )

  return (
    <div className="screen reader" data-testid="reader">
      <header className="bar">
        <button className="backbtn" onClick={onClose} data-testid="back">← {ui('back')}</button>
        <h2>{title}</h2>
        <span className="dots">{i + 1}/{pages.length}</span>
      </header>
      <div className="page fade" key={i}
        onPointerDown={(e) => { sx.current = e.clientX }}
        onPointerUp={(e) => { const dx = e.clientX - sx.current; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1) }}>
        <button className="picbtn" onClick={tapPicture} data-testid="picture" aria-label={tx(p.caption)}><Pic image={p.image} label={tx(p.caption)} className="big" /></button>
        <p className="caption" data-testid="caption">{tx(p.caption)}</p>
        <div className="action" data-testid="action">
          <p><span className="tag">{ui('forParent')}</span> {tx(p.action)}</p>
          {p.wordKey && (
            <div className="parentrow">
              <button className="mini" disabled={said} onClick={() => { saidIt(p.wordKey!); setSaid(true) }}>{said ? '✓ ' : ''}{ui('sayItYes')}</button>
              <button className="mini" onClick={yourTurn}>{child.r ? '⏺ ' + ui('recording') : '🎤 ' + ui('yourTurn')}</button>
            </div>
          )}
        </div>
      </div>
      {s.recordMode && (
        <div className="extras rec">
          <button className="chip" onClick={toggleRecord}>{rec ? '⏺ ' + ui('recording') : '🎙 ' + ui('record')}</button>
          {hasRec && <><span>✓ {ui('saved')}</span><button className="chip" onClick={async () => { await removeRecording(s.lang, p.key); setHasRec(false) }}>{ui('removeRec')}</button></>}
        </div>
      )}
      <nav className="controls">
        <button className="round" disabled={i === 0} onClick={() => go(-1)} aria-label={ui('prev')}>◀</button>
        <button className="listen" onClick={listen}>🔊 {ui('listen')}</button>
        <button className="next" onClick={() => go(1)} aria-label={ui('next')} data-testid="next">{i === pages.length - 1 ? '✓' : '▶'}</button>
      </nav>
    </div>
  )
}

/* ---------------- Two-choice games: no scores, gentle feedback ---------------- */
export interface Round { prompt: Text; options: { id: string; image: string; label: Text }[]; answer: string }

export function Quiz({ title, rounds, onClose }: { title: string; rounds: Round[]; onClose: () => void }) {
  const { tx, ui, speak } = useApp()
  const [r, setR] = useState(0)
  const [wrong, setWrong] = useState<string[]>([])
  const [right, setRight] = useState(false)
  const [finished, setFinished] = useState(false)
  useStopAudioOnUnmount()
  const round = rounds[r]
  const label = (id: string) => tx(round.options.find((o) => o.id === id)!.label)
  const tap = (id: string) => {
    if (right) return
    if (id === round.answer) { setRight(true); speak(ui('yes', { w: label(id) })) }
    else { setWrong([...wrong, id]); speak(ui('tryAgain', { w: label(id) })) }
  }
  const next = () => {
    if (r === rounds.length - 1) { completeActivity(); setFinished(true); return }
    setR(r + 1); setWrong([]); setRight(false)
  }
  if (finished)
    return (
      <div className="screen center" data-testid="finished">
        <Pic image="🌼" className="big" /><h2>{ui('allDone')}</h2>
        <button className="primary" onClick={onClose}>{ui('close')}</button>
      </div>
    )
  return (
    <div className="screen reader" data-testid="quiz">
      <header className="bar">
        <button className="backbtn" onClick={onClose} data-testid="back">← {ui('back')}</button><h2>{title}</h2><span className="dots">{r + 1}/{rounds.length}</span>
      </header>
      <div className="page fade" key={r}>
        <p className="caption" data-testid="prompt">{tx(round.prompt)}</p>
        <div className="choices">
          {round.options.map((o) => (
            <button key={o.id} className={`choice ${wrong.includes(o.id) ? 'dim' : ''} ${right && o.id === round.answer ? 'good' : ''}`}
              data-testid="choice" onClick={() => tap(o.id)}>
              <Pic image={o.image} label={tx(o.label)} className="mid" />
            </button>
          ))}
        </div>
        {wrong.length > 0 && !right && <p className="action">{ui('tryAgain', { w: label(wrong[wrong.length - 1]) })}</p>}
      </div>
      <nav className="controls">
        <span /><button className="listen" onClick={() => speak(tx(round.prompt))}>🔊 {ui('listen')}</button>
        <button className="next" disabled={!right} onClick={next} data-testid="next" aria-label={ui('next')}>▶</button>
      </nav>
    </div>
  )
}

const shuffle = <T,>(xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }

export function whereRounds(words: Word[], question: Text): Round[] {
  return shuffle(words).slice(0, 4).map((w) => {
    const other = shuffle(words.filter((x) => x.id !== w.id))[0]
    const mk = (x: Word) => ({ id: x.id, image: x.image, label: x.word })
    return {
      prompt: { en: question.en.replace('{word}', w.word.en), hi: question.hi.replace('{word}', w.word.hi) },
      options: shuffle([mk(w), mk(other)]), answer: w.id,
    }
  })
}
export function babyRounds(): Round[] {
  const ps = babies()
  return shuffle(ps).slice(0, 4).map((p) => {
    const other = shuffle(ps.filter((x) => x.id !== p.id))[0]
    return {
      prompt: { en: `Where is the baby ${p.parent.word.en}?`, hi: `${p.parent.word.hi} का बच्चा कहाँ है?` },
      options: shuffle([
        { id: p.id, image: p.baby.image, label: p.baby.word },
        { id: other.id, image: other.baby.image, label: other.baby.word },
      ]),
      answer: p.id,
    }
  })
}

/* ---------------- Letter tracing: finger on the touchscreen only ---------------- */
export function Tracing({ onClose }: { onClose: () => void }) {
  const { s, ui } = useApp()
  const set = useMemo(() => letters()[s.lang], [s.lang])
  const [i, setI] = useState(0)
  const cv = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const paint = () => {
    const c = cv.current!, g = c.getContext('2d')!
    g.clearRect(0, 0, c.width, c.height)
    g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ghost') || '#ddd'
    g.font = `bold ${c.height * 0.72}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(set[i], c.width / 2, c.height / 2 + c.height * 0.04)
  }
  useEffect(paint, [i, set])
  const pos = (e: React.PointerEvent) => { const r = cv.current!.getBoundingClientRect(); return [(e.clientX - r.left) * (cv.current!.width / r.width), (e.clientY - r.top) * (cv.current!.height / r.height)] }
  const down = (e: React.PointerEvent) => {
    if (e.pointerType === 'pen') return // finger only, no pencil, pen or stylus
    drawing.current = true; cv.current!.setPointerCapture(e.pointerId)
    const g = cv.current!.getContext('2d')!, [x, y] = pos(e)
    g.beginPath(); g.moveTo(x, y); g.lineWidth = 26; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#7f9a88'; g.lineTo(x + 0.1, y); g.stroke()
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || e.pointerType === 'pen') return
    const g = cv.current!.getContext('2d')!, [x, y] = pos(e); g.lineTo(x, y); g.stroke()
  }
  const finish = () => { completeActivity(); onClose() }
  return (
    <div className="screen reader" data-testid="tracing">
      <header className="bar"><button className="backbtn" onClick={onClose} data-testid="back">← {ui('back')}</button><h2>{ui('tracing')}</h2><span className="dots">{i + 1}/{set.length}</span></header>
      <div className="page"><p className="action"><span className="tag">{ui('forParent')}</span> {ui('traceHint')}</p>
        <canvas ref={cv} width={360} height={360} className="trace" data-testid="trace-canvas"
          onPointerDown={down} onPointerMove={move} onPointerUp={() => (drawing.current = false)} onPointerCancel={() => (drawing.current = false)} /></div>
      <nav className="controls">
        <button className="round" onClick={paint} aria-label={ui('clear')}>⌫</button>
        <button className="listen" onClick={finish} data-testid="trace-done">✓ {ui('done')}</button>
        <button className="next" onClick={() => setI((i + 1) % set.length)} aria-label={ui('next')}>▶</button>
      </nav>
    </div>
  )
}

/* ---------------- Bedtime listening: sound only, plays through, then stops ---------------- */
export function Bedtime({ items, onClose }: { items: { pages: PageData[] }[]; onClose: () => void }) {
  const { tx, ui, speak } = useApp()
  const [state, setState] = useState<'ready' | 'playing' | 'done'>('ready')
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false; stopAudio() }, [])
  const run = async () => {
    setState('playing')
    for (const it of items) for (const p of it.pages) {
      if (!alive.current) return
      await speak(tx(p.caption), p.key)
      await new Promise((r) => setTimeout(r, 900))
    }
    if (alive.current) { completeActivity(); setState('done') }
  }
  const stop = () => { alive.current = false; stopAudio(); onClose() }
  return (
    <div className="screen dim center" data-testid="bedtime">
      <Pic image="🌙" className="big" />
      <h2>{ui('bedtime')}</h2>
      {state === 'ready' && <button className="primary" data-testid="bedtime-play" onClick={run}>▶ {ui('listen')}</button>}
      {state === 'playing' && <button className="primary" onClick={stop}>■ {ui('stop')}</button>}
      {state === 'done' && <><p>{ui('allDone')}</p><button className="primary" onClick={onClose}>{ui('close')}</button></>}
    </div>
  )
}
