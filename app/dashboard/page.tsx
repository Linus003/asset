'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { initializeStore, getDashboardMetrics, getAssets } from '@/lib/store';
import { Package, AlertCircle, BarChart3, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(getDashboardMetrics());

  useEffect(() => {
    initializeStore();
    setMetrics(getDashboardMetrics());
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto flex flex-col">
        <Header 
          title="Dashboard" 
          description="Overview of your asset inventory and maintenance schedule"
        />

        <div className="flex-1 p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Assets"
              value={metrics.totalAssets}
              icon={<Package className="w-6 h-6" />}
              trend="+12% this month"
              color="from-emerald-500 to-emerald-600"
            />
            <MetricCard
              label="Active Assets"
              value={metrics.activeAssets}
              icon={<TrendingUp className="w-6 h-6" />}
              trend={`${metrics.totalAssets ? ((metrics.activeAssets / metrics.totalAssets) * 100).toFixed(1) : '0.0'}% of total`}
              color="from-blue-500 to-blue-600"
            />
            <MetricCard
              label="In Maintenance"
              value={metrics.maintenanceAssets}
              icon={<AlertCircle className="w-6 h-6" />}
              trend="Requires attention"
              color="from-amber-500 to-amber-600"
            />
            <MetricCard
              label="Assets by Location"
              value={Object.keys(metrics.assetsByLocation).length}
              icon={<BarChart3 className="w-6 h-6" />}
              trend="Different locations"
              color="from-purple-500 to-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assets by Category */}
            <div className="lg:col-span-1 bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Assets by Category</h3>
              <div className="space-y-3">
                {Object.entries(metrics.assetsByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-muted-foreground capitalize">{category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${metrics.totalAssets ? (count / metrics.totalAssets) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-foreground font-semibold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div className="lg:col-span-1 bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Top Locations</h3>
              <div className="space-y-3">
                {Object.entries(metrics.assetsByLocation)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([location, count]) => (
                    <div key={location} className="flex items-center justify-between">
                      <span className="text-muted-foreground truncate">{location}</span>
                      <span className="text-foreground font-semibold bg-secondary px-3 py-1 rounded-lg">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Imports */}
            <div className="lg:col-span-1 bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Imports</h3>
              <div className="space-y-3">
                {metrics.recentImports.slice(0, 5).length > 0 ? (
                  metrics.recentImports.slice(0, 5).map((imp) => (
                    <div key={imp.id} className="text-sm border-l-2 border-primary pl-3">
                      <p className="text-foreground font-medium">{imp.fileName}</p>
                      <p className="text-muted-foreground text-xs">
                        {imp.rowsImported} assets imported
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No imports yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Maintenance */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Maintenance</h3>
            {metrics.upcomingMaintenance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Scheduled Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Technician</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.upcomingMaintenance.map((maint) => (
                      <tr key={maint.id} className="border-b border-border hover:bg-secondary">
                        <td className="py-3 px-4">
                          <span className="capitalize text-foreground font-medium">{maint.type}</span>
                        </td>
                        <td className="py-3 px-4 text-foreground">{maint.nextScheduled}</td>
                        <td className="py-3 px-4 text-muted-foreground">{maint.technician}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming maintenance scheduled</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4">
            <Link
              href="/assets"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg transition-colors text-center"
            >
              View All Assets
            </Link>
            <Link
              href="/import"
              className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-medium py-3 rounded-lg transition-colors text-center"
            >
              Import Assets
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  trend,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend: string;
  color: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-6 text-white`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium opacity-90">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
      <p className="text-xs opacity-75">{trend}</p>
    </div>
  );
}
