import React from 'react';
import { 
  Search, 
  X, 
  Sparkles, 
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
    <section className="relative overflow-hidden pt-10 pb-8 border-b border-blue-100 dark:border-zinc-800 bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-zinc-950 dark:via-zinc-900/90 dark:to-zinc-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Headline */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-400 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span>Tech Support Vault • SEB Files • BAT Scripts • Developer Tools • Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Technical Resource Downloads
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
            Curated Safe Exam Browser configurations, Windows automation scripts, CLI developer utilities, and technical documentation.
          </p>
        </div>

        {/* Big, Highly Visible Search Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative group">
            {/* Ambient Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-md opacity-25 dark:opacity-40 group-hover:opacity-50 transition duration-300 pointer-events-none" />
            
            {/* Input Container */}
            <div className="relative flex items-center bg-white dark:bg-zinc-900 border-2 border-blue-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500/70 rounded-2xl px-5 py-4 shadow-xl shadow-blue-500/10 dark:shadow-black/60 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all duration-200">
              <Search className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3.5 shrink-0 transition" />
              <input
                id="main-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search files by name, format, tag, or description..."
                className="w-full bg-transparent text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 text-base sm:text-lg font-medium outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer mr-2"
                  title="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <div className="shrink-0 flex items-center gap-1.5 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm sm:text-base">{totalResults}</span>
                <span className="font-medium">available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Navigation with Left & Right Toggle Controls */}
        <div className="relative max-w-4xl mx-auto px-1">
          <div className="flex items-center gap-2">
            {/* Left Scroll/Toggle Arrow Button */}
            <button
              onClick={() => handleScroll('left')}
              onDoubleClick={() => handleStepCategory('prev')}
              className={`shrink-0 p-2.5 rounded-xl border transition cursor-pointer shadow-2xs flex items-center justify-center ${
                canScrollLeft
                  ? 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-zinc-700'
                  : 'bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-300 dark:text-zinc-600 border-zinc-200/50 dark:border-zinc-800 cursor-not-allowed'
              }`}
              title="Scroll left"
              aria-label="Previous categories"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Category Pills Container */}
            <div
              ref={scrollContainerRef}
              className="flex-1 flex items-center gap-2 overflow-x-auto py-1 scrollbar-none scroll-smooth"
            >
              {CATEGORIES_CONFIG.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onCategorySelect(cat.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-2 border shrink-0 ${
                      isActive
                        ? 'bg-blue-600 dark:bg-blue-600 text-white border-blue-600 font-bold shadow-md shadow-blue-600/25'
                        : 'bg-white dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-750 hover:bg-blue-50/60 dark:hover:bg-zinc-800 hover:border-blue-200 dark:hover:border-blue-500/40 hover:text-blue-700 dark:hover:text-blue-400 shadow-2xs'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Scroll/Toggle Arrow Button */}
            <button
              onClick={() => handleScroll('right')}
              onDoubleClick={() => handleStepCategory('next')}
              className={`shrink-0 p-2.5 rounded-xl border transition cursor-pointer shadow-2xs flex items-center justify-center ${
                canScrollRight
                  ? 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-zinc-700'
                  : 'bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-300 dark:text-zinc-600 border-zinc-200/50 dark:border-zinc-800 cursor-not-allowed'
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
