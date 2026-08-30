import React, { useState } from 'react';
import { 
  Search,
  X,
  Bookmark, 
  Sun, 
  Moon,
  Upload,
  Plus,
  LogOut,
  UserCheck,
  HardDrive,
  AlertTriangle
} from 'lucide-react';
import { TechSupportLogo } from './TechSupportLogo';
import { StorageUsageInfo } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showQuickSearch: boolean;
  onOpenMyVault: () => void;
  onOpenUploadModal: () => void;
  savedCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser?: string;
  onLogout?: () => void;
  storageUsage?: StorageUsageInfo | null;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  showQuickSearch,
  onOpenMyVault,
  onOpenUploadModal,
  savedCount,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onLogout,
  storageUsage
}) => {
  const [showStorageTooltip, setShowStorageTooltip] = useState(false);

  const usedPct = storageUsage ? storageUsage.usedPercentage : 0;
  const isNearLimit = usedPct >= 80;
  const isFull = usedPct >= 98;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-blue-100 dark:border-zinc-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <TechSupportLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
                Tech <span className="text-blue-600 dark:text-blue-400">Support</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 hidden sm:inline-block font-mono">
                Resource Vault
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden lg:block font-medium">
              Curated library of verified support files, automation scripts & tools
            </p>
          </div>
        </div>

        {/* Dynamic Quick Search - Appears ONLY when the Big Search bar is scrolled out of view */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4 flex items-center justify-center">
          {showQuickSearch && (
            <div className="w-full relative flex items-center bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-xl px-3 py-1.5 shadow-xs transition-all animate-in fade-in zoom-in-95 duration-200">
              <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mr-2 shrink-0 group-focus-within:text-blue-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search resources..."
                className="w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs sm:text-sm outline-none"
                autoFocus={false}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Storage Quota Left Badge */}
          <div 
            className="relative"
            onMouseEnter={() => setShowStorageTooltip(true)}
            onMouseLeave={() => setShowStorageTooltip(false)}
            onClick={() => onOpenUploadModal()}
          >
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition shadow-2xs ${
                isFull 
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400' 
                  : isNearLimit
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400'
                    : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
              title="Storage capacity (4 GB limit)"
            >
              {isFull ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              ) : (
                <HardDrive className={`w-3.5 h-3.5 shrink-0 ${isNearLimit ? 'text-amber-500' : 'text-blue-500'}`} />
              )}
              <div className="flex flex-col items-start leading-none">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold">
                    {storageUsage ? storageUsage.formattedRemaining : '4.00 GB'}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal hidden sm:inline">
                    left
                  </span>
                </div>
                {/* Visual mini bar */}
                <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isFull ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.max(4, usedPct)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Detailed Storage Hover Tooltip */}
            {showStorageTooltip && (
              <div className="absolute right-0 top-full mt-2 w-60 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                    Storage Quota
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    4.00 GB Max
                  </span>
                </div>

                <div className="py-2.5 space-y-1.5">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                    <span>Used Storage:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                      {storageUsage ? storageUsage.formattedUsed : '0 B'} ({usedPct}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                    <span>Available Left:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {storageUsage ? storageUsage.formattedRemaining : '4.00 GB'}
                    </span>
                  </div>
                  {storageUsage && storageUsage.fileCount > 0 && (
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400 text-[11px]">
                      <span>Uploaded Files:</span>
                      <span className="font-mono">{storageUsage.fileCount} items</span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFull ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.max(3, usedPct)}%` }}
                    />
                  </div>
                </div>

                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  Files uploaded to catalog count towards your 4 GB cloud limit.
                </p>
              </div>
            )}
          </div>

          {/* Upload Resource Button */}
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-xs transition text-xs sm:text-sm font-semibold cursor-pointer"
            title="Upload Files, Apps, EXEs, Media or Scripts"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Upload File</span>
          </button>

          {/* Personal Saved Vault */}
          <button
            onClick={onOpenMyVault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 shadow-2xs transition text-xs sm:text-sm font-semibold cursor-pointer relative"
            title="My Saved Vault"
          >
            <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline">Vault</span>
            {savedCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full bg-blue-600 text-white shadow-2xs">
                {savedCount}
              </span>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-blue-400 border border-zinc-200 dark:border-zinc-700 transition cursor-pointer shadow-2xs flex items-center justify-center"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-blue-400 animate-in spin-in-90 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600 hover:text-blue-600 animate-in spin-in-90 duration-200" />
            )}
          </button>

          {/* User Profile & Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900/60 transition cursor-pointer text-xs font-semibold"
              title="Lock / Log Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Lock Vault</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

