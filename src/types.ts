export type Lang = 'en' | 'hi'
export type Band = 1 | 2 // 1 = ages 1-2, 2 = ages 2-3
export type Text = Record<Lang, string>

export interface Word {
  id: string
  image: string
  word: Text
  article: Text
  sound?: Text
  action: Text
}
export interface WordSet {
  kind: 'wordset'
  id: string
  ages: number[]
  title: Text
  cover: string
  words: Word[]
  whereQuestion: Text
}
export interface StoryPage {
  image: string
  text: Text
  action: Text
  audio?: Partial<Record<Lang, string>>
}
export interface Story {
  kind: 'story' | 'habit' | 'bigday' | 'rhyme'
  id: string
  ages: number[]
  title: Text
  cover: string
  moral?: Text
  parentTip: Text
  pages: StoryPage[]
}
export interface Missions { kind: 'missions'; ages: number[]; missions: { id: string; text: Text }[] }
export interface Babies {
  kind: 'babies'
  ages: number[]
  pairs: { id: string; parent: { image: string; word: Text }; baby: { image: string; word: Text } }[]
}
export interface Letters { kind: 'letters'; ages: number[]; en: string[]; hi: string[] }

/** One screen of the reading view, whatever it came from. */
export interface PageData {
  key: string
  image: string
  caption: Text
  action: Text
  word?: Text // set on word pages: tapped aloud for ages 1-2
  wordKey?: string
}
