import { useEffect, useState } from 'react'
import { HoldButton, LangToggle, Pic, useApp } from './ui'
import { Bedtime, Quiz, Reader, Tracing, babyRounds, whereRounds, type Round } from './screens'
import { Settings } from './Settings'
import { capFor, dayNumber, doneToday, setSettings, useStore } from './store'
import { unlock } from './audio'
import { getBlob } from './idb'
import { allWordSets, getStory, storiesOf, storyPages, todaysMission, todaysWords, wordPage, wordSetPages, wordSets } from './content'
import type { PageData, Story, Text, Word, WordSet } from './types'

type Tab = 'words' | 'stories' | 'habits' | 'play'
type View =
  | null
  | { t: 'read'; title: string; pages: PageData[]; tip?: Text; moral?: Text }
  | { t: 'quiz'; title: string; rounds: Round[] }
  | { t: 'trace' } | { t: 'bed' } | { t: 'settings' }

/** Family photos become a word set and a game (My family). */
function useFamilySet(): WordSet | null {
  const { family } = useStore()
  const [urls, setUrls] = useState<Record<string, string>>({})
  useEffect(() => {
    let live = true
    Promise.all(family.map(async (f) => { const b = await getBlob('photo:' + f.id); return [f.id, b ? URL.createObjectURL(b) : ''] as const }))
      .then((e) => live && setUrls(Object.fromEntries(e)))
    return () => { live = false }
  }, [family])
  const ready = family.filter((f) => urls[f.id])
  if (ready.length < 2) return null
  const words: Word[] = ready.map((f) => ({
    id: f.id, image: urls[f.id], word: { en: f.name, hi: f.name }, article: { en: f.name, hi: f.name },
    action: { en: `Wave hello to ${f.name}!`, hi: `${f.name} को नमस्ते कहो!` },
  }))
  return { kind: 'wordset', id: 'family', ages: [1, 2], title: { en: 'My family', hi: 'मेरा परिवार' }, cover: '👪', words, whereQuestion: { en: 'Where is {word}?', hi: '{word} कहाँ है?' } }
}

