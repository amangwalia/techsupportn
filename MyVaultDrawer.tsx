import React, { useState } from 'react';
import { 
  X, 
  Bookmark, 
  Trash2, 
  Download, 
  Check
} from 'lucide-react';
import { ResourceItem } from '../types';
import { triggerResourceDownload, downloadZipArchive } from '../utils/downloader';

interface MyVaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedItems: ResourceItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

export const MyVaultDrawer: React.FC<MyVaultDrawerProps> = ({
  isOpen,
  onClose,
  savedItems,
  onRemoveItem,
  onClearAll
}) => {
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [batchSuccess, setBatchSuccess] = useState(false);

  const handleBatchDownloadAll = async () => {
    if (savedItems.length === 0) return;
    setBatchDownloading(true);

    try {
      const filesToBundle: { path: string; content: string }[] = [];

      for (const item of savedItems) {
        if (item.files && item.files.length > 0) {
          item.files.forEach((f) => {
            filesToBundle.push({
              path: `${item.id}/${f.path}`,
              content: f.content
            });
          });
        } else if (item.rawContent) {
          filesToBundle.push({
            path: `${item.fileName || `${item.id}.txt`}`,
            content: item.rawContent
          });
        } else if (item.cheatSheetSections) {
          filesToBundle.push({
            path: `${item.id}-cheatsheet.md`,
            content: `# ${item.title}\n\n${item.description}\n`
          });
        }
      }

      await downloadZipArchive('techsupport-saved-vault.zip', filesToBundle);
      setBatchSuccess(true);
      setTimeout(() => setBatchSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setBatchDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-md">
      <div 
        className="liquid-glass border-l border-white/50 dark:border-white/10 w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/50 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Saved Resources</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{savedItems.length} items in your list</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        {savedItems.length > 0 && (
          <div className="p-4 bg-white/30 dark:bg-slate-900/30 border-b border-white/40 dark:border-white/10 flex items-center justify-between gap-2 backdrop-blur-md">
            <button
              onClick={handleBatchDownloadAll}
              disabled={batchDownloading}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                batchSuccess
                  ? 'bg-emerald-600 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]'
                  : 'liquid-glass-btn text-white shadow-sm'
              }`}
            >
              {batchSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Downloaded ZIP</span>
                </>
              ) : batchDownloading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparing ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download All as ZIP</span>
                </>
              )}
            </button>

            <button
              onClick={onClearAll}
              className="p-2.5 rounded-full liquid-glass-chip hover:bg-rose-500/15 text-slate-500 hover:text-rose-500 transition cursor-pointer"
              title="Clear all saved"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* List of saved resources */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {savedItems.length === 0 ? (
            <div className="text-center py-16 space-y-2 text-slate-500 dark:text-slate-400">
              <Bookmark className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Your list is empty</p>
              <p className="text-xs max-w-xs mx-auto">
                Click the bookmark icon on any resource card to save it for quick batch download.
              </p>
            </div>
          ) : (
            savedItems.map((item) => (
              <div
                key={item.id}
                className="p-4 liquid-glass-card rounded-2xl space-y-2.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full liquid-glass-chip text-blue-600 dark:text-cyan-400">
                      {item.format} • {item.size}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1.5">
                      {item.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer rounded-full hover:bg-rose-500/10"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-white/40 dark:border-white/10">
                  <button
                    onClick={() => triggerResourceDownload(item)}
                    className="px-3.5 py-1.5 rounded-full liquid-glass-btn text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

