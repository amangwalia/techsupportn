import React from 'react';
import { 
  Search, 
  X, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CATEGORIES_CONFIG } from '../data/resources';

interface HeroSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategorySelect: (catId: string) => void;
  totalResults: number;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  totalResults
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  React.useEffect(() => {
    updateScrollButtons();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons, { passive: true });
      window.addEventListener('resize', updateScrollButtons);
      return () => {
        el.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleStepCategory = (direction: 'prev' | 'next') => {
    const currentIndex = CATEGORIES_CONFIG.findIndex(c => c.id === selectedCategory);
    if (currentIndex === -1) return;

    if (direction === 'prev') {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : CATEGORIES_CONFIG.length - 1;
      onCategorySelect(CATEGORIES_CONFIG[newIndex].id);
    } else {
      const newIndex = currentIndex < CATEGORIES_CONFIG.length - 1 ? currentIndex + 1 : 0;
      onCategorySelect(CATEGORIES_CONFIG[newIndex].id);
    }
  };

  return (
    <section className="relative pt-10 pb-8 border-b border-white/40 dark:border-white/10 bg-white/30 dark:bg-slate-950/30 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Headline - Liquid Glass Typography */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full liquid-glass-chip text-blue-600 dark:text-cyan-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Instant Liquid Cloud Repository</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Support Resources & Files
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Search Safe Exam Browser files, installation packages, automation scripts, and support tools.
          </p>
        </div>

        {/* Liquid Glass Search Capsule with Specular Gloss & Glow */}
        <div className="max-w-2xl mx-auto mb-7">
          <div className="relative flex items-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/80 dark:border-white/15 hover:border-blue-400/60 dark:hover:border-cyan-400/50 hover:shadow-[0_12px_40px_rgba(59,130,246,0.15)] focus-within:shadow-[0_12px_40px_rgba(59,130,246,0.22)] focus-within:border-blue-500 dark:focus-within:border-cyan-400 rounded-full px-6 py-4 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <Search className="w-5 h-5 text-blue-500 dark:text-cyan-400 mr-3.5 shrink-0" />
            <input
              id="main-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by file name, format (exe, video, seb), or tag..."
              className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm sm:text-base outline-none font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full transition cursor-pointer mr-2"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="shrink-0 flex items-center gap-1.5 pl-3.5 border-l border-slate-200 dark:border-white/15 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="font-bold text-blue-600 dark:text-cyan-400">{totalResults}</span>
              <span>files</span>
            </div>
          </div>
        </div>

        {/* Category Navigation with Liquid Glass Filter Chips */}
        <div className="relative max-w-4xl mx-auto px-1">
          <div className="flex items-center gap-2">
            {/* Left Scroll Arrow */}
            <button
              onClick={() => handleScroll('left')}
              onDoubleClick={() => handleStepCategory('prev')}
              className={`shrink-0 p-2 rounded-full border transition cursor-pointer flex items-center justify-center backdrop-blur-md ${
                canScrollLeft
                  ? 'liquid-glass-chip hover:bg-white/90 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-200'
                  : 'bg-transparent text-slate-300 dark:text-slate-700 border-transparent cursor-not-allowed opacity-30'
              }`}
              title="Scroll left"
              aria-label="Previous categories"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Category Chips Container */}
            <div
              ref={scrollContainerRef}
              className="flex-1 flex items-center gap-2.5 overflow-x-auto py-2 scrollbar-none scroll-smooth"
            >
              {CATEGORIES_CONFIG.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onCategorySelect(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border shrink-0 backdrop-blur-md ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-transparent shadow-[0_4px_16px_rgba(59,130,246,0.35)] scale-105'
                        : 'liquid-glass-chip hover:bg-white/90 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Arrow */}
            <button
              onClick={() => handleScroll('right')}
              onDoubleClick={() => handleStepCategory('next')}
              className={`shrink-0 p-2 rounded-full border transition cursor-pointer flex items-center justify-center backdrop-blur-md ${
                canScrollRight
                  ? 'liquid-glass-chip hover:bg-white/90 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-200'
                  : 'bg-transparent text-slate-300 dark:text-slate-700 border-transparent cursor-not-allowed opacity-30'
              }`}
              title="Scroll right"
              aria-label="Next categories"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

