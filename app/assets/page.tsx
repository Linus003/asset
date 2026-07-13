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
  
  const [editFormData, setEditFormData] = useState<Partial<Asset>>({});

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

  const handleEditClick = (asset: Asset) => {
    if (editingId === asset.id) {
      setEditingId(null);
      return;
    }
    setEditingId(asset.id);
    setEditFormData({
      name: asset.name,
      category: asset.category,
      location: asset.location,
      status: asset.status,
      purchasePrice: asset.purchasePrice,
    assignedTo: asset.assignedTo|| '',
    });
  };

  const handleSaveEdit = (id: string) => {
    const allAssets = getAssets();
    const asset = allAssets.find(a => a.id === id);
    if (!asset) return;
    
    const updatedAsset = { ...asset, ...editFormData };
    const updatedAssets = allAssets.map(a => 
      a.id === id ? updatedAsset : a
    );
    
    localStorage.setItem('assets', JSON.stringify(updatedAssets));
    
    setEditingId(null);
    const refreshed = getAssets();
    setAssets(refreshed);
    setFilteredAssets(searchAssets(searchQuery, {
      category: selectedCategory || undefined,
      location: selectedLocation || undefined,
      status: selectedStatus || undefined,
    }));
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
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Assigned To</th>
                    <th className="text-center py-4 px-6 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <tr key={asset.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="py-4 px-6"><input type="checkbox" checked={selectedIds.includes(asset.id)} onChange={(e) => setSelectedIds((ids) => e.target.checked ? [...ids, asset.id] : ids.filter((id) => id !== asset.id))} /></td>
                        <td className="py-4 px-6 font-mono text-primary font-semibold">{asset.assetTag}</td>
                        
                        {/* ✅ MODIFIED: Name column with inline editing */}
                        <td className="py-4 px-6 text-foreground">
                          {editingId === asset.id ? (
                            <input
                              type="text"
                              value={editFormData.name || ''}
                              onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                              className="w-full px-2 py-1 bg-background border border-border rounded text-foreground"
                              autoFocus
                            />
                          ) : (
                            asset.name
                          )}
                        </td>
                        
                        {/* ✅ MODIFIED: Category column with inline editing */}
                        <td className="py-4 px-6">
                          {editingId === asset.id ? (
                            <select
                              value={editFormData.category || ''}
                              onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                              className="w-full px-2 py-1 bg-background border border-border rounded text-foreground capitalize"
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium text-foreground capitalize">
                              {asset.category}
                            </span>
                          )}
                        </td>
                        
                        {/* ✅ MODIFIED: Location column with inline editing */}
                        <td className="py-4 px-6 text-muted-foreground">
                          {editingId === asset.id ? (
                            <select
                              value={editFormData.location || ''}
                              onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                              className="w-full px-2 py-1 bg-background border border-border rounded text-foreground"
                            >
                              {locations.map((loc) => (
                                <option key={loc} value={loc}>{loc}</option>
                              ))}
                            </select>
                          ) : (
                            asset.location
                          )}
                        </td>
                  
                        <td className="py-4 px-6">
                          {editingId === asset.id ? (
                            <select
                              value={editFormData.status || ''}
                              onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                              className="w-full px-2 py-1 bg-background border border-border rounded text-foreground capitalize"
                            >
                              {statuses.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                              asset.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                              asset.status === 'maintenance' ? 'bg-amber-500/20 text-amber-300' :
                              asset.status === 'retired' ? 'bg-red-500/20 text-red-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {asset.status}
                            </span>
                          )}
                        </td>
                        
                        <td className="py-4 px-6 text-foreground font-semibold">
                          {editingId === asset.id ? (
                            <input
                              type="number"
                              value={editFormData.purchasePrice || ''}
                              onChange={(e) => setEditFormData({...editFormData, purchasePrice: parseFloat(e.target.value)})}
                              className="w-full px-2 py-1 bg-background border border-border rounded text-foreground"
                              step="0.01"
                            />
                          ) : (
                            `$${asset.purchasePrice.toLocaleString()}`
                          )}
                        </td>
                        <td className="py-4 px-6">
  {editingId === asset.id ? (
    <input
      type="text"
      value={editFormData.assignedTo || ''}
      onChange={(e) => setEditFormData({...editFormData, assignedTo: e.target.value})}
      className="w-full px-2 py-1 bg-background border border-border rounded text-foreground text-sm"
      placeholder="Enter person's name"
    />
  ) : (
    asset.assignedTo ? (
      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs">
        {asset.assignedTo}
      </span>
    ) : (
      <span className="text-muted-foreground text-xs">—</span>
    )
                        )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {editingId === asset.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(asset.id)}
                                  className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg transition-colors text-emerald-400"
                                  title="Save"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-red-400"
                                  title="Cancel"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <>
                                <Link
                                  href={`/assets/${asset.id}`}
                                  className="p-2 hover:bg-secondary rounded-lg transition-colors text-primary"
                                  title="View details"
                                >
                                  <TrendingUp className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => handleEditClick(asset)}
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
                              </>
                            )}
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