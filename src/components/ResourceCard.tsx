import React, { useState } from 'react';
import { 
  Download, 
  Check, 
  Bookmark, 
  BookmarkCheck,
  Trash2,
  Play,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { ResourceItem } from '../types';
import { triggerResourceDownload } from '../utils/downloader';

interface ResourceCardProps {
  item: ResourceItem;
  isSaved?: boolean;
  onToggleSave?: (item: ResourceItem) => void;
  onDelete?: (id: string) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  item,
  isSaved,
  onToggleSave,
  onDelete
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    const ok = await triggerResourceDownload(item);
    setDownloading(false);
    if (ok) {
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2200);
    }
  };

  // Helper for format styling
  const getFormatBadge = (format: string) => {
    switch (format.toUpperCase()) {
      case 'SEB':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60 font-bold';
      case 'BAT':
      case 'CMD':
      case 'PS1':
      case 'SH':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60 font-bold';
      case 'EXE':
      case 'MSI':
      case 'APK':
      case 'APP':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60 font-bold';
      case 'MP4':
      case 'WEBM':
      case 'VIDEO':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 font-bold';
      case 'PNG':
      case 'JPG':
      case 'WEBP':
      case 'GIF':
      case 'IMG':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60 font-bold';
      case 'ZIP':
      case 'ISO':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/60 font-bold';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 font-semibold';
    }
  };

  return (
    <div
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-500/50 transition-all duration-200 group"
    >
      <div>
        {/* Media Preview (if user uploaded an image or video) */}
        {item.mediaUrl && item.mediaType === 'image' && (
          <div className="mb-3 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 max-h-40 flex items-center justify-center">
            <img 
              src={item.mediaUrl} 
              alt={item.title} 
              className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {item.mediaUrl && item.mediaType === 'video' && (
          <div className="mb-3 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black max-h-44">
            <video 
              src={item.mediaUrl} 
              controls 
              className="w-full h-36 object-contain"
            />
          </div>
        )}

        {/* Top Meta Bar: Format and Size */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-md border ${getFormatBadge(item.format)}`}>
              {item.format}
            </span>
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 font-medium">
              {item.size}
            </span>
            {item.isUserUploaded && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100/70 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                Uploaded
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {item.isUserUploaded && onDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${item.title}" from your catalog?`)) {
                    onDelete(item.id);
                  }
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                title="Delete uploaded resource"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onToggleSave && (
              <button
                onClick={() => onToggleSave(item)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isSaved
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
                title={isSaved ? 'Saved' : 'Save to Vault'}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-950" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Title and Overview */}
        <div className="mb-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5 line-clamp-1">
            {item.title}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3">
            {item.tagline || item.description}
          </p>
        </div>
      </div>

      {/* Direct Download Button */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
            downloaded
              ? 'bg-blue-800 text-white shadow-blue-800/20'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-blue-600/25'
          }`}
        >
          {downloaded ? (
            <>
              <Check className="w-4 h-4" />
              <span>Downloaded</span>
            </>
          ) : downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
