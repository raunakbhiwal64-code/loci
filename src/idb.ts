// Tiny IndexedDB key-value store for recordings and family photos. Everything stays on the device.
const open = () =>
  new Promise<IDBDatabase>((res, rej) => {
    const r = indexedDB.open('little-learners', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('blobs')
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
async function tx<T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise<T>((res, rej) => {
    const r = f(db.transaction('blobs', mode).objectStore('blobs'))
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
export const putBlob = (k: string, b: Blob) => tx('readwrite', (s) => s.put(b, k)).catch(() => undefined)
export const getBlob = (k: string) => tx<Blob | undefined>('readonly', (s) => s.get(k)).catch(() => undefined)
export const delBlob = (k: string) => tx('readwrite', (s) => s.delete(k)).catch(() => undefined)
export const clearBlobs = () => tx('readwrite', (s) => s.clear()).catch(() => undefined)
export const blobKeys = () => tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys()).catch(() => [] as IDBValidKey[])
