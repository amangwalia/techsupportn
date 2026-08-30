import React, { useState } from 'react';
import { 
  Search,
  X,
  Bookmark, 
  Sun, 
  Moon,
  Plus,
  LogOut,
  HardDrive,
  AlertTriangle,
  ShieldCheck,
  User as UserIcon,
  HelpCircle
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
  const [showStorageTooltip, setShowStorageTooltip] = useState(false);

  const usedPct = storageUsage ? storageUsage.usedPercentage : 0;
  const isNearLimit = usedPct >= 80;
  const isFull = usedPct >= 98;
  const isAdmin = userRole === 'admin';

  // Get user initial for Google-style avatar
  const userInitial = currentUser.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl border-b border-white/50 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Brand Logo - Liquid Glass Refraction */}
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

        {/* Dynamic Quick Search - Liquid Glass Capsule */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4 flex items-center justify-center">
          {showQuickSearch && (
            <div className="w-full relative flex items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/70 dark:border-white/10 focus-within:border-blue-400/60 dark:focus-within:border-cyan-400/50 focus-within:bg-white/80 dark:focus-within:bg-slate-800/80 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.15)] rounded-full px-4 py-2 transition-all animate-in fade-in zoom-in-95 duration-150 shadow-inner">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search resources, apps, tools..."
                className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm outline-none"
                autoFocus={false}
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

        {/* Global Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Storage Quota Left Badge (Clickable for Admin) */}
          <div 
            className="relative"
            onMouseEnter={() => setShowStorageTooltip(true)}
            onMouseLeave={() => setShowStorageTooltip(false)}
            onClick={() => {
              if (isAdmin) onOpenUploadModal();
            }}
          >
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-medium cursor-pointer transition backdrop-blur-md ${
                isFull 
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400' 
                  : isNearLimit
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                    : 'liquid-glass-chip text-slate-700 dark:text-slate-200 hover:border-blue-400/60 dark:hover:border-cyan-400/50'
              }`}
              title="Storage capacity (4 GB max)"
            >
              {isFull ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              ) : (
                <HardDrive className={`w-3.5 h-3.5 shrink-0 ${isNearLimit ? 'text-amber-500' : 'text-blue-600 dark:text-cyan-400'}`} />
              )}
              <div className="flex flex-col items-start leading-none">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold">
                    {storageUsage ? storageUsage.formattedRemaining : '4.00 GB'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                    free
                  </span>
                </div>
                {/* Mini liquid progress indicator */}
                <div className="w-10 h-1 bg-slate-200/80 dark:bg-slate-700/60 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isFull ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                    }`}
                    style={{ width: `${Math.max(4, usedPct)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Storage Hover Tooltip - Liquid Glass Box */}
            {showStorageTooltip && (
              <div className="absolute right-0 top-full mt-2 w-64 p-4 liquid-glass rounded-2xl shadow-2xl z-50 animate-in fade-in duration-150 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/40 dark:border-white/10">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    Vault Storage Quota
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    4.00 GB Total
                  </span>
                </div>

                <div className="py-2.5 space-y-1.5">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Used Storage:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {storageUsage ? storageUsage.formattedUsed : '0 B'} ({usedPct}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Available:</span>
                    <span className="font-semibold text-blue-600 dark:text-cyan-400">
                      {storageUsage ? storageUsage.formattedRemaining : '4.00 GB'}
                    </span>
                  </div>
                  {storageUsage && storageUsage.fileCount > 0 && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span>Uploaded Files:</span>
                      <span>{storageUsage.fileCount} items</span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200/70 dark:bg-slate-700/60 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFull ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      }`}
                      style={{ width: `${Math.max(3, usedPct)}%` }}
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-white/40 dark:border-white/10">
                  {isAdmin 
                    ? 'Admins have permission to upload files up to 4 GB.' 
                    : 'Download any resource or request admin upload.'}
                </p>
              </div>
            )}
          </div>

          {/* Upload Resource Button (Only for Admins) - Liquid Glass Action */}
          {isAdmin && (
            <button
              onClick={onOpenUploadModal}
              className="liquid-glass-btn flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white shadow-xs transition text-xs sm:text-sm font-semibold cursor-pointer"
              title="Upload files, apps, or scripts"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          )}

          {/* Admin User & Password Management Button (Only for Admins) */}
          {isAdmin && onOpenAdminManagement && (
            <button
              onClick={onOpenAdminManagement}
              className="liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-indigo-600 dark:text-cyan-400 border border-indigo-400/30 dark:border-cyan-400/30 transition text-xs sm:text-sm font-semibold cursor-pointer"
              title="Manage users, reset passwords, and admin credentials"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span className="hidden md:inline">Admin Settings</span>
            </button>
          )}

          {/* Personal Saved Vault */}
          <button
            onClick={onOpenMyVault}
            className="liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-slate-700 dark:text-slate-200 transition text-xs sm:text-sm font-medium cursor-pointer relative"
            title="Saved Vault"
          >
            <Bookmark className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <span className="hidden md:inline">Vault</span>
            {savedCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-blue-600 dark:bg-cyan-500 text-white">
                {savedCount}
              </span>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-full liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 transition cursor-pointer flex items-center justify-center"
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Liquid Glass User Avatar & Role Badge */}
          <div className="flex items-center gap-2 pl-1 border-l border-white/50 dark:border-white/10">
            <div 
              onClick={() => {
                if (isAdmin && onOpenAdminManagement) {
                  onOpenAdminManagement();
                }
              }}
              className={`flex items-center gap-2 cursor-pointer select-none rounded-2xl p-1 transition ${
                isAdmin ? 'hover:bg-white/40 dark:hover:bg-slate-800/40' : ''
              }`}
              title={isAdmin ? `Admin: ${currentUser} (Click to manage credentials & users)` : `Logged in as Member: ${currentUser}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md border border-white/40 ${
                isAdmin 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-indigo-400/40' 
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600'
              }`}>
                {userInitial}
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[100px]">
                  {currentUser}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  {isAdmin ? (
                    <>
                      <span className="text-indigo-600 dark:text-cyan-400 font-bold">Admin</span>
                      <ShieldCheck className="w-2.5 h-2.5 text-cyan-400" />
                    </>
                  ) : (
                    'Member'
                  )}
                </span>
              </div>
            </div>

            {/* Logout / Switch Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-white/60 dark:hover:bg-slate-800/60 transition cursor-pointer"
                title={`Sign out (${currentUser})`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


