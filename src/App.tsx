/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Sparkles,
  Upload,
  Plus,
  CheckCircle2,
  FolderPlus,
  Cpu,
  Film,
  ShieldCheck,
  Lock,
  HardDrive,
  Info
} from 'lucide-react';
import { ResourceItem, StorageUsageInfo, UserRole } from './types';
import { RESOURCES_DATA, CATEGORIES_CONFIG } from './data/resources';
import { Header } from './components/Header';
import { HeroSearch } from './components/HeroSearch';
import { PopularSection } from './components/PopularSection';
import { ResourceCard } from './components/ResourceCard';
import { MyVaultDrawer } from './components/MyVaultDrawer';
import { UploadResourceModal } from './components/UploadResourceModal';
import { AdminUserManagementModal } from './components/AdminUserManagementModal';
import { LoginPage } from './components/LoginPage';
import { TechSupportLogo } from './components/TechSupportLogo';
import { getUserUploadedResources, deleteUserUploadedResource, fetchStorageUsage } from './utils/storage';
import { getCurrentSession, logoutUser } from './utils/auth';

export default function App() {
  // Authentication & Role State
  const [session, setSession] = useState<{
    isAuthenticated: boolean;
    username: string;
    role: UserRole;
  }>(() => getCurrentSession());

  const isAuthenticated = session.isAuthenticated;
  const currentUsername = session.username;
  const userRole = session.role;
  const isAdmin = userRole === 'admin';

  const handleLoginSuccess = (user: string, role: UserRole) => {
    setSession({
      isAuthenticated: true,
      username: user,
      role
    });
  };

  const handleLogout = () => {
    logoutUser();
    setSession({
      isAuthenticated: false,
      username: 'user',
      role: 'user'
    });
  };

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('level1_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('level1_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('level1_theme', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  // Search & Category State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals & Drawers
  const [isMyVaultOpen, setIsMyVaultOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAdminManagementOpen, setIsAdminManagementOpen] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global Drag and Drop event listeners
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsGlobalDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter === 0) {
        setIsGlobalDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsGlobalDragging(false);
      dragCounter = 0;

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        if (!isAdmin) {
          setToastMessage('Uploads are restricted to Administrators. Log in as Admin to publish files.');
          setTimeout(() => setToastMessage(null), 3500);
          return;
        }
        const file = e.dataTransfer.files[0];
        setDroppedFile(file);
        setIsUploadModalOpen(true);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [isAdmin]);

  // User-uploaded custom resources stored in Central Server Storage
  const [userResources, setUserResources] = useState<ResourceItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [storageUsage, setStorageUsage] = useState<StorageUsageInfo | null>(null);

  const refreshStorage = async () => {
    try {
      const usage = await fetchStorageUsage();
      setStorageUsage(usage);
    } catch (e) {
      console.warn('Failed to refresh storage usage:', e);
    }
  };

  // Load community & user resources from central server storage on startup & interval
  useEffect(() => {
    let isMounted = true;

    const loadStoredResources = async (silent = false) => {
      if (!silent) setIsSyncing(true);
      try {
        const [stored, usage] = await Promise.all([
          getUserUploadedResources(),
          fetchStorageUsage()
        ]);
        if (isMounted) {
          setUserResources(stored);
          setStorageUsage(usage);
        }
      } catch (err) {
        console.error('Failed to load user resources:', err);
      } finally {
        if (isMounted && !silent) setIsSyncing(false);
      }
    };

    loadStoredResources();

    // Poll server every 5 seconds so uploads by other users appear automatically
    const intervalId = setInterval(() => {
      loadStoredResources(true);
    }, 5000);

    // Refresh when user returns to window tab
    const handleFocus = () => {
      loadStoredResources(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Saved resources (localStorage)
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('level1_saved');
      return stored ? JSON.parse(stored) : ['bat-fix-shutdown-windows'];
    } catch {
      return ['bat-fix-shutdown-windows'];
    }
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('level1_saved', JSON.stringify(savedIds));
    } catch (e) {
      console.error(e);
    }
  }, [savedIds]);

  // Track visibility of big search bar to show Quick Search in header
  const [showQuickSearch, setShowQuickSearch] = useState(false);

  useEffect(() => {
    const searchInput = document.getElementById('main-search-input');
    if (!searchInput) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When big search is NOT intersecting (scrolled out of view), show quick search
        setShowQuickSearch(!entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '-64px 0px 0px 0px' // accounts for sticky header height
      }
    );

    observer.observe(searchInput);
    return () => observer.disconnect();
  }, []);

  // Global keyboard shortcut for Search (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('main-search-input');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleSave = (item: ResourceItem) => {
    if (savedIds.includes(item.id)) {
      setSavedIds(savedIds.filter((id) => id !== item.id));
    } else {
      setSavedIds([...savedIds, item.id]);
    }
  };

  const handleClearSaved = () => {
    setSavedIds([]);
  };

  // When a new resource is published
  const handleResourcePublished = (newResource: ResourceItem) => {
    setUserResources((prev) => [newResource, ...prev]);
    setSelectedCategory('all');
    refreshStorage();
    setToastMessage(`"${newResource.title}" uploaded & added to catalog!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Delete a user-uploaded resource
  const handleDeleteResource = async (id: string) => {
    const success = await deleteUserUploadedResource(id);
    if (success) {
      setUserResources((prev) => prev.filter((item) => item.id !== id));
      setSavedIds((prev) => prev.filter((itemId) => itemId !== id));
      refreshStorage();
      setToastMessage('Resource removed from catalog.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Combined resources: user uploads at the top, then defaults
  const allResources = useMemo(() => {
    return [...userResources, ...RESOURCES_DATA];
  }, [userResources]);

  // Filtered Resources
  const filteredResources = useMemo(() => {
    return allResources.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inDesc = (item.description || '').toLowerCase().includes(q);
        const inTagline = (item.tagline || '').toLowerCase().includes(q);
        const inTags = item.tags.some((t) => t.toLowerCase().includes(q));
        const inFormat = item.format.toLowerCase().includes(q);
        return inTitle || inDesc || inTagline || inTags || inFormat;
      }

      return true;
    });
  }, [allResources, searchQuery, selectedCategory]);

  // Featured list
  const popularResources = useMemo(() => allResources.filter((r) => r.popular), [allResources]);
  const savedItems = useMemo(() => allResources.filter((r) => savedIds.includes(r.id)), [allResources, savedIds]);

  // Privacy Authentication Gate
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50/90 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500/25 selection:text-blue-900 dark:selection:text-blue-200 overflow-x-hidden transition-colors duration-300">
      
      {/* Background Liquid Caustics & Floating Glass Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Luminous Azure Orb */}
        <div className="absolute -top-24 -left-20 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-blue-400/25 via-cyan-400/20 to-indigo-500/15 dark:from-blue-600/20 dark:via-cyan-500/15 dark:to-indigo-600/15 blur-[110px] animate-liquid-1" />
        
        {/* Iridescent Violet-Indigo Orb */}
        <div className="absolute top-1/3 -right-28 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-400/20 via-purple-400/20 to-blue-500/15 dark:from-indigo-600/20 dark:via-purple-700/15 dark:to-cyan-500/10 blur-[130px] animate-liquid-2" />
        
        {/* Soft Aquatic Cyan Orb at bottom */}
        <div className="absolute -bottom-32 left-1/4 w-[650px] h-[650px] rounded-full bg-gradient-to-t from-cyan-400/20 via-teal-300/15 to-blue-400/10 dark:from-cyan-700/15 dark:via-teal-800/10 dark:to-blue-600/10 blur-[120px] animate-liquid-3" />
        
        {/* Ambient Subtle Grid Shimmer */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.4)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2.5 px-5 py-3.5 bg-slate-900/85 dark:bg-slate-900/90 text-white rounded-full shadow-2xl backdrop-blur-xl border border-white/20 text-xs sm:text-sm font-medium animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Application Header */}
      <div className="relative z-40">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showQuickSearch={showQuickSearch}
          onOpenMyVault={() => setIsMyVaultOpen(true)}
          onOpenUploadModal={() => {
            if (isAdmin) {
              setIsUploadModalOpen(true);
            } else {
              setToastMessage('Uploads are reserved for Administrators. Switch to Admin account to upload.');
              setTimeout(() => setToastMessage(null), 3500);
            }
          }}
          onOpenAdminManagement={() => setIsAdminManagementOpen(true)}
          savedCount={savedIds.length}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          currentUser={currentUsername}
          userRole={userRole}
          onLogout={handleLogout}
          storageUsage={storageUsage}
        />
      </div>

      {/* Main Hero & Search Engine */}
      <div className="relative z-10">
        <HeroSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          totalResults={filteredResources.length}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Direct Upload / Storage Action Banner - Liquid Glass Surface */}
        <div className="liquid-glass rounded-3xl p-6 sm:p-7 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all duration-300">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/25 to-cyan-500/20 text-blue-600 dark:text-cyan-300 border border-white/60 dark:border-white/15 flex items-center justify-center shrink-0 shadow-inner mt-1 sm:mt-0 backdrop-blur-md">
              {isAdmin ? <Upload className="w-5 h-5" /> : <Download className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
                  {isAdmin ? 'Administrator Central Hub' : 'Resource Catalog & Download Center'}
                </h3>
                <span className="text-[11px] font-medium px-3 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-400/15 text-blue-700 dark:text-cyan-300 border border-blue-300/40 dark:border-blue-400/20 flex items-center gap-1.5 backdrop-blur-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                  {isAdmin ? 'Admin Console' : 'Member Access'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {isAdmin
                  ? 'Upload and publish standalone apps, .exe files, batch scripts, media, or archives into your 4 GB cloud repository with instant verification.'
                  : 'Fast, secure downloads for technical support tools, batch automation scripts, executables, and media files.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            {/* Storage capacity info glass card */}
            <div className="px-4 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-white/70 dark:border-white/10 shadow-xs flex flex-col justify-center min-w-[180px] backdrop-blur-md">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
                <span>Cloud Storage:</span>
                <span className="font-semibold text-blue-600 dark:text-cyan-400 font-mono">
                  {storageUsage ? storageUsage.formattedRemaining : '4.00 GB'} left
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200/70 dark:bg-slate-700/60 rounded-full mt-2 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, storageUsage ? storageUsage.usedPercentage : 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono">
                <span>Used: {storageUsage ? storageUsage.formattedUsed : '0 B'}</span>
                <span>Max: 4.00 GB</span>
              </div>
            </div>

            {isAdmin ? (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="liquid-glass-btn px-6 py-2.5 rounded-full text-white text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Resource</span>
              </button>
            ) : (
              <button
                onClick={() => setIsMyVaultOpen(true)}
                className="liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 px-5 py-2.5 rounded-full text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-blue-500 dark:text-cyan-400" />
                <span>Saved List ({savedIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* If no search query and on 'all' tab, show Popular Downloads */}
        {!searchQuery && selectedCategory === 'all' && (
          <PopularSection
            popularItems={popularResources}
          />
        )}

        {/* Resource Catalog Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                {selectedCategory === 'all' ? 'All Resources' : CATEGORIES_CONFIG.find(c => c.id === selectedCategory)?.label || 'Resources'}
              </h2>
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full liquid-glass-chip text-slate-600 dark:text-slate-300">
                {filteredResources.length}
              </span>
            </div>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-blue-600 dark:text-cyan-400 hover:underline font-medium cursor-pointer"
              >
                Clear search
              </button>
            )}
          </div>

          {filteredResources.length === 0 ? (
            <div className="text-center py-20 liquid-glass rounded-3xl p-8 space-y-4">
              <Search className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto opacity-70" />
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  {searchQuery ? 'No resources matched your search' : 'No files in this category yet'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {searchQuery 
                    ? 'Try searching by file name, format (exe, video, seb), or tags.'
                    : isAdmin 
                      ? 'Click "Upload Resource" above to add files to this category.'
                      : 'No items currently in this category.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                {isAdmin && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="liquid-glass-btn px-5 py-2 rounded-full text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload To This Category</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 px-5 py-2 rounded-full text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
                >
                  Show All Resources
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((item) => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  isSaved={savedIds.includes(item.id)}
                  onToggleSave={handleToggleSave}
                  onDelete={isAdmin && item.isUserUploaded ? handleDeleteResource : undefined}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer - Frosted Glass */}
      <footer className="relative z-10 border-t border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl py-8 mt-16 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <TechSupportLogo size="sm" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Tech Support Vault</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <span>Fast & Secure</span>
            <span>•</span>
            <span>Direct Downloads</span>
          </div>
        </div>
      </footer>

      {/* Full-Page Drag & Drop Overlay - Liquid Ripple Glass */}
      {isGlobalDragging && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 pointer-events-none">
          <div className="w-24 h-24 rounded-3xl bg-blue-500/20 border-2 border-dashed border-cyan-400 text-cyan-300 flex items-center justify-center mb-5 animate-pulse shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            <Upload className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
            Drop file to upload
          </h2>
          <p className="text-xs text-cyan-200/80 max-w-sm">
            Executables, videos, batch scripts, SEB files, or archives automatically stored to your vault.
          </p>
        </div>
      )}

      {/* Upload Resource Modal */}
      <UploadResourceModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setDroppedFile(null);
        }}
        onResourcePublished={handleResourcePublished}
        initialFile={droppedFile}
        storageUsage={storageUsage}
        onRefreshStorage={refreshStorage}
      />

      {/* Personal Saved Vault Drawer */}
      <MyVaultDrawer
        isOpen={isMyVaultOpen}
        onClose={() => setIsMyVaultOpen(false)}
        savedItems={savedItems}
        onRemoveItem={(id) => setSavedIds(savedIds.filter((i) => i !== id))}
        onClearAll={handleClearSaved}
      />

      {/* Admin User & Password Management Control Center (Admin Only) */}
      {isAdmin && (
        <AdminUserManagementModal
          isOpen={isAdminManagementOpen}
          onClose={() => setIsAdminManagementOpen(false)}
          currentAdminUsername={currentUsername}
          onAdminProfileUpdated={(newUsername) => {
            setSession((prev) => ({
              ...prev,
              username: newUsername
            }));
            setToastMessage(`Admin ID updated to "${newUsername}".`);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}
    </div>
  );
}

