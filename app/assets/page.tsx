'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { deleteAsset, deleteAssets, getAssets, initializeStore, searchAssets, subscribeToStoreChanges } from '@/lib/store';
import { Asset } from '@/lib/types';
import { Plus, Edit2, Trash2, ChevronDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    initializeStore();
    const refreshAssets = () => {
      const allAssets = getAssets();
      setAssets(allAssets);
      setFilteredAssets(searchAssets(searchQuery, { category: selectedCategory || undefined, location: selectedLocation || undefined, status: selectedStatus || undefined }));
    };
    refreshAssets();
    return subscribeToStoreChanges(refreshAssets);
  }, []);

  useEffect(() => {
    const results = searchAssets(searchQuery, {
      category: selectedCategory || undefined,
      location: selectedLocation || undefined,
      status: selectedStatus || undefined,
    });
    setFilteredAssets(results);
  }, [searchQuery, selectedCategory, selectedLocation, selectedStatus]);

  const categories = Array.from(new Set(assets.map((a) => a.category)));
  const locations = Array.from(new Set(assets.map((a) => a.location)));
  const statuses = Array.from(new Set(assets.map((a) => a.status)));

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      deleteAsset(id);
      const allAssets = getAssets();
      setAssets(allAssets);
      setFilteredAssets(searchAssets(searchQuery, {
        category: selectedCategory || undefined,
        location: selectedLocation || undefined,
        status: selectedStatus || undefined,
      }));
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto flex flex-col">
        <Header
          title="Assets"
          description="Manage and track all your physical assets"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="flex-1 p-6 space-y-6">
          {/* Filters and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
                Filters
              </button>
            </div>
            <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <button onClick={() => { if (confirm(`Delete ${selectedIds.length} selected assets?`)) { deleteAssets(selectedIds); setSelectedIds([]); } }} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium">
                  <Trash2 className="w-5 h-5" /> Delete selected ({selectedIds.length})
                </button>
              )}
            <Link
              href="/assets/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Asset
            </Link>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                >
                  <option value="">All Status</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Assets Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="text-left py-4 px-6 font-semibold text-foreground"><input type="checkbox" checked={filteredAssets.length > 0 && selectedIds.length === filteredAssets.length} onChange={(e) => setSelectedIds(e.target.checked ? filteredAssets.map((asset) => asset.id) : [])} /></th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Asset Tag</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Category</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Location</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Value</th>
                    <th className="text-center py-4 px-6 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <tr key={asset.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="py-4 px-6"><input type="checkbox" checked={selectedIds.includes(asset.id)} onChange={(e) => setSelectedIds((ids) => e.target.checked ? [...ids, asset.id] : ids.filter((id) => id !== asset.id))} /></td>
                        <td className="py-4 px-6 font-mono text-primary font-semibold">{asset.assetTag}</td>
                        <td className="py-4 px-6 text-foreground">{asset.name}</td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium text-foreground capitalize">
                            {asset.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-muted-foreground">{asset.location}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            asset.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                            asset.status === 'maintenance' ? 'bg-amber-500/20 text-amber-300' :
                            asset.status === 'retired' ? 'bg-red-500/20 text-red-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-foreground font-semibold">${asset.purchasePrice.toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/assets/${asset.id}`}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors text-primary"
                              title="View details"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setEditingId(asset.id === editingId ? null : asset.id)}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors text-foreground"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(asset.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        No assets found matching your search criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <p>Showing {filteredAssets.length} of {assets.length} assets</p>
          </div>
        </div>
      </main>
    </div>
  );
}
