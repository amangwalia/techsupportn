import React from 'react';
import { 
  Search,
  X,
  Bookmark, 
  Sun, 
  Moon,
  Upload,
  Plus,
  LogOut,
  UserCheck
} from 'lucide-react';
import { TechSupportLogo } from './TechSupportLogo';

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
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-emerald-100 dark:border-zinc-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <TechSupportLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
                Tech <span className="text-emerald-500 dark:text-emerald-400">Support</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hidden sm:inline-block font-mono">
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
            <div className="w-full relative flex items-center bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl px-3 py-1.5 shadow-xs transition-all animate-in fade-in zoom-in-95 duration-200">
              <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mr-2 shrink-0 group-focus-within:text-emerald-500" />
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
          {/* Upload Resource Button */}
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-xs transition text-xs sm:text-sm font-semibold cursor-pointer"
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
            <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">Vault</span>
            {savedCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full bg-emerald-600 text-white shadow-2xs">
                {savedCount}
              </span>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-emerald-400 border border-zinc-200 dark:border-zinc-700 transition cursor-pointer shadow-2xs flex items-center justify-center"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-emerald-400 animate-in spin-in-90 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600 hover:text-emerald-600 animate-in spin-in-90 duration-200" />
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
