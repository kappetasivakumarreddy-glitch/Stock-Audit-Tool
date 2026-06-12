import type { AuditSession, AuditSessionMetadata } from '../types';

const DB_NAME = 'StockAuditDB';
const STORE_NAME = 'sessions';
const DB_VERSION = 1;

function getDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'metadata.id' });
      }
    };
  });
}

export const indexedDbService = {
  async saveSession(session: AuditSession): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      
      // Update timestamps
      const now = Date.now();
      if (!session.metadata.createdAt) {
        session.metadata.createdAt = now;
      }
      session.metadata.updatedAt = now;

      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getSession(id: string): Promise<AuditSession | null> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllSessions(): Promise<AuditSessionMetadata[]> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const sessions = request.result as AuditSession[];
        const metadatas = sessions
          .map((s) => s.metadata)
          .sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(metadatas);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async deleteSession(id: string): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};
