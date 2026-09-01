import React, { useRef, useState, useEffect } from 'react';
import { 
  Flame, 
  Download, 
  Check, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { ResourceItem } from '../types';
import { triggerResourceDownload } from '../utils/downloader';

interface PopularSectionProps {
  popularItems: ResourceItem[];
}

export const PopularSection: React.FC<PopularSectionProps> = ({
  popularItems
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollState, { passive: true });
      window.addEventListener('resize', updateScrollState);
      return () => {
        el.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, [popularItems]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleDownload = async (item: ResourceItem) => {
    setDownloadingId(item.id);
    const ok = await triggerResourceDownload(item);
    setDownloadingId(null);
    if (ok) {
      setDownloadSuccessId(item.id);
      setTimeout(() => setDownloadSuccessId(null), 2000);
    }
  };

  return (
    <div className="space-y-3 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-400/30 backdrop-blur-xs">
            <Flame className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Suggested & Popular
          </h2>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleScroll('left')}
            className={`p-2 rounded-full transition cursor-pointer flex items-center justify-center ${
              canScrollLeft
                ? 'liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                : 'opacity-30 cursor-not-allowed text-slate-400'
            }`}
            title="Previous"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className={`p-2 rounded-full transition cursor-pointer flex items-center justify-center ${
              canScrollRight
                ? 'liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                : 'opacity-30 cursor-not-allowed text-slate-400'
            }`}
            title="Next"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 scrollbar-none scroll-smooth"
      >
        {popularItems.map((item) => {
          const isDownloading = downloadingId === item.id;
          const isDownloaded = downloadSuccessId === item.id;

          return (
            <div
              key={item.id}
              className="liquid-glass-card rounded-2xl p-4 flex flex-col justify-between shrink-0 w-[260px] sm:w-[280px] shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full liquid-glass-chip text-blue-600 dark:text-cyan-400 font-medium">
                    {item.format}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 liquid-glass-chip px-2 py-0.5 rounded-full">
                    {item.size}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                  {item.tagline || item.description}
                </p>
              </div>

              <button
                onClick={() => handleDownload(item)}
                disabled={isDownloading}
                className={`w-full py-2 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isDownloaded
                    ? 'bg-emerald-600 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]'
                    : 'liquid-glass-btn text-white shadow-xs'
                }`}
              >
                {isDownloaded ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Downloaded</span>
                  </>
                ) : isDownloading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

