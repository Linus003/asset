'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { initializeStore, getAssetById, getMaintenanceRecords, getMovements, updateAsset } from '@/lib/store';
import { Asset, MaintenanceRecord, AssetMovement } from '@/lib/types';
import { ArrowLeft, Edit2, Save } from 'lucide-react';
import Link from 'next/link';

export default function AssetDetailsPage() {
  const params = useParams();
  const assetId = params.id as string;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Asset>>({});

  useEffect(() => {
    initializeStore();
    const foundAsset = getAssetById(assetId);
    if (foundAsset) {
      setAsset(foundAsset);
      setEditData(foundAsset);
      setMaintenance(getMaintenanceRecords(assetId));
      setMovements(getMovements(assetId));
    }
  }, [assetId]);

  const handleSave = () => {
    if (asset) {
      updateAsset(asset.id, editData as Asset);
      setAsset({ ...asset, ...editData });
      setIsEditing(false);
    }
  };

  if (!asset) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Asset not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-card border-b border-border p-6">
          <Link href="/assets" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 w-fit">
            <ArrowLeft className="w-5 h-5" />
            Back to Assets
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-mono text-primary">{asset.assetTag}</p>
              <h1 className="text-3xl font-bold text-foreground mt-1">{asset.name}</h1>
            </div>
            <button
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                isEditing
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80 text-foreground'
              }`}
            >
              {isEditing ? (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit2 className="w-5 h-5" />
                  Edit
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-w-4xl">
          {/* Main Info */}
          <div className="bg-card border border-border rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField
              label="Category"
              value={asset.category}
              editable={isEditing}
              onEdit={(value) => setEditData({ ...editData, category: value as any })}
            />
            <InfoField
              label="Status"
              value={asset.status}
              editable={isEditing}
              onEdit={(value) => setEditData({ ...editData, status: value as any })}
            />
            <InfoField
              label="Location"
              value={asset.location}
              editable={isEditing}
              onEdit={(value) => setEditData({ ...editData, location: value })}
            />
            <InfoField
              label="Purchase Date"
              value={asset.purchaseDate}
              editable={isEditing}
              onEdit={(value) => setEditData({ ...editData, purchaseDate: value })}
            />
            <InfoField
              label="Purchase Price"
              value={`$${asset.purchasePrice.toLocaleString()}`}
              editable={isEditing}
              onEdit={(value) => setEditData({ ...editData, purchasePrice: parseFloat(value) })}
            />
            <InfoField
              label="Supplier"
              value={asset.supplier}
              editable={isEditing}
              onEdit={(value) => setEditData({ ...editData, supplier: value })}
            />
          <InfoField
                     label="Assigned To"
    value={asset.assignedTo || 'Unassigned'}
  editable={isEditing}
  onEdit={(value) => setEditData({ ...editData, assignedTo: value === 'Unassigned' ? '' : value })}
        /> 
            <InfoField
              label="Warranty"
              value={asset.warranty}
              editable={isEditing}
              onEdit={(value) => setEditData({ ...editData, warranty: value })}
            />
          </div>

          {/* Description */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-3">Description</h3>
            {isEditing ? (
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                rows={4}
              />
            ) : (
              <p className="text-foreground">{asset.description}</p>
            )}
          </div>

          {/* Maintenance History */}
          {maintenance.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Maintenance History</h3>
              <div className="space-y-3">
                {maintenance.map((record) => (
                  <div key={record.id} className="border-l-2 border-primary pl-4 py-2">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-foreground font-medium capitalize">{record.type} - {record.date}</p>
                      {record.cost > 0 && <p className="text-primary font-semibold">${record.cost.toFixed(2)}</p>}
                    </div>
                    <p className="text-muted-foreground text-sm">{record.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Technician: {record.technician}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Movement History */}
          {movements.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Movement History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">From</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">To</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((move) => (
                      <tr key={move.id} className="border-b border-border hover:bg-secondary/50">
                        <td className="py-3 px-4 text-foreground">{move.fromLocation}</td>
                        <td className="py-3 px-4 text-foreground">{move.toLocation}</td>
                        <td className="py-3 px-4 text-muted-foreground">{move.timestamp}</td>
                        <td className="py-3 px-4 text-muted-foreground">{move.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Meta Information */}
          <div className="bg-secondary border border-border rounded-lg p-6 text-xs text-muted-foreground space-y-1">
            <p>Created by: {asset.createdBy}</p>
            <p>Last modified: {new Date(asset.lastModified).toLocaleString()}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoField({
  label,
  value,
  editable,
  onEdit,
}: {
  label: string;
  value: string;
  editable: boolean;
  onEdit?: (value: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  if (editable && isEditing) {
    return (
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
        <input
          type="text"
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            onEdit?.(e.target.value);
          }}
          className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
        />
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold text-foreground capitalize">{value}</p>
    </div>
  );
}
