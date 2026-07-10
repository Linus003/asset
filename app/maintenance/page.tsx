'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { initializeStore, getMaintenanceRecords, getAssets, addMaintenanceRecord } from '@/lib/store';
import { MaintenanceRecord, MaintenanceType } from '@/lib/types';
import { Plus, Calendar, User, DollarSign } from 'lucide-react';

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    assetId: '',
    type: 'preventive' as MaintenanceType,
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
    technician: '',
    nextScheduled: '',
  });

  useEffect(() => {
    initializeStore();
    setRecords(getMaintenanceRecords());
    setAssets(getAssets());
  }, []);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRecord = addMaintenanceRecord({
      assetId: formData.assetId,
      type: formData.type,
      date: formData.date,
      description: formData.description,
      cost: parseFloat(formData.cost) || 0,
      technician: formData.technician,
      nextScheduled: formData.nextScheduled || undefined,
    });

    setRecords([...records, newRecord]);
    setFormData({
      assetId: '',
      type: 'preventive',
      date: new Date().toISOString().split('T')[0],
      description: '',
      cost: '',
      technician: '',
      nextScheduled: '',
    });
    setShowForm(false);
  };

  const getAssetName = (assetId: string) => {
    return assets.find(a => a.id === assetId)?.name || 'Unknown Asset';
  };

  const upcomingRecords = records
    .filter(r => r.nextScheduled)
    .sort((a, b) => new Date(a.nextScheduled!).getTime() - new Date(b.nextScheduled!).getTime());

  const recentRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto flex flex-col">
        <Header
          title="Maintenance Schedule"
          description="Track and manage asset maintenance records"
        />

        <div className="flex-1 p-6 space-y-6">
          {/* Add Record Button */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium w-fit"
          >
            <Plus className="w-5 h-5" />
            Add Maintenance Record
          </button>

          {/* Form */}
          {showForm && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">New Maintenance Record</h3>
              <form onSubmit={handleAddRecord} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Asset</label>
                    <select
                      value={formData.assetId}
                      onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                      required
                    >
                      <option value="">Select an asset</option>
                      {assets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.assetTag} - {asset.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as MaintenanceType })}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                    >
                      <option value="preventive">Preventive</option>
                      <option value="corrective">Corrective</option>
                      <option value="inspection">Inspection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Cost</label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Technician</label>
                    <input
                      type="text"
                      value={formData.technician}
                      onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Next Scheduled</label>
                    <input
                      type="date"
                      value={formData.nextScheduled}
                      onChange={(e) => setFormData({ ...formData, nextScheduled: e.target.value })}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium"
                  >
                    Add Record
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Upcoming Maintenance */}
          {upcomingRecords.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Maintenance</h3>
              <div className="space-y-3">
                {upcomingRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{getAssetName(record.assetId)}</p>
                      <p className="text-sm text-muted-foreground">{record.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {record.nextScheduled}
                      </div>
                      <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium capitalize">
                        {record.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Records */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Asset</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Technician</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((record) => (
                    <tr key={record.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="py-4 px-6 text-foreground">{getAssetName(record.assetId)}</td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium text-foreground capitalize">
                          {record.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{record.date}</td>
                      <td className="py-4 px-6 text-muted-foreground">{record.technician}</td>
                      <td className="py-4 px-6 text-foreground font-semibold">${record.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
