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
  Film
} from 'lucide-react';
import { ResourceItem } from './types';
import { RESOURCES_DATA, CATEGORIES_CONFIG } from './data/resources';
import { Header } from './components/Header';
import { HeroSearch } from './components/HeroSearch';
import { PopularSection } from './components/PopularSection';
import { ResourceCard } from './components/ResourceCard';
import { MyVaultDrawer } from './components/MyVaultDrawer';
import { UploadResourceModal } from './components/UploadResourceModal';
import { LoginPage } from './components/LoginPage';
import { TechSupportLogo } from './components/TechSupportLogo';
import { getUserUploadedResources, deleteUserUploadedResource } from './utils/storage';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('level1_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [currentUsername, setCurrentUsername] = useState<string>(() => {
    try {
      return sessionStorage.getItem('level1_auth_current_user') || 'admin';
    } catch {
      return 'admin';
    }
  });

  const handleLoginSuccess = (user: string) => {
    setCurrentUsername(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('level1_authenticated');
      sessionStorage.removeItem('level1_auth_current_user');
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(false);
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
  }, []);

  // User-uploaded custom resources stored in Central Server Storage
  const [userResources, setUserResources] = useState<ResourceItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load community & user resources from central server storage on startup & interval
  useEffect(() => {
    let isMounted = true;

    const loadStoredResources = async (silent = false) => {
      if (!silent) setIsSyncing(true);
      try {
        const stored = await getUserUploadedResources();
        if (isMounted) {
          setUserResources(stored);
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
    setToastMessage(`"${newResource.title}" uploaded & added to catalog!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Delete a user-uploaded resource
  const handleDeleteResource = async (id: string) => {
    const success = await deleteUserUploadedResource(id);
    if (success) {
      setUserResources((prev) => prev.filter((item) => item.id !== id));
      setSavedIds((prev) => prev.filter((itemId) => itemId !== id));
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-emerald-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl shadow-xl border border-zinc-750 dark:border-zinc-300 text-xs sm:text-sm font-semibold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Application Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showQuickSearch={showQuickSearch}
        onOpenMyVault={() => setIsMyVaultOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        savedCount={savedIds.length}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        currentUser={currentUsername}
        onLogout={handleLogout}
      />

      {/* Main Hero & Search Engine */}
      <HeroSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        totalResults={filteredResources.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Direct Upload Quick Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-zinc-900 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Direct Upload Section
                </h3>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Shared Cloud
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Directly publish apps, .exe files, batch scripts, media, videos, images, or documents — automatically visible and downloadable to all users in real-time.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New File / App</span>
          </button>
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {selectedCategory === 'all' ? 'All Developer Resources' : CATEGORIES_CONFIG.find(c => c.id === selectedCategory)?.label || 'Resources'}
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                {filteredResources.length} items
              </span>
            </div>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Clear search query
              </button>
            )}
          </div>

          {filteredResources.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 space-y-4 shadow-2xs">
              <Search className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                  {searchQuery ? 'No resources matched your search' : 'No files in this category yet'}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                  {searchQuery 
                    ? 'Try searching for FixShutdown, Camera Fix, or FIX_REPOSITORY.'
                    : 'Click "Upload New File / App" to add files, apps, or media directly to this category.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload To This Category</span>
                </button>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer"
                >
                  Show All Resources
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredResources.map((item) => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  isSaved={savedIds.includes(item.id)}
                  onToggleSave={handleToggleSave}
                  onDelete={item.isUserUploaded ? handleDeleteResource : undefined}
                />
              ))}
            </div>
          )}
        </section>

        {/* Feature Highlights Banner */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-2xs">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Zero Bloat • 1-Click Downloads</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              Direct standalone file downloads with clean defaults. No accounts, ads, or paywalls.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Verified & Curated Scripts</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              Tested automation scripts and developer utilities built for fast troubleshooting and diagnostics.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-10 mt-16 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <TechSupportLogo size="sm" />
            <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Tech Support — Open Technical Resource & Tool Hub</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-600 dark:text-zinc-400 font-medium">
            <span>Free & Open Source</span>
            <span>•</span>
            <span>Zero Tracking</span>
          </div>
        </div>
      </footer>

      {/* Full-Page Drag & Drop Overlay */}
      {isGlobalDragging && (
        <div className="fixed inset-0 z-50 bg-emerald-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 pointer-events-none">
          <div className="w-24 h-24 rounded-3xl bg-emerald-500/20 border-2 border-dashed border-emerald-400 text-emerald-400 flex items-center justify-center mb-6 shadow-2xl animate-bounce">
            <Upload className="w-12 h-12" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Drop file anywhere to upload
          </h2>
          <p className="text-sm text-emerald-200/90 max-w-md">
            Automatically parses your executable, batch script, zip archive, or asset and prepares it for the catalog.
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
      />

      {/* Personal Saved Vault Drawer */}
      <MyVaultDrawer
        isOpen={isMyVaultOpen}
        onClose={() => setIsMyVaultOpen(false)}
        savedItems={savedItems}
        onRemoveItem={(id) => setSavedIds(savedIds.filter((i) => i !== id))}
        onClearAll={handleClearSaved}
      />
    </div>
  );
}

