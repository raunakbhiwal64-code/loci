/**
 * Durable key/value persistence for local-first v1. IndexedDB when available,
 * localStorage as a fallback, plus a last-known-good snapshot so a corrupted
 * write can never destroy a profile (PRD 5.9 resilience).
 */

export interface Persistence {
  loadAll(): Promise<Record<string, unknown>>;
  save(key: string, value: unknown): Promise<void>;
  requestPersistent(): Promise<void>;
}

const DB_NAME = "loci";
const STORE = "kv";

function idbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

class IdbPersistence implements Persistence {
  private dbp: Promise<IDBDatabase>;

  constructor() {
    this.dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async loadAll(): Promise<Record<string, unknown>> {
    const db = await this.dbp;
    return new Promise((resolve) => {
      const out: Record<string, unknown> = {};
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          if (!String(cursor.key).endsWith(":lkg")) out[String(cursor.key)] = cursor.value;
          cursor.continue();
        } else {
          resolve(out);
        }
      };
      cursorReq.onerror = () => resolve(out);
    });
  }

  async save(key: string, value: unknown): Promise<void> {
    const db = await this.dbp;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      // last-known-good: keep the previous value before overwriting.
      const getPrev = store.get(key);
      getPrev.onsuccess = () => {
        if (getPrev.result !== undefined) store.put(getPrev.result, `${key}:lkg`);
        store.put(value, key);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async requestPersistent(): Promise<void> {
    try {
      await navigator.storage?.persist?.();
    } catch {
      /* best effort */
    }
  }
}

class LocalStoragePersistence implements Persistence {
  private prefix = "loci:";

  async loadAll(): Promise<Record<string, unknown>> {
    const out: Record<string, unknown> = {};
    if (typeof localStorage === "undefined") return out;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(this.prefix) || k.endsWith(":lkg")) continue;
      const key = k.slice(this.prefix.length);
      const raw = localStorage.getItem(k);
      if (raw == null) continue;
      try {
        out[key] = JSON.parse(raw);
      } catch {
        const lkg = localStorage.getItem(`${k}:lkg`);
        if (lkg) {
          try {
            out[key] = JSON.parse(lkg);
          } catch {
            /* give up on this key, keep the rest */
          }
        }
      }
    }
    return out;
  }

  async save(key: string, value: unknown): Promise<void> {
    if (typeof localStorage === "undefined") return;
    const full = this.prefix + key;
    const prev = localStorage.getItem(full);
    if (prev != null) localStorage.setItem(`${full}:lkg`, prev);
    localStorage.setItem(full, JSON.stringify(value));
  }

  async requestPersistent(): Promise<void> {
    /* not applicable */
  }
}

/** In-memory only — used in tests / non-browser environments. */
class MemoryPersistence implements Persistence {
  async loadAll() {
    return {};
  }
  async save() {
    /* noop */
  }
  async requestPersistent() {
    /* noop */
  }
}

export function createPersistence(): Persistence {
  try {
    if (idbAvailable()) return new IdbPersistence();
    if (typeof localStorage !== "undefined") return new LocalStoragePersistence();
  } catch {
    /* fall through */
  }
  return new MemoryPersistence();
}
