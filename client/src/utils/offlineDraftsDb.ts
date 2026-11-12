export interface OfflineQueueDraft {
  id: string
  kind: 'PATIENT_REGISTRATION' | 'ORAL_SCREENING'
  createdAt: string
  summary: string
  payload: Record<string, unknown>
}

const DB_NAME = 'aarogya_drishti_offline_db'
const DB_VERSION = 1
const STORE_NAME = 'drafts'

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser.'))
      return
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB error'))
  })
}

export async function saveOfflineDraftToIndexedDb(
  draft: Omit<OfflineQueueDraft, 'id' | 'createdAt'>,
): Promise<OfflineQueueDraft> {
  const entry: OfflineQueueDraft = {
    ...draft,
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  }
  const db = await openOfflineDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(entry)
    tx.oncomplete = () => {
      db.close()
      window.dispatchEvent(new Event('aarogya:offline-drafts-changed'))
      resolve(entry)
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error ?? new Error('Failed to save offline draft'))
    }
  })
}

export async function listOfflineDraftsFromIndexedDb(): Promise<
  OfflineQueueDraft[]
> {
  try {
    const db = await openOfflineDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onsuccess = () => {
        db.close()
        const items = (req.result as OfflineQueueDraft[]) ?? []
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        resolve(items)
      }
      req.onerror = () => {
        db.close()
        reject(req.error ?? new Error('Failed to list offline drafts'))
      }
    })
  } catch {
    return []
  }
}

export async function removeOfflineDraftFromIndexedDb(
  id: string,
): Promise<void> {
  const db = await openOfflineDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(id)
    tx.oncomplete = () => {
      db.close()
      window.dispatchEvent(new Event('aarogya:offline-drafts-changed'))
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error ?? new Error('Failed to remove offline draft'))
    }
  })
}

