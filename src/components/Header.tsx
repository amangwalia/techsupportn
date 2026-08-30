import React, { useState, useRef, useEffect } from 'react';
import { 
  Search,
  X,
  Bookmark, 
  Sun, 
  Moon,
  Plus,
  LogOut,
  HardDrive,
  ShieldCheck,
  User as UserIcon,
  ChevronDown,
  Settings,
  Database,
  CheckCircle2,
  Menu
} from 'lucide-react';
import { TechSupportLogo } from './TechSupportLogo';
import { StorageUsageInfo, UserRole } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showQuickSearch: boolean;
  onOpenMyVault: () => void;
  onOpenUploadModal: () => void;
  onOpenAdminManagement?: () => void;
  savedCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser?: string;
  userRole?: UserRole;
  onLogout?: () => void;
  storageUsage?: StorageUsageInfo | null;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  showQuickSearch,
  onOpenMyVault,
  onOpenUploadModal,
  onOpenAdminManagement,
  savedCount,
  isDarkMode,
  onToggleDarkMode,
  currentUser = 'user',
  userRole = 'user',
  onLogout,
  storageUsage
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const usedPct = storageUsage ? storageUsage.usedPercentage : 0;
  const isNearLimit = usedPct >= 80;
  const isFull = usedPct >= 98;
  const isAdmin = userRole === 'admin';

  // Get user initial
  const userInitial = currentUser.charAt(0).toUpperCase() || 'U';

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#090d16]/80 backdrop-blur-2xl border-b border-slate-200/60 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <TechSupportLogo size="md" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-slate-100 font-sans">
                Tech<span className="text-blue-600 dark:text-cyan-400 font-bold">Support</span>
              </span>
              <span className="text-[10px] font-medium tracking-wide px-2.5 py-0.5 rounded-full liquid-glass-chip text-blue-700 dark:text-cyan-300 hidden sm:inline-block">
                Catalog & Vault
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Quick Search (Appears when main search is scrolled out) */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4 flex items-center justify-center">
          {showQuickSearch && (
            <div className="w-full relative flex items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 focus-within:border-blue-400/60 dark:focus-within:border-cyan-400/50 focus-within:bg-white/90 dark:focus-within:bg-slate-800/90 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.15)] rounded-full px-4 py-2 transition-all animate-in fade-in zoom-in-95 duration-150 shadow-inner">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search resources, apps, tools..."
                className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Clean Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Quick Upload Action for Admins */}
          {isAdmin && (
            <button
              onClick={onOpenUploadModal}
              className="liquid-glass-btn flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-white shadow-xs transition text-xs sm:text-sm font-semibold cursor-pointer"
              title="Upload new resource"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          )}

          {/* Quick Saved Vault Link */}
          <button
            onClick={onOpenMyVault}
            className="liquid-glass-chip hover:bg-white/90 dark:hover:bg-slate-800/80 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-200 transition text-xs sm:text-sm font-medium cursor-pointer"
            title="Open Saved Vault"
          >
            <Bookmark className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span className="hidden md:inline">Vault</span>
            {savedCount > 0 && (
              <span className="flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-600 dark:bg-cyan-500 text-white">
                {savedCount}
              </span>
            )}
          </button>

          {/* Theme Quick Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-full liquid-glass-chip hover:bg-white/90 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 transition cursor-pointer flex items-center justify-center"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* User Account & Actions Menu Toggle */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border transition cursor-pointer ${
                isMenuOpen
                  ? 'bg-blue-50/80 dark:bg-slate-800 border-blue-400/50 dark:border-cyan-400/40 shadow-xs'
                  : 'liquid-glass-chip hover:bg-white/90 dark:hover:bg-slate-800/80'
              }`}
              title="Account and navigation menu"
              aria-expanded={isMenuOpen}
            >
              {/* Avatar Bubble */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs ${
                isAdmin 
                  ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600' 
                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
              }`}>
                {userInitial}
              </div>

              {/* Username label & Role Dot */}
              <div className="hidden sm:flex items-center gap-1.5 text-left">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[90px] truncate">
                  {currentUser}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-indigo-500' : 'bg-cyan-500'}`} />
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            {/* Dropdown Menu Container */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-3xl bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                
                {/* Account Profile Card */}
                <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-md ${
                    isAdmin 
                      ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600' 
                      : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  }`}>
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {currentUser}
                      </p>
                      {isAdmin && (
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {isAdmin ? 'admin@techsupport.org' : 'user@techsupport.org'}
                    </p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isAdmin 
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-indigo-500' : 'bg-cyan-500'}`} />
                        {isAdmin ? 'Administrator' : 'Community Member'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Storage Info Widget in Menu */}
                <div className="mt-3 p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                      Vault Cloud Storage
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-cyan-400 font-mono">
                      {storageUsage ? storageUsage.formattedRemaining : '4.00 GB'} free
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700/60 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFull ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      }`}
                      style={{ width: `${Math.max(4, usedPct)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1.5">
                    {storageUsage ? storageUsage.formattedUsed : '0 B'} used of 4.00 GB quota
                  </p>
                </div>

                {/* Action Items List */}
                <div className="mt-3 space-y-1">
                  
                  {/* Saved Items */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenMyVault();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Bookmark className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      Saved Resources Vault
                    </span>
                    {savedCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 dark:bg-cyan-950 text-blue-700 dark:text-cyan-300">
                        {savedCount} items
                      </span>
                    )}
                  </button>

                  {/* Admin Settings (if admin) */}
                  {isAdmin && onOpenAdminManagement && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenAdminManagement();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <Settings className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                        Admin & Password Settings
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    </button>
                  )}

                  {/* Upload Resource (if admin) */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenUploadModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-emerald-500" />
                      Upload New File or Tool
                    </button>
                  )}

                  {/* Theme Switch */}
                  <button
                    onClick={onToggleDarkMode}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                      Appearance Theme
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {isDarkMode ? 'Dark' : 'Light'}
                    </span>
                  </button>
                </div>

                {/* Prominent Log Out Action */}
                {onLogout && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 text-xs font-semibold transition cursor-pointer shadow-xs"
                      title={`Log out from @${currentUser}`}
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Log Out ({currentUser})</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
