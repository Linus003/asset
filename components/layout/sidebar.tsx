'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Upload, Settings, Home, Package, Wrench, LogOut, User } from 'lucide-react';
import { getCurrentUser, switchUser, getUsers } from '@/lib/store';
import { useState } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const currentUser = getCurrentUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const users = getUsers();

  const isActive = (href: string) => pathname === href;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/assets', label: 'Assets', icon: Package },
    { href: '/import', label: 'Import Assets', icon: Upload },
    { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  ];

  const adminItems = [
    { href: '/admin', label: 'Admin', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <Package className="w-6 h-6" />
          <span>AssetHub</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Admin section */}
        {currentUser?.role === 'admin' && (
          <div className="pt-4 border-t border-border">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Admin</p>
            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-foreground"
          >
            <User className="w-5 h-5" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentUser?.role}</p>
            </div>
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg z-10">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    switchUser(user.role);
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    user.id === currentUser?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
