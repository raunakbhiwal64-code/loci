// Writes every line the voice service must generate (about 280 per language) to voice/lines.json.
// Page ids match the app's recording keys (e.g. "fruits/apple", "crow/p1"); game lines are prefixed where/, wrong/, right/.
import fs from 'node:fs'
import path from 'node:path'
const dir = path.resolve('src/content/packs')
const packs = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const out = []
const add = (id, text) => { for (const lang of ['en', 'hi']) out.push({ id, lang, text: text[lang] }) }
for (const d of packs) {
  if (d.kind === 'wordset') for (const w of d.words) {
    const cap2 = (l) => (w.sound ? `${cap(w.word[l])}. ${w.sound[l]}` : `${cap(w.word[l])}. ${cap(w.word[l])}!`)
    add(`${d.id}/${w.id}`, { en: cap2('en'), hi: cap2('hi') })
    add(`where/${d.id}/${w.id}`, { en: d.whereQuestion.en.replace('{word}', w.word.en), hi: d.whereQuestion.hi.replace('{word}', w.word.hi) })
    add(`wrong/${d.id}/${w.id}`, { en: `That one is ${w.word.en}. Try again!`, hi: `यह तो ${w.word.hi} है। फिर से कोशिश करो!` })
    add(`right/${d.id}/${w.id}`, { en: `Yes! ${w.word.en}!`, hi: `हाँ! ${w.word.hi}!` })
  }
  else if (d.pages) d.pages.forEach((p, i) => add(`${d.id}/p${i + 1}`, p.text))
  else if (d.kind === 'missions') for (const m of d.missions) add(`mission/${m.id}`, m.text)
}
fs.writeFileSync('voice/lines.json', JSON.stringify(out, null, 1) + '\n')
const n = (l) => out.filter((x) => x.lang === l).length
console.log(`voice/lines.json: ${n('en')} en + ${n('hi')} hi lines`)
