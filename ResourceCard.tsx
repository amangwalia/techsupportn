import React, { useState } from 'react';
import { 
  Download, 
  Check, 
  Bookmark, 
  BookmarkCheck,
  Trash2,
  FileText,
  Video,
  FileCode,
  FileArchive,
  Image as ImageIcon
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

  // Helper for format icon and badge
  const getFormatDetails = (format: string) => {
    const fmt = format.toUpperCase();
    if (['MP4', 'WEBM', 'VIDEO', 'MOV', 'MKV'].includes(fmt)) {
      return {
        badge: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
        icon: <Video className="w-3.5 h-3.5" />
      };
    }
    if (['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'IMG'].includes(fmt)) {
      return {
        badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        icon: <ImageIcon className="w-3.5 h-3.5" />
      };
    }
    if (['EXE', 'MSI', 'APK', 'APP', 'DMG'].includes(fmt)) {
      return {
        badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        icon: <FileCode className="w-3.5 h-3.5" />
      };
    }
    if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ', 'ISO'].includes(fmt)) {
      return {
        badge: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        icon: <FileArchive className="w-3.5 h-3.5" />
      };
    }
    return {
      badge: 'liquid-glass-chip text-slate-700 dark:text-slate-200',
      icon: <FileText className="w-3.5 h-3.5" />
    };
  };

  const fmtDetails = getFormatDetails(item.format);

  return (
    <div
      className="liquid-glass-card rounded-3xl p-5 flex flex-col justify-between group"
    >
      <div>
        {/* Media Preview (if user uploaded an image or video) */}
        {item.mediaUrl && item.mediaType === 'image' && (
          <div className="mb-3.5 rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 bg-slate-100/50 dark:bg-slate-800/50 max-h-40 flex items-center justify-center backdrop-blur-md">
            <img 
              src={item.mediaUrl} 
              alt={item.title} 
              className="w-full h-36 object-cover group-hover:scale-102 transition-transform duration-300"
            />
          </div>
        )}

        {item.mediaUrl && item.mediaType === 'video' && (
          <div className="mb-3.5 rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 bg-black/70 max-h-44 backdrop-blur-md">
            <video 
              src={item.mediaUrl} 
              controls 
              className="w-full h-36 object-contain"
            />
          </div>
        )}

        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full border backdrop-blur-xs ${fmtDetails.badge}`}>
              {fmtDetails.icon}
              <span>{item.format}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 liquid-glass-chip px-2 py-0.5 rounded-full">
              {item.size}
            </span>
            {item.isUserUploaded && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-400/15 text-blue-700 dark:text-cyan-300 border border-blue-300/40 dark:border-blue-400/20 backdrop-blur-xs">
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
                className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                title="Delete uploaded resource"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onToggleSave && (
              <button
                onClick={() => onToggleSave(item)}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  isSaved
                    ? 'text-blue-600 dark:text-cyan-400 bg-blue-500/15 dark:bg-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
                title={isSaved ? 'Saved in vault' : 'Save to vault'}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Title and Overview */}
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1 line-clamp-1 tracking-tight">
            {item.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
            {item.tagline || item.description}
          </p>
        </div>
      </div>

      {/* Direct Download Button - Liquid Glass Button */}
      <div className="pt-3 border-t border-white/50 dark:border-white/10">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
            downloaded
              ? 'bg-emerald-600 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]'
              : 'liquid-glass-btn text-white'
          }`}
        >
          {downloaded ? (
            <>
              <Check className="w-4 h-4" />
              <span>Downloaded</span>
            </>
          ) : downloading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

