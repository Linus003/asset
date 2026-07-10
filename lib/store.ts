'use client';

import { Asset, MaintenanceRecord, ImportHistory, AssetMovement, User, UserRole, DashboardMetrics } from './types';

// In-memory data store
let assets: Asset[] = [];
let maintenanceRecords: MaintenanceRecord[] = [];
let importHistories: ImportHistory[] = [];
let movements: AssetMovement[] = [];
let currentUser: User | null = null;
let users: User[] = [];

// Initialize with demo data
export function initializeStore() {
  // Demo users
  users = [
    { id: '1', name: 'Admin User', email: 'admin@company.com', role: 'admin' },
    { id: '2', name: 'Staff Member', email: 'staff@company.com', role: 'staff' },
    { id: '3', name: 'Viewer User', email: 'viewer@company.com', role: 'viewer' },
  ];

  currentUser = users[0]; // Default to admin

  // Demo assets
  assets = [
    {
      id: 'asset-1',
      assetTag: 'LAP-001',
      name: 'MacBook Pro 16"',
      category: 'electronics',
      description: 'Developer laptop with M3 Max chip',
      location: 'Engineering Dept',
      status: 'active',
      purchaseDate: '2023-06-15',
      purchasePrice: 3500,
      supplier: 'Apple Inc',
      warranty: '2025-06-15',
      lastModified: new Date().toISOString(),
      createdBy: 'admin@company.com',
    },
    {
      id: 'asset-2',
      assetTag: 'DESK-001',
      name: 'Standing Desk',
      category: 'furniture',
      description: 'Electric standing desk with dual motor',
      location: 'Engineering Dept',
      status: 'active',
      purchaseDate: '2022-03-10',
      purchasePrice: 800,
      supplier: 'FlexiSpot',
      warranty: '2024-03-10',
      lastModified: new Date().toISOString(),
      createdBy: 'admin@company.com',
    },
    {
      id: 'asset-3',
      assetTag: 'MON-001',
      name: 'Dell UltraSharp 27"',
      category: 'electronics',
      description: '4K monitor for design work',
      location: 'Design Studio',
      status: 'active',
      purchaseDate: '2023-01-20',
      purchasePrice: 600,
      supplier: 'Dell Technologies',
      warranty: '2025-01-20',
      lastModified: new Date().toISOString(),
      createdBy: 'admin@company.com',
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
      importedBy: 'admin@company.com',
    },
  ];
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
  return newAsset;
}

export function updateAsset(id: string, updates: Partial<Asset>): Asset {
  const asset = assets.find(a => a.id === id);
  if (!asset) throw new Error('Asset not found');
  
  Object.assign(asset, updates, { lastModified: new Date().toISOString() });
  return asset;
}

export function deleteAsset(id: string): void {
  assets = assets.filter(a => a.id !== id);
  maintenanceRecords = maintenanceRecords.filter(m => m.assetId !== id);
  movements = movements.filter(m => m.assetId !== id);
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
  return newRecord;
}

// Movement operations
export function recordMovement(movement: Omit<AssetMovement, 'id'>): AssetMovement {
  const newMovement: AssetMovement = {
    ...movement,
    id: `move-${Date.now()}`,
  };
  movements.push(newMovement);
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
}

export function getUsers(): User[] {
  return [...users];
}

export function switchUser(role: UserRole): void {
  const user = users.find(u => u.role === role);
  if (user) {
    currentUser = user;
  }
}

// Dashboard metrics
export function getDashboardMetrics(): DashboardMetrics {
  const assetsByCategory: Record<string, number> = {};
  const assetsByLocation: Record<string, number> = {};

  assets.forEach(asset => {
    assetsByCategory[asset.category] = (assetsByCategory[asset.category] || 0) + 1;
    assetsByLocation[asset.location] = (assetsByLocation[asset.location] || 0) + 1;
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
