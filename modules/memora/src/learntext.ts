import type { ModuleStorageApi } from "@loci/module-sdk";

/**
 * Learn a book / idea / text: deterministic keyword extraction (no model
 * call, no child text leaves the device) plus the saved-text store and the
 * cloze-question builder. The keywords double as an item list for any palace.
 */

const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "all", "also", "am", "an", "and",
  "any", "are", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can", "could", "did", "do",
  "does", "doing", "down", "during", "each", "few", "for", "from", "further",
  "had", "has", "have", "having", "he", "her", "here", "hers", "him", "his",
  "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me",
  "more", "most", "my", "no", "nor", "not", "now", "of", "off", "on", "once",
  "only", "or", "other", "our", "ours", "out", "over", "own", "same", "she",
  "should", "so", "some", "such", "than", "that", "the", "their", "theirs",
  "them", "then", "there", "these", "they", "this", "those", "through", "to",
  "too", "under", "until", "up", "very", "was", "we", "were", "what", "when",
  "where", "which", "while", "who", "whom", "why", "will", "with", "would",
  "you", "your", "yours",
]);

export interface KeywordSentence {
  sentence: string;
  keyword: string;
}

/**
 * One keyword per sentence: split on sentence enders / newlines, then pick
 * the longest non-stopword word (first wins on ties). Sentences with no
 * usable word are skipped.
 */
export function extractKeywords(text: string): KeywordSentence[] {
  const sentences = text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const out: KeywordSentence[] = [];
  for (const sentence of sentences) {
    const words = sentence.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
    const candidates = words.filter((w) => !STOPWORDS.has(w.toLowerCase()));
    const pool = candidates.length > 0 ? candidates : words;
    if (pool.length === 0) continue;
    let keyword = pool[0];
    for (const w of pool) if (w.length > keyword.length) keyword = w;
    out.push({ sentence, keyword });
  }
  return out;
}

/* ---------------- cloze practice ---------------- */

export interface ClozeQuestion {
  /** The sentence with the keyword blanked out. */
  prompt: string;
  answer: string;
  /** Four options including the answer. */
  options: string[];
}

const FILLERS = ["morning", "garden", "mountain", "river", "window", "story", "planet", "teacher"];

export function buildCloze(keywords: KeywordSentence[]): ClozeQuestion[] {
  return keywords.map((ks, i) => {
    const blank = "_".repeat(Math.max(4, ks.keyword.length));
    const prompt = ks.sentence.replace(ks.keyword, blank);
    const distractors: string[] = [];
    // other keywords first, then fillers — never duplicate the answer
    for (let j = 1; j < keywords.length && distractors.length < 3; j++) {
      const cand = keywords[(i + j) % keywords.length].keyword;
      if (cand.toLowerCase() !== ks.keyword.toLowerCase() && !distractors.includes(cand)) distractors.push(cand);
    }
    for (let j = 0; j < FILLERS.length && distractors.length < 3; j++) {
      const cand = FILLERS[(i + j) % FILLERS.length];
      if (cand.toLowerCase() !== ks.keyword.toLowerCase() && !distractors.includes(cand)) distractors.push(cand);
    }
    // deterministic option order, stable per question
    const options = [ks.keyword, ...distractors];
    const rotate = i % options.length;
    return { prompt, answer: ks.keyword, options: [...options.slice(rotate), ...options.slice(0, rotate)] };
  });
}

/* ---------------- saved texts (per-profile) ---------------- */

export interface SavedText {
  id: string;
  title: string;
  text: string;
  keywords: KeywordSentence[];
  createdAt: number;
}

const KEY = "saved-texts";

export function loadSavedTexts(storage: ModuleStorageApi): SavedText[] {
  return storage.get<SavedText[]>(KEY) ?? [];
}

export function saveText(storage: ModuleStorageApi, title: string, text: string): SavedText {
  const saved: SavedText = {
    id: `t${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    title: title.trim() || "My text",
    text,
    keywords: extractKeywords(text),
    createdAt: Date.now(),
  };
  storage.set(KEY, [...loadSavedTexts(storage), saved]);
  return saved;
}

export function deleteText(storage: ModuleStorageApi, id: string): void {
  storage.set(
    KEY,
    loadSavedTexts(storage).filter((t) => t.id !== id)
  );
}
