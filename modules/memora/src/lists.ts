import type { ModuleStorageApi } from "@loci/module-sdk";

/**
 * List plumbing: parsing pasted / imported text into clean item lists, the
 * saved-list store (per-profile, ctx.storage), and the ListSource shape every
 * game mode consumes (decks, saved lists and text keywords all flow through
 * the same funnel).
 */

export const MAX_LIST_ITEMS = 100;

/**
 * Parse pasted text or a .txt/.csv file body into a clean list: split on
 * newlines and commas, trim, drop empties, dedupe (case-insensitive, first
 * spelling wins), cap at MAX_LIST_ITEMS.
 */
export function parseListText(text: string): string[] {
  const parts = text
    .split(/[\n\r,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(part);
    if (out.length >= MAX_LIST_ITEMS) break;
  }
  return out;
}

/* ---------------- saved lists (per-profile) ---------------- */

export interface SavedList {
  id: string;
  name: string;
  items: string[];
  createdAt: number;
}

const KEY = "saved-lists";

export function loadSavedLists(storage: ModuleStorageApi): SavedList[] {
  return storage.get<SavedList[]>(KEY) ?? [];
}

export function saveList(storage: ModuleStorageApi, name: string, items: string[]): SavedList {
  const list: SavedList = {
    id: `l${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    name: name.trim() || "My list",
    items: items.slice(0, MAX_LIST_ITEMS),
    createdAt: Date.now(),
  };
  storage.set(KEY, [...loadSavedLists(storage), list]);
  return list;
}

export function deleteList(storage: ModuleStorageApi, id: string): void {
  storage.set(
    KEY,
    loadSavedLists(storage).filter((l) => l.id !== id)
  );
}

/* ---------------- the shape every mode consumes ---------------- */

export interface ListSource {
  id: string;
  title: string;
  emoji: string;
  items: string[];
  /**
   * True only for lists WE authored (decks, defaults). Child-entered content
   * (saved lists, texts, custom palace labels) never goes to ctx.ai — modes
   * use deterministic local mnemonics for it instead.
   */
  authored: boolean;
}
