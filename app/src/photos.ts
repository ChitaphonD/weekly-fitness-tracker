// Progress photos live in IndexedDB: images are too large for localStorage.

const DB = 'wft-photos', STORE = 'photos';

let dbp: Promise<IDBDatabase> | null = null;
const open = () => dbp ??= new Promise((resolve, reject) => {
  const req = indexedDB.open(DB, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(STORE);
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const run = <T,>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest) =>
  open().then(db => new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  }));

export const getPhoto = (id: string) => run<Blob | undefined>('readonly', s => s.get(id));
export const putPhoto = (id: string, blob: Blob) => run<void>('readwrite', s => s.put(blob, id));
export const deletePhoto = (id: string) => run<void>('readwrite', s => s.delete(id));

/** Downscale to at most `max` px on the long edge so stored photos stay small. */
export async function shrink(file: File, max = 1400): Promise<Blob> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  if (k === 1 && file.size < 1.5e6) return file;
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', 0.86));
}

export const clearPhotos = () => run<void>('readwrite', s => s.clear());
