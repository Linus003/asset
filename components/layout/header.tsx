'use client';

import { Search } from 'lucide-react';
import { CampusId } from '@/lib/types';

interface HeaderProps {
  title: string;
  description?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  selectedCampusId?: CampusId;
  onCampusChange?: (campusId: CampusId) => void;
  campusOptions?: { id: CampusId; name: string }[];
}

export function Header({ title, description, searchValue, onSearchChange, selectedCampusId, onCampusChange, campusOptions }: HeaderProps) {
  return (
    <div className="bg-card border-b border-border p-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
          <h2 className="text-3xl font-bold text-foreground">{title}</h2>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>

          {onCampusChange && selectedCampusId && campusOptions && (
            <div className="min-w-60">
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Campus profile</label>
              <select
                value={selectedCampusId}
                onChange={(e) => onCampusChange(e.target.value as CampusId)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {campusOptions.map((campus) => (
                  <option key={campus.id} value={campus.id}>{campus.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {onSearchChange && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}
      </div>
    </div>
  );
}
