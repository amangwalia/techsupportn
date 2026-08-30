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
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/70 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Tech Support Saved Vault</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{savedItems.length} resources saved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        {savedItems.length > 0 && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
            <button
              onClick={handleBatchDownloadAll}
              disabled={batchDownloading}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                batchSuccess
                  ? 'bg-blue-800 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
              }`}
            >
              {batchSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Stash Downloaded!</span>
                </>
              ) : batchDownloading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Zipping Stash...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Entire Stash (ZIP)</span>
                </>
              )}
            </button>

            <button
              onClick={onClearAll}
              className="p-2 rounded-lg bg-white dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-700 transition cursor-pointer shadow-2xs"
              title="Clear all saved"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* List of saved resources */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50/50 dark:bg-zinc-950/40">
          {savedItems.length === 0 ? (
            <div className="text-center py-16 space-y-3 text-zinc-400 dark:text-zinc-600">
              <Bookmark className="w-10 h-10 mx-auto opacity-30 text-zinc-400 dark:text-zinc-600" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Your stash is empty</p>
              <p className="text-xs max-w-xs mx-auto text-zinc-500 dark:text-zinc-400 font-medium">
                Click the bookmark icon on any resource to save it here for instant one-click batch download.
              </p>
            </div>
          ) : (
            savedItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/60 font-semibold">
                      {item.format} • {item.size}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      {item.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => triggerResourceDownload(item)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
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
