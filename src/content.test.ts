import { describe, expect, it } from 'vitest'
import { allWordSets, regional, storiesOf, todaysWords, wordPage, wordSets } from './content'

describe('content packs', () => {
  it('has 10 word sets and 55 words', () => {
    expect(allWordSets()).toHaveLength(10)
    expect(allWordSets().reduce((n, s) => n + s.words.length, 0)).toBe(55)
  })
  it('hides colours, shapes, counting, opposites and folk tales from ages 1-2', () => {
    expect(wordSets(1)).toHaveLength(6)
    expect(wordSets(1).map((s) => s.id)).not.toContain('colours')
    expect(storiesOf('story', 1)).toHaveLength(0)
    expect(storiesOf('story', 2)).toHaveLength(6)
  })
  it("Today's words never use feelings or opposites and rotate daily", () => {
    for (let d = 0; d < 40; d++) for (const b of [1, 2] as const)
      for (const x of todaysWords(b, d)) expect(['feelings', 'opposites']).not.toContain(x.set.id)
    expect(todaysWords(2, 1)[0].word.id).not.toBe(todaysWords(2, 2)[0].word.id)
  })
  it('says each word twice or with its sound', () => {
    const animals = allWordSets().find((s) => s.id === 'animals')!
    expect(wordPage(animals, animals.words[0]).caption.en).toBe('Cow. Moo!')
    const fruits = allWordSets().find((s) => s.id === 'fruits')!
    expect(wordPage(fruits, fruits.words[0]).caption.en).toBe('Apple. Apple!')
  })
  it('applies regional English', () => {
    expect(regional('Colour the Mum', 'en', 'US')).toBe('Color the Mom')
    expect(regional('Colour the Mum', 'en', 'UK')).toBe('Colour the Mum')
    expect(regional('Colour the Mum', 'hi', 'US')).toBe('Colour the Mum')
  })
})