export default function App() {
  const store = useStore()
  const { s, ui, tx, band } = useApp()
  const [tab, setTab] = useState<Tab>('stories')
  const [view, setView] = useState<View>(null)
  const family = useFamilySet()

  useEffect(() => {
    const pop = () => setView(null)
    addEventListener('popstate', pop)
    return () => removeEventListener('popstate', pop)
  }, [])
  useEffect(() => {
    const dark = s.theme === 'dark' || (s.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document.documentElement.lang = s.lang
  }, [s.theme, s.lang])

  // Phone and browser Back buttons close the open screen instead of leaving the app.
  const close = () => { try { if (history.state?.ll) { history.back(); return } } catch { /* ignore */ } setView(null) }
  const resting = doneToday(store) >= capFor(s)
  const open = (v: View) => { unlock(); try { history.pushState({ ll: 1 }, '') } catch { /* sandboxed frame: the on-screen Back button still works */ }
    setView(v) }
  const readSet = (set: WordSet) => open({ t: 'read', title: tx(set.title), pages: wordSetPages(set) })
  const readStory = (st: Story) => open({ t: 'read', title: tx(st.title), pages: storyPages(st), tip: st.parentTip, moral: st.moral })
  const playSet = (set: WordSet) => open({ t: 'quiz', title: tx(set.title), rounds: whereRounds(set.words, set.whereQuestion) })

  if (view?.t === 'read') return <Reader {...view} onClose={close} />
  if (view?.t === 'quiz') return <Quiz title={view.title} rounds={view.rounds} onClose={close} />
  if (view?.t === 'trace') return <Tracing onClose={close} />
  if (view?.t === 'settings') return <Settings onClose={close} />
  if (view?.t === 'bed') {
    const items = [getStory('twinkle'), band === 2 ? getStory('crow') : getStory('new-baby'), getStory('bedtime-routine')].map((st) => ({ pages: storyPages(st) }))
    return <Bedtime items={items} onClose={close} />
  }

  const day = dayNumber()
  const tw = todaysWords(band, day)
  const mission = todaysMission(band, day)
  const sets = wordSets(band)
  const Card = ({ icon, title, sub, onClick, id }: { icon: string; title: string; sub?: string; onClick: () => void; id?: string }) => (
    <button className="card" onClick={onClick} data-testid={id ?? 'card'}>
      <Pic image={icon} className="small" /><span><b>{title}</b>{sub && <small>{sub}</small>}</span>
    </button>
  )
  const tabs: [Tab, string, string][] = [['words', '🔤', ui('words')], ['stories', '📖', ui('stories')], ['habits', '🧼', ui('habits')], ['play', '🎈', ui('play')]]

  return (
    <div className="home" onPointerDown={unlock}>
      <header className="top">
        <h1>{ui('appName')}</h1>
        <LangToggle />
        <HoldButton onOpen={() => open({ t: 'settings' })}>👪</HoldButton>
      </header>
      <main className="tabpane" data-testid={`tab-${tab}`}>
        {resting ? (
          <div className="rest" data-testid="rest">
            <Pic image="🌙" className="big" />
            <h2>{ui('rest')}</h2><p>{ui('restSub')}</p>
            <p className="small">{ui('useTogether')}</p>
          </div>
        ) : (
          <>
            {tab === 'words' && <>
              <button className="hero" data-testid="todays-words" onClick={() => open({ t: 'read', title: ui('todaysWords'), pages: tw.map((x) => wordPage(x.set, x.word)) })}>
                <span className="row">{tw.map((x) => <Pic key={x.word.id} image={x.word.image} className="mini" />)}</span>
                <b>{ui('todaysWords')}</b><small>{ui('todaysWordsSub')}</small>
              </button>
              <div className="mission"><span><b>{ui('mission')}</b><br />{tx(mission.text)}</span>
                <ListenBtn text={tx(mission.text)} /></div>
              <div className="grid">
                {sets.map((set) => <Card key={set.id} id="wordset" icon={set.cover} title={tx(set.title)} onClick={() => readSet(set)} />)}
                {family ? <Card icon="👪" id="wordset" title={ui('myFamily')} onClick={() => readSet(family)} /> : <p className="small">{ui('familyEmpty')}</p>}
                <Card icon="✏️" id="tracing" title={ui('tracing')} onClick={() => open({ t: 'trace' })} />
              </div>
            </>}
            {tab === 'stories' && <>
              <Card icon="🌙" id="bedtime" title={ui('bedtime')} sub={ui('bedtimeSub')} onClick={() => open({ t: 'bed' })} />
              <h3>{ui('rhymes')}</h3><div className="grid">{storiesOf('rhyme', band).map((x) => <Card key={x.id} id="story" icon={x.cover} title={tx(x.title)} onClick={() => readStory(x)} />)}</div>
              <h3>{ui('bigDays')}</h3><div className="grid">{storiesOf('bigday', band).map((x) => <Card key={x.id} id="story" icon={x.cover} title={tx(x.title)} onClick={() => readStory(x)} />)}</div>
              <><h3>{ui('folkTales')}</h3><div className="grid">{storiesOf('story', band).map((x) => <Card key={x.id} id="story" icon={x.cover} title={tx(x.title)} onClick={() => readStory(x)} />)}</div></>
            </>}
            {tab === 'habits' && <><h3>{ui('routines')}</h3><div className="grid">{storiesOf('habit', band).map((x) => <Card key={x.id} id="story" icon={x.cover} title={tx(x.title)} onClick={() => readStory(x)} />)}</div></>}
            {tab === 'play' && <>
              <h3>{ui('whereIsIt')}</h3>
              <div className="grid">
                {sets.map((set) => <Card key={set.id} id="game" icon={set.cover} title={tx(set.title)} onClick={() => playSet(set)} />)}
                {family && <Card icon="👪" id="game" title={ui('myFamily')} onClick={() => playSet(family)} />}
              </div>
              <h3>{ui('findBaby')}</h3><div className="grid"><Card id="game" icon="🐶" title={ui('findBaby')} onClick={() => open({ t: 'quiz', title: ui('findBaby'), rounds: babyRounds() })} /></div>
            </>}
          </>
        )}
      </main>
      <nav className="tabs" aria-label="Tabs">
        {tabs.map(([k, icon, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} disabled={resting} onClick={() => setTab(k)} data-testid={`nav-${k}`}><span>{icon}</span>{label}</button>
        ))}
      </nav>
    </div>
  )
}

function ListenBtn({ text }: { text: string }) {
  const { ui, speak } = useApp()
  return <button className="chip" onClick={() => { unlock(); void speak(text) }}>🔊 {ui('listen')}</button>
}
