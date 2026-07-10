import { promises as fs } from 'fs';
import path from 'path';
import { Asset, AssetMovement, ImportHistory, MaintenanceRecord, User } from '@/lib/types';

export interface PersistedStore {
  assets: Asset[];
  maintenanceRecords: MaintenanceRecord[];
  importHistories: ImportHistory[];
  movements: AssetMovement[];
  currentUser: User | null;
  users: User[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'inventory-store.json');

export const defaultUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@kemu.ac.ke', role: 'admin' },
  { id: '2', name: 'Staff Member', email: 'staff@kemu.ac.ke', role: 'staff' },
  { id: '3', name: 'Viewer User', email: 'viewer@kemu.ac.ke', role: 'viewer' },
];

export function emptyStore(): PersistedStore {
  return {
    assets: [],
    maintenanceRecords: [],
    importHistories: [],
    movements: [],
    currentUser: defaultUsers[0],
    users: defaultUsers,
  };
}

export async function readStore(): Promise<PersistedStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PersistedStore>;
    return normalizeStore(parsed);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
    const store = emptyStore();
    await writeStore(store);
    return store;
  }
}

export async function writeStore(store: Partial<PersistedStore>): Promise<PersistedStore> {
  const normalized = normalizeStore(store);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}

function normalizeStore(store: Partial<PersistedStore>): PersistedStore {
  const users = Array.isArray(store.users) && store.users.length ? store.users : defaultUsers;
  return {
    assets: Array.isArray(store.assets) ? store.assets : [],
    maintenanceRecords: Array.isArray(store.maintenanceRecords) ? store.maintenanceRecords : [],
    importHistories: Array.isArray(store.importHistories) ? store.importHistories : [],
    movements: Array.isArray(store.movements) ? store.movements : [],
    users,
    currentUser: store.currentUser || users[0] || null,
  };
}
