import { useEffect, useState } from 'react'
import { useApp, LangToggle } from './ui'
import { addFamily, capFor, doneToday, removeFamily, setSettings, useStore, weekSummary, wipeAll, type Region } from './store'
import { getBlob, putBlob } from './idb'
import { resizePhoto } from './audio'
import { allWordSets, todaysWords, wordLabel } from './content'
import { dayNumber } from './store'

export function Settings({ onClose }: { onClose: () => void }) {
  const { s, ui, band } = useApp()
  const store = useStore()
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [name, setName] = useState('')
  useEffect(() => {
    let live = true
    Promise.all(store.family.map(async (f) => [f.id, URL.createObjectURL((await getBlob('photo:' + f.id))!)] as const))
      .then((e) => live && setPhotos(Object.fromEntries(e))).catch(() => undefined)
    return () => { live = false }
  }, [store.family])
  const week = weekSummary(store)
  const names = (k: string) => { const [set, id] = k.split('/'); const w = allWordSets().find((x) => x.id === set)?.words.find((x) => x.id === id); return w ? wordLabel(w, s.lang, s.region) : k }
  const addPhoto = async (f?: File | null) => {
    if (!f) return
    const id = crypto.randomUUID()
    await putBlob('photo:' + id, await resizePhoto(f))
    addFamily({ id, name: name.trim() || '—' }); setName('')
  }
  const share = () => {
    const w = todaysWords(band, dayNumber()).map((x) => wordLabel(x.word, s.lang, s.region)).join(', ')
    window.open('https://wa.me/?text=' + encodeURIComponent(`${ui('todaysWords')}: ${w}`), '_blank', 'noopener')
  }
  const ics = () => {
    const d = new Date(), p = (n: number) => String(n).padStart(2, '0')
    const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T190000`
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Little Learners//EN', 'BEGIN:VEVENT', `UID:little-learners-${stamp}@local`, `DTSTAMP:${stamp}`,
      `DTSTART:${stamp}`, 'RRULE:FREQ=DAILY', 'SUMMARY:Little Learners: bedtime routine together', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.download = 'little-learners-reminder.ics'; a.click()
  }
  return (
    <div className="screen settings" data-testid="settings">
      <header className="bar"><button className="icon" onClick={onClose} aria-label={ui('close')}>✕</button><h2>{ui('settings')}</h2><span /></header>
      <div className="scroll">
        <section><h3>{ui('ageBand')}</h3>
          <div className="seg wide"><button className={band === 1 ? 'on' : ''} onClick={() => setSettings({ band: 1 })}>{ui('age12')}</button>
            <button className={band === 2 ? 'on' : ''} onClick={() => setSettings({ band: 2 })}>{ui('age23')}</button></div></section>
        <section><h3>{ui('language')}</h3><LangToggle /></section>
        <section><h3>{ui('speed')}</h3>
          <div className="seg wide"><button className={s.speed < 0.8 ? 'on' : ''} onClick={() => setSettings({ speed: 0.7 })}>{ui('slow')}</button>
            <button className={s.speed >= 0.8 ? 'on' : ''} onClick={() => setSettings({ speed: 0.9 })}>{ui('normal')}</button></div></section>
        <section><h3>{ui('dailyLimit')}: {capFor(s)} <small>({doneToday(store)} ✓)</small></h3>
          <input type="range" min={1} max={6} value={capFor(s)} onChange={(e) => setSettings({ cap: +e.target.value })} aria-label={ui('dailyLimit')} /></section>
        <section><h3>{ui('theme')}</h3>
          <div className="seg wide">{(['auto', 'light', 'dark'] as const).map((t) => <button key={t} className={s.theme === t ? 'on' : ''} onClick={() => setSettings({ theme: t })}>{ui(t)}</button>)}</div></section>
        <section><h3>{ui('region')}</h3>
          <div className="seg wide">{(['UK', 'US', 'CA', 'IN'] as Region[]).map((r) => <button key={r} className={s.region === r ? 'on' : ''} onClick={() => setSettings({ region: r })}>{r}</button>)}</div></section>
        <section><h3>{ui('recordMode')}</h3><p className="small">{ui('recordHelp')}</p>
          <label className="switch"><input type="checkbox" checked={s.recordMode} onChange={(e) => setSettings({ recordMode: e.target.checked })} /> {ui('recordMode')}</label></section>
        <section><h3>{ui('familyPhotos')}</h3>
          <div className="fam">{store.family.map((f) => <figure key={f.id}>{photos[f.id] && <img src={photos[f.id]} alt={f.name} />}<figcaption>{f.name}</figcaption><button className="chip" onClick={() => removeFamily(f.id)}>{ui('remove')}</button></figure>)}</div>
          <input placeholder={ui('nameFor')} value={name} onChange={(e) => setName(e.target.value)} />
          <label className="chip filebtn">📷 {ui('addPhoto')}<input type="file" accept="image/*" hidden data-testid="photo-input" onChange={(e) => { void addPhoto(e.target.files?.[0]); e.target.value = '' }} /></label></section>
        <section><h3>{ui('weekly')}</h3>
          <p>{ui('activitiesDone')}: <b>{week.activities}</b></p>
          <p>{ui('wordsSaid')}: <b>{week.wordCount}</b></p>
          {Object.entries(week.words).map(([k, n]) => <span className="tagword" key={k}>{names(k)} ×{n}</span>)}</section>
        <section><button className="chip wide" onClick={share}>💬 {ui('shareWords')}</button>
          <button className="chip wide" onClick={ics}>⏰ {ui('reminder')}</button></section>
        <section><p className="small">{ui('voiceStudio')}</p><p className="small">{ui('installTip')}</p></section>
        <section><button className="chip danger wide" onClick={async () => { if (confirm(ui('deleteConfirm'))) await wipeAll() }}>{ui('deleteAll')}</button></section>
      </div>
    </div>
  )
}
