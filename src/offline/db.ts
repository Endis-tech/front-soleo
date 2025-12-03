// src/offline/db.ts
import { openDB } from 'idb';

const DB_NAME = 'admin-offline-db';
const STORE_NAME = 'operations';

const openDb = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

// ✅ ACTUALIZADO: añadido customEndpoint opcional
export const saveOperation = async (operation: {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: string;
  payload: any;
  timestamp: number;
  customEndpoint?: string; // ✅ Esta es la única línea que cambia
}) => {
  const db = await openDb();
  const id = crypto.randomUUID();
  await db.add(STORE_NAME, {
    id,
    ...operation,
    synced: false,
  });
  return id;
};

// ✅ CORREGIDO: usa STORE_NAME, no STORE_STORE_NAME
export const getPendingOperations = async () => {
  const db = await openDb();
  const allOps = await db.getAll(STORE_NAME);
  return allOps.filter((op: any) => !op.synced);
};

export const markAsSynced = async (id: string) => {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const op = await tx.store.get(id);
  if (op) {
    await tx.store.put({ ...op, synced: true });
  }
};