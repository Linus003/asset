'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { getAssets, getAssignedAssets, getCampuses, getSelectedCampusId, initializeStore, setSelectedCampusId, subscribeToStoreChanges } from '@/lib/store';
import { Asset, CampusId } from '@/lib/types';
import {
  Users,
  UserCheck,
  Wrench,
  MapPin,
  DollarSign,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ClipboardCheck
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assignedAssets, setAssignedAssets] = useState<Asset[]>([]);
  const [showAssignments, setShowAssignments] = useState(false);
  const [selectedCampusId, setCampusState] = useState<CampusId>('nairobi');

  useEffect(() => {
    initializeStore();
    const refreshAssets = () => {
      setCampusState(getSelectedCampusId());
      const all = getAssets();
      setAssets(all);
      setAssignedAssets(getAssignedAssets());
    };
    refreshAssets();
    return subscribeToStoreChanges(refreshAssets);
  }, []);

  // Calculate metrics
  const totalAssets = assets.length;
  const assignedCount = assignedAssets.length;
  const unassignedCount = totalAssets - assignedCount;
  const activeAssets = assets.filter(a => a.status === 'active').length;
  const maintenanceAssets = assets.filter(a => a.status === 'maintenance').length;
  const locations = new Set(assets.map(a => a.location)).size;
  const totalValue = assets.reduce((sum, a) => sum + a.purchasePrice, 0);

  // Get assets with serial numbers
  const hasSerial = assets.filter(a => a.assetTag && a.assetTag.length > 0);
  const serialCompliance = totalAssets > 0 ? Math.round((hasSerial.length / totalAssets) * 100) : 0;
  const missingSerial = totalAssets - hasSerial.length;

  // Group assignments by person
  const getAssignmentsByPerson = () => {
    const map: { [key: string]: Asset[] } = {};
    assignedAssets.forEach(asset => {
      if (asset.assignedTo) {
        if (!map[asset.assignedTo]) map[asset.assignedTo] = [];
        map[asset.assignedTo].push(asset);
      }
    });
    return map;
  };

  const assignmentsByPerson = getAssignmentsByPerson();

  const campusOptions = [{ id: 'all' as CampusId, name: 'All Campuses' }, ...getCampuses().map((campus) => ({ id: campus.id as CampusId, name: campus.name }))];

  const handleCampusChange = (campusId: CampusId) => {
    setSelectedCampusId(campusId);
    setCampusState(campusId);
    setAssets(getAssets());
    setAssignedAssets(getAssignedAssets());
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto flex flex-col">
        <Header
          title="Dashboard"
          description="Overview of your asset inventory"
          searchValue=""
          onSearchChange={() => {}}
          selectedCampusId={selectedCampusId}
          onCampusChange={handleCampusChange}
          campusOptions={campusOptions}
        />

        <div className="flex-1 p-6 space-y-6">
          {/* Stats Grid - Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Assets */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totalAssets}</p>
                </div>
                <div className="p-2.5 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                <span>+12% this month</span>
              </div>
            </div>

            {/* Active Assets */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Assets</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{activeAssets}</p>
                </div>
                <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {totalAssets > 0 ? Math.round((activeAssets / totalAssets) * 100) : 0}% of total
              </p>
            </div>

            {/* In Maintenance */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Maintenance</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{maintenanceAssets}</p>
                </div>
                <div className="p-2.5 bg-amber-500/10 rounded-lg">
                  <Wrench className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <p className="text-xs text-amber-400 mt-2">Requires attention</p>
            </div>

            {/* Locations */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Locations</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{locations}</p>
                </div>
                <div className="p-2.5 bg-blue-500/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Campuses, offices, and labs</p>
            </div>
          </div>

          {/* Stats Grid - Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Asset Value */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Asset Value</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    KES {totalValue.toLocaleString()}
                  </p>
                </div>
                <div className="p-2.5 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Book value captured from imports and manual entries</p>
            </div>

            {/* ✅ Assigned Devices - CLICKABLE */}
            <div
              className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => setShowAssignments(!showAssignments)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Devices</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{assignedCount}</p>
                </div>
                <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {unassignedCount} assets still need a custodian
                </p>
                <span className="text-xs text-primary flex items-center gap-1">
                  {showAssignments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showAssignments ? 'Hide' : 'View'}
                </span>
              </div>
            </div>

            {/* Serial Compliance */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Serial Compliance</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{serialCompliance}%</p>
                </div>
                <div className="p-2.5 bg-purple-500/10 rounded-lg">
                  <ClipboardCheck className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-xs text-amber-400 mt-2">
                {missingSerial} records missing serial numbers
              </p>
            </div>

            {/* Lifecycle Risk */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lifecycle Risk</p>
                  <p className="text-2xl font-bold text-foreground mt-1">0</p>
                </div>
                <div className="p-2.5 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Retired or end-of-life equipment to replace</p>
            </div>
          </div>

          {/* ✅ Assigned Devices Expanded List */}
          {showAssignments && (
            <div className="bg-card border border-border rounded-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-border bg-secondary/20">
                <h3 className="text-lg font-semibold text-foreground">Assigned Devices by Person</h3>
                <p className="text-sm text-muted-foreground">
                  {assignedCount} devices assigned to {Object.keys(assignmentsByPerson).length} people
                </p>
              </div>

              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {Object.keys(assignmentsByPerson).length > 0 ? (
                  Object.entries(assignmentsByPerson).map(([person, devices]) => (
                    <div key={person} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-primary/10 rounded-full">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <h4 className="font-semibold text-foreground">{person}</h4>
                        </div>
                        <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium text-foreground">
                          {devices.length} device{devices.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {devices.map(device => (
                          <div
                            key={device.id}
                            className="flex items-center justify-between bg-secondary/20 rounded-lg px-3 py-2"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs text-primary font-medium">
                                {device.assetTag}
                              </span>
                              <span className="text-foreground text-sm">{device.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">{device.location}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                device.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                                device.status === 'maintenance' ? 'bg-amber-500/20 text-amber-300' :
                                device.status === 'retired' ? 'bg-red-500/20 text-red-300' :
                                'bg-gray-500/20 text-gray-300'
                              }`}>
                                {device.status}
                              </span>
                              <Link
                                href={`/assets/${device.id}`}
                                className="text-primary hover:underline text-xs"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No devices are currently assigned to anyone
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}