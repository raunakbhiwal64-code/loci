// Fails the build on a missing translation, picture or action prompt (spec step 2).
import fs from 'node:fs'
import path from 'node:path'
const dir = path.resolve('src/content/packs')
const errors = []
const need = (cond, msg) => { if (!cond) errors.push(msg) }
const text = (t, where) => ['en', 'hi'].forEach((l) => need(t && typeof t[l] === 'string' && t[l].trim(), `${where}: missing ${l}`))
const words = (s) => s.trim().split(/\s+/).length

for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
  const w = `${f}`
  need(d.kind && Array.isArray(d.ages) && d.ages.every((a) => a === 1 || a === 2), `${w}: kind/ages invalid`)
  if (d.kind === 'wordset') {
    text(d.title, `${w} title`); text(d.whereQuestion, `${w} whereQuestion`)
    need(d.words.length >= 2, `${w}: needs 2+ words`)
    for (const x of d.words) {
      text(x.word, `${w}/${x.id} word`); text(x.action, `${w}/${x.id} action`); need(x.image, `${w}/${x.id}: missing image`)
    }
  } else if (['story', 'habit', 'bigday', 'rhyme'].includes(d.kind)) {
    text(d.title, `${w} title`); text(d.parentTip, `${w} parentTip`)
    d.pages.forEach((p, i) => {
      const at = `${w} p${i + 1}`
      need(p.image, `${at}: missing image`); text(p.text, `${at} text`); text(p.action, `${at} action`)
      for (const l of ['en', 'hi']) need(!p.text?.[l] || words(p.text[l]) <= 10 || d.kind === 'rhyme', `${at} ${l}: caption over 10 words`)
    })
  } else if (d.kind === 'missions') d.missions.forEach((m) => text(m.text, `${w}/${m.id}`))
  else if (d.kind === 'babies') d.pairs.forEach((p) => { text(p.parent.word, `${w}/${p.id} parent`); text(p.baby.word, `${w}/${p.id} baby`) })
  else if (d.kind === 'letters') need(d.en.length && d.hi.length, `${w}: letters missing`)
  else errors.push(`${w}: unknown kind ${d.kind}`)
}
if (errors.length) { console.error('Content validation failed:\n' + errors.join('\n')); process.exit(1) }
console.log('Content OK:', fs.readdirSync(dir).length, 'packs')
