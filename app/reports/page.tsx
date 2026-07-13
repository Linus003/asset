'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { getAssets, getCampuses, getSelectedCampusId, initializeStore, searchAssets, setSelectedCampusId, subscribeToStoreChanges } from '@/lib/store';
import { Asset, CampusId } from '@/lib/types';
import { Download, FileText, Printer, Search, UserCheck } from 'lucide-react';
import Link from 'next/link';

function csvEscape(value: string | number | undefined) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export default function ReportsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedCampusId, setCampusState] = useState<CampusId>('nairobi');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportType, setReportType] = useState<'all' | 'assigned' | 'unassigned' | 'maintenance' | 'retired'>('all');

  useEffect(() => {
    initializeStore();
    const refresh = () => {
      setCampusState(getSelectedCampusId());
      setAssets(getAssets());
    };
    refresh();
    return subscribeToStoreChanges(refresh);
  }, []);

  const campusOptions = [{ id: 'all' as CampusId, name: 'All Campuses' }, ...getCampuses().map((campus) => ({ id: campus.id as CampusId, name: campus.name }))];

  const filteredAssets = useMemo(() => {
    const searched = searchAssets(searchQuery);
    switch (reportType) {
      case 'assigned':
        return searched.filter((asset) => asset.assignedTo?.trim());
      case 'unassigned':
        return searched.filter((asset) => !asset.assignedTo?.trim());
      case 'maintenance':
        return searched.filter((asset) => asset.status === 'maintenance');
      case 'retired':
        return searched.filter((asset) => asset.status === 'retired' || asset.status === 'lost');
      default:
        return searched;
    }
  }, [searchQuery, reportType, assets]);

  const assignedPeople = new Set(filteredAssets.filter((asset) => asset.assignedTo?.trim()).map((asset) => asset.assignedTo!.trim())).size;
  const totalValue = filteredAssets.reduce((total, asset) => total + (asset.purchasePrice || 0), 0);

  const handleCampusChange = (campusId: CampusId) => {
    setSelectedCampusId(campusId);
    setCampusState(campusId);
    setAssets(getAssets());
  };

  const downloadCsv = () => {
    const headers = ['Asset Tag', 'Serial No', 'Name', 'Category', 'Location', 'Status', 'Assigned To', 'Purchase Price', 'Supplier', 'Warranty'];
    const rows = filteredAssets.map((asset) => [asset.assetTag, asset.serialNo, asset.name, asset.category, asset.location, asset.status, asset.assignedTo, asset.purchasePrice, asset.supplier, asset.warranty]);
    const csv = [headers, ...rows].map((row) => row.map((value) => csvEscape(value)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kemu-assets-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto flex flex-col">
        <Header
          title="Reports & Asset Search"
          description="Generate inventory reports and quickly identify who has a specific computer or device."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCampusId={selectedCampusId}
          onCampusChange={handleCampusChange}
          campusOptions={campusOptions}
          searchPlaceholder="Search by assignee, computer name, serial, asset tag, model, location..."
        />

        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Report Results</p><FileText className="w-5 h-5 text-primary" /></div>
              <p className="text-2xl font-bold text-foreground mt-2">{filteredAssets.length}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Assigned People</p><UserCheck className="w-5 h-5 text-emerald-400" /></div>
              <p className="text-2xl font-bold text-foreground mt-2">{assignedPeople}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Total Value</p><Search className="w-5 h-5 text-blue-400" /></div>
              <p className="text-2xl font-bold text-foreground mt-2">KES {totalValue.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between print:hidden">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Report type</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value as typeof reportType)} className="px-3 py-2 bg-secondary border border-border rounded-lg text-foreground">
                <option value="all">All assets</option>
                <option value="assigned">Assigned assets / custody report</option>
                <option value="unassigned">Unassigned assets</option>
                <option value="maintenance">Maintenance report</option>
                <option value="retired">Retired or lost assets</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={downloadCsv} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"><Download className="w-4 h-4" />Export CSV</button>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg"><Printer className="w-4 h-4" />Print</button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border"><tr><th className="text-left p-4">Asset</th><th className="text-left p-4">Serial / Model</th><th className="text-left p-4">Location</th><th className="text-left p-4">Status</th><th className="text-left p-4">Assigned To</th><th className="text-left p-4 print:hidden">Details</th></tr></thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="border-b border-border hover:bg-secondary/40"><td className="p-4"><p className="font-semibold text-foreground">{asset.name}</p><p className="font-mono text-xs text-primary">{asset.assetTag}</p></td><td className="p-4 text-muted-foreground"><p>{asset.serialNo || 'No serial recorded'}</p><p>{asset.model || 'No model recorded'}</p></td><td className="p-4 text-foreground">{asset.location}</td><td className="p-4 capitalize">{asset.status}</td><td className="p-4 font-medium text-foreground">{asset.assignedTo?.trim() || 'Unassigned'}</td><td className="p-4 print:hidden"><Link href={`/assets/${asset.id}`} className="text-primary hover:underline">View</Link></td></tr>
                ))}
                {!filteredAssets.length && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No assets match this report or search.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
