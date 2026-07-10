'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { initializeStore, getImportHistory, getCurrentUser, getUsers } from '@/lib/store';
import { ImportHistory, User } from '@/lib/types';
import { Shield, Download, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    initializeStore();
    const user = getCurrentUser();
    
    // Check if user is admin
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setCurrentUser(user);
    setImportHistory(getImportHistory());
    setUsers(getUsers());
  }, [router]);

  if (currentUser?.role !== 'admin') {
    return null;
  }

  const totalAssets = importHistory.reduce((sum, imp) => sum + imp.rowsImported, 0);
  const totalImports = importHistory.length;
  const totalErrors = importHistory.reduce((sum, imp) => sum + imp.errors.length, 0);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto flex flex-col">
        <Header
          title="Admin Settings"
          description="Manage system settings, users, and import history"
        />

        <div className="flex-1 p-6 space-y-6">
          {/* Admin Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-lg w-fit">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Admin Access</span>
          </div>

          {/* System Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Assets Imported"
              value={totalAssets}
              description="Across all imports"
              color="from-emerald-500 to-emerald-600"
            />
            <StatCard
              label="Import Operations"
              value={totalImports}
              description="File imports completed"
              color="from-blue-500 to-blue-600"
            />
            <StatCard
              label="Import Errors"
              value={totalErrors}
              description="Records with issues"
              color="from-amber-500 to-amber-600"
            />
          </div>

          {/* User Management */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">System Users</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {users.map((user) => (
                <div key={user.id} className="bg-secondary border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-foreground font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                      user.role === 'admin' ? 'bg-primary/20 text-primary' :
                      user.role === 'staff' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Import History */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Import History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="text-left py-4 px-6 font-semibold text-foreground">File Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Imported By</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Records</th>
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {importHistory.map((imp) => (
                    <tr key={imp.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="py-4 px-6 text-foreground">{imp.fileName}</td>
                      <td className="py-4 px-6 text-muted-foreground">
                        {new Date(imp.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{imp.importedBy}</td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <span className="text-emerald-300">✓ {imp.rowsImported}</span>
                          {imp.rowsSkipped > 0 && <span className="text-amber-300">⚠ {imp.rowsSkipped}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {imp.errors.length > 0 ? (
                          <span className="flex items-center gap-1 text-amber-300">
                            <AlertCircle className="w-4 h-4" />
                            {imp.errors.length} issues
                          </span>
                        ) : (
                          <span className="text-emerald-300">Success</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Configuration */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">System Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <p className="text-foreground font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Currently enabled</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <p className="text-foreground font-medium">Auto-backup</p>
                  <p className="text-xs text-muted-foreground">Disabled</p>
                </div>
                <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium">
                  Enable
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <p className="text-foreground font-medium">Export Data</p>
                  <p className="text-xs text-muted-foreground">Download all assets and records</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-lg transition-colors text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  color,
}: {
  label: string;
  value: number;
  description: string;
  color: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-6 text-white`}>
      <p className="text-sm font-medium opacity-90">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs opacity-75 mt-2">{description}</p>
    </div>
  );
}
