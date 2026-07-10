'use client';

import { Asset, MaintenanceRecord, ImportHistory, AssetMovement, User, UserRole, DashboardMetrics } from './types';

const STORAGE_KEY = 'kemu-inventory-store-v1';
const STORE_CHANGED_EVENT = 'kemu-inventory-store-changed';

// Browser-persisted in-memory data store
let initialized = false;
let assets: Asset[] = [];
let maintenanceRecords: MaintenanceRecord[] = [];
let importHistories: ImportHistory[] = [];
let movements: AssetMovement[] = [];
let currentUser: User | null = null;
let users: User[] = [];

function persistStore() {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    assets,
    maintenanceRecords,
    importHistories,
    movements,
    currentUser,
    users,
  }));
  window.dispatchEvent(new Event(STORE_CHANGED_EVENT));
}

export function subscribeToStoreChanges(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(STORE_CHANGED_EVENT, callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener(STORE_CHANGED_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

// Initialize with persisted data when available, otherwise seed demo data once
export function initializeStore() {
  if (initialized) return;

  if (typeof window !== 'undefined') {
    const savedStore = window.localStorage.getItem(STORAGE_KEY);

    if (savedStore) {
      try {
        const parsed = JSON.parse(savedStore);
        assets = parsed.assets || [];
        maintenanceRecords = parsed.maintenanceRecords || [];
        importHistories = parsed.importHistories || [];
        movements = parsed.movements || [];
        users = parsed.users || [];
        currentUser = parsed.currentUser || parsed.users?.[0] || null;
        initialized = true;
        return;
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }
  // Demo users
  users = [
    { id: '1', name: 'Admin User', email: 'admin@kemu.ac.ke', role: 'admin' },
    { id: '2', name: 'Staff Member', email: 'staff@kemu.ac.ke', role: 'staff' },
    { id: '3', name: 'Viewer User', email: 'viewer@kemu.ac.ke', role: 'viewer' },
  ];

  currentUser = users[0]; // Default to admin

  // Demo assets
  assets = [
    {
      id: 'asset-1',
      assetTag: 'TRF20905QQ',
      name: 'HP Pro 3400',
      category: 'electronics',
      description: 'Developer laptop with M3 Max chip',
      location: '15th Floor',
      status: 'active',
      purchaseDate: '2023-06-15',
      purchasePrice: 3500,
      supplier: 'Apple Inc',
      warranty: '2025-06-15',
      lastModified: new Date().toISOString(),
      createdBy: 'admin@kemu.ac.ke',
    },
    {
      id: 'asset-2',
      assetTag: 'DESK-001',
      name: 'Standing Desk',
      category: 'furniture',
      description: 'Electric standing desk with dual motor',
      location: '15th Floor',
      status: 'active',
      purchaseDate: '2022-03-10',
      purchasePrice: 800,
      supplier: 'FlexiSpot',
      warranty: '2024-03-10',
      lastModified: new Date().toISOString(),
      createdBy: 'admin@kemu.ac.ke',
    },
    {
      id: 'asset-3',
      assetTag: 'CNC213P202',
      name: 'HP LV2011 Monitor',
      category: 'electronics',
      description: '4K monitor for design work',
      location: 'Design Studio',
      status: 'active',
      purchaseDate: '2023-01-20',
      purchasePrice: 600,
      supplier: 'Dell Technologies',
      warranty: '2025-01-20',
      lastModified: new Date().toISOString(),
      createdBy: 'admin@kemu.ac.ke',
    },
  ];

  // Demo maintenance records
  maintenanceRecords = [
    {
      id: 'maint-1',
      assetId: 'asset-1',
      type: 'preventive',
      date: '2024-01-15',
      description: 'Software update and disk cleanup',
      cost: 0,
      technician: 'John Doe',
      nextScheduled: '2024-06-15',
    },
    {
      id: 'maint-2',
      assetId: 'asset-2',
      type: 'inspection',
      date: '2024-02-01',
      description: 'Desk mechanism inspection',
      cost: 150,
      technician: 'Jane Smith',
      nextScheduled: '2024-08-01',
    },
  ];

  // Demo import history
  importHistories = [
    {
      id: 'import-1',
      fileName: 'assets_2024_01.xlsx',
      timestamp: '2024-01-10T14:30:00Z',
      rowsImported: 25,
      rowsSkipped: 2,
      errors: [],
      importedBy: 'admin@kemu.ac.ke',
    },
  ];

  initialized = true;
  persistStore();
}

// Asset operations
export function getAssets(): Asset[] {
  return [...assets];
}

export function getAssetById(id: string): Asset | undefined {
  return assets.find(a => a.id === id);
}

export function addAsset(asset: Omit<Asset, 'id' | 'lastModified' | 'createdBy'>): Asset {
  const newAsset: Asset = {
    ...asset,
    id: `asset-${Date.now()}`,
    lastModified: new Date().toISOString(),
    createdBy: currentUser?.email || 'system',
  };
  assets.push(newAsset);
  persistStore();
  return newAsset;
}

export function updateAsset(id: string, updates: Partial<Asset>): Asset {
  const asset = assets.find(a => a.id === id);
  if (!asset) throw new Error('Asset not found');
  
  Object.assign(asset, updates, { lastModified: new Date().toISOString() });
  persistStore();
  return asset;
}

export function deleteAsset(id: string): void {
  assets = assets.filter(a => a.id !== id);
  maintenanceRecords = maintenanceRecords.filter(m => m.assetId !== id);
  movements = movements.filter(m => m.assetId !== id);
  persistStore();
}

export function deleteAssets(ids: string[]): void {
  const idSet = new Set(ids);
  assets = assets.filter(a => !idSet.has(a.id));
  maintenanceRecords = maintenanceRecords.filter(m => !idSet.has(m.assetId));
  movements = movements.filter(m => !idSet.has(m.assetId));
  persistStore();
}

export function deleteImportedFile(fileId: string): void {
  deleteAssets(assets.filter(a => a.sourceFileId === fileId).map(a => a.id));
  importHistories = importHistories.filter(h => h.id !== fileId && h.fileSignature !== fileId);
  persistStore();
}

// Maintenance operations
export function getMaintenanceRecords(assetId?: string): MaintenanceRecord[] {
  if (assetId) {
    return maintenanceRecords.filter(m => m.assetId === assetId);
  }
  return [...maintenanceRecords];
}

export function addMaintenanceRecord(record: Omit<MaintenanceRecord, 'id'>): MaintenanceRecord {
  const newRecord: MaintenanceRecord = {
    ...record,
    id: `maint-${Date.now()}`,
  };
  maintenanceRecords.push(newRecord);
  persistStore();
  return newRecord;
}

// Movement operations
export function recordMovement(movement: Omit<AssetMovement, 'id'>): AssetMovement {
  const newMovement: AssetMovement = {
    ...movement,
    id: `move-${Date.now()}`,
  };
  movements.push(newMovement);
  persistStore();
  return newMovement;
}

export function getMovements(assetId?: string): AssetMovement[] {
  if (assetId) {
    return movements.filter(m => m.assetId === assetId);
  }
  return [...movements];
}

// Import history operations
export function addImportHistory(history: Omit<ImportHistory, 'id'>): ImportHistory {
  const newHistory: ImportHistory = {
    ...history,
    id: `import-${Date.now()}`,
  };
  importHistories.push(newHistory);
  persistStore();
  return newHistory;
}

export function getImportHistory(): ImportHistory[] {
  return [...importHistories].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// User operations
export function getCurrentUser(): User | null {
  return currentUser;
}

export function setCurrentUser(user: User): void {
  currentUser = user;
  persistStore();
}

export function getUsers(): User[] {
  return [...users];
}

export function switchUser(role: UserRole): void {
  const user = users.find(u => u.role === role);
  if (user) {
    currentUser = user;
    persistStore();
  }
}

// Dashboard metrics
export function getDashboardMetrics(): DashboardMetrics {
  const assetsByCategory: Record<string, number> = {};
  const assetsByLocation: Record<string, number> = {};
  const valueByCategory: Record<string, number> = {};

  assets.forEach(asset => {
    assetsByCategory[asset.category] = (assetsByCategory[asset.category] || 0) + 1;
    assetsByLocation[asset.location] = (assetsByLocation[asset.location] || 0) + 1;
    valueByCategory[asset.category] = (valueByCategory[asset.category] || 0) + (asset.purchasePrice || 0);
  });

  const upcomingMaintenance = maintenanceRecords
    .filter(m => m.nextScheduled)
    .sort((a, b) => new Date(a.nextScheduled!).getTime() - new Date(b.nextScheduled!).getTime())
    .slice(0, 5);

  return {
    totalAssets: assets.length,
    activeAssets: assets.filter(a => a.status === 'active').length,
    maintenanceAssets: assets.filter(a => a.status === 'maintenance').length,
    assetsByCategory,
    assetsByLocation,
    upcomingMaintenance,
    recentImports: importHistories.slice(0, 5),
    assignedAssets: assets.filter(a => Boolean(a.assignedTo?.trim())).length,
    retiredAssets: assets.filter(a => a.status === 'retired' || a.status === 'lost').length,
    missingSerials: assets.filter(a => !a.serialNo?.trim()).length,
    missingTags: assets.filter(a => !a.assetTag?.trim()).length,
    valueByCategory,
  };
}

// Search operations
export function searchAssets(query: string, filters?: { category?: string; location?: string; status?: string }): Asset[] {
  const lowerQuery = query.toLowerCase();
  
  return assets.filter(asset => {
    const matchesQuery = !query || 
      asset.name.toLowerCase().includes(lowerQuery) ||
      asset.assetTag.toLowerCase().includes(lowerQuery) ||
      asset.description.toLowerCase().includes(lowerQuery) ||
      asset.location.toLowerCase().includes(lowerQuery);

    const matchesCategory = !filters?.category || asset.category === filters.category;
    const matchesLocation = !filters?.location || asset.location === filters.location;
    const matchesStatus = !filters?.status || asset.status === filters.status;

    return matchesQuery && matchesCategory && matchesLocation && matchesStatus;
  });
}
