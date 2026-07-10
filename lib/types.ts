// Core types for the inventory management system

export type UserRole = 'admin' | 'staff' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'lost';
export type AssetCategory = 'electronics' | 'furniture' | 'tools' | 'vehicles' | 'other';
export type MaintenanceType = 'preventive' | 'corrective' | 'inspection';

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: AssetCategory;
  description: string;
  location: string;
  status: AssetStatus;
  purchaseDate: string;
  purchasePrice: number;
  supplier: string;
  warranty: string;
  lastModified: string;
  createdBy: string;
  qrCode?: string;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: MaintenanceType;
  date: string;
  description: string;
  cost: number;
  technician: string;
  nextScheduled?: string;
}

export interface ImportHistory {
  id: string;
  fileName: string;
  timestamp: string;
  rowsImported: number;
  rowsSkipped: number;
  errors: ImportError[];
  importedBy: string;
}

export interface ImportError {
  row: number;
  field: string;
  value: string;
  reason: string;
}

export interface AssetMovement {
  id: string;
  assetId: string;
  fromLocation: string;
  toLocation: string;
  timestamp: string;
  movedBy: string;
  reason: string;
}

export interface DashboardMetrics {
  totalAssets: number;
  activeAssets: number;
  maintenanceAssets: number;
  assetsByCategory: Record<AssetCategory, number>;
  assetsByLocation: Record<string, number>;
  upcomingMaintenance: MaintenanceRecord[];
  recentImports: ImportHistory[];
}
