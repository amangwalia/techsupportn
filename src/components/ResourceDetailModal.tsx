import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Check, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Bookmark, 
  BookmarkCheck, 
  Terminal, 
  FolderArchive, 
  FileCode2, 
  Code2, 
  FileText, 
  Info, 
  History, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { ResourceItem, ResourceFile } from '../types';
import { triggerResourceDownload, calculateSha256 } from '../utils/downloader';

interface ResourceDetailModalProps {
  item: ResourceItem | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (item: ResourceItem) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  item,
  onClose,
  isSaved,
  onToggleSave
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'install' | 'changelog' | 'verify'>('code');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Verification state
  const [testInput, setTestInput] = useState('');
  const [calculatedHash, setCalculatedHash] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'matched' | 'mismatch'>('idle');

  if (!item) return null;

  const handleDownload = async () => {
    setDownloading(true);
    const ok = await triggerResourceDownload(item);
    setDownloading(false);
    if (ok) {
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2200);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(item.sha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyCommand = () => {
    if (item.installCommand) {
      navigator.clipboard.writeText(item.installCommand);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    }
  };

  const handleTestVerify = async () => {
    if (!testInput) return;
    const computed = await calculateSha256(testInput);
    setCalculatedHash(computed);
    if (computed.toLowerCase() === item.sha256.toLowerCase()) {
      setVerifyStatus('matched');
    } else {
      setVerifyStatus('mismatch');
    }
  };

  // Determine current display file/content
  const isMultiFile = !!item.files && item.files.length > 0;
  const currentFile: ResourceFile | null = isMultiFile ? item.files![selectedFileIndex] : null;
  const currentContent = currentFile ? currentFile.content : item.rawContent || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div 
        className="liquid-glass rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/60 dark:border-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/50 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold liquid-glass-chip text-blue-600 dark:text-cyan-400">
                {item.format}
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-300 liquid-glass-chip px-2.5 py-0.5 rounded-full">
                {item.size}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 liquid-glass-chip px-2.5 py-0.5 rounded-full">
                v{item.version}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Updated {item.updatedDate}
              </span>
              <div className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 text-xs font-bold ml-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {item.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {item.tagline || item.description}
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => onToggleSave(item)}
              className={`p-2.5 rounded-2xl liquid-glass-chip transition cursor-pointer ${
                isSaved
                  ? 'bg-blue-500/20 text-blue-600 dark:text-cyan-400 border-blue-400/40'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              title={isSaved ? 'Remove from My Vault' : 'Save to My Vault'}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5 fill-blue-500/30 text-blue-600 dark:text-cyan-400" /> : <Bookmark className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1-Click Action & Meta Banner */}
        <div className="bg-white/30 dark:bg-slate-900/30 px-5 sm:px-6 py-3.5 border-b border-white/40 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`py-2.5 px-5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-md ${
                downloaded
                  ? 'bg-emerald-600 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]'
                  : 'liquid-glass-btn text-white'
              }`}
            >
              {downloaded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Downloaded Successfully!</span>
                </>
              ) : downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Building Archive...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>1-Click Download ({item.format})</span>
                </>
              )}
            </button>

            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3.5 rounded-full text-xs font-semibold liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
              >
                <span>GitHub Source</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}

            {item.officialDownloadUrl && (
              <a
                href={item.officialDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3.5 rounded-full text-xs font-semibold liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 text-blue-600 dark:text-cyan-400 flex items-center gap-1.5 transition"
              >
                <span>Official Release</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>OS:</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">{item.os.join(', ')}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>License:</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">{item.license}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 sm:px-6 border-b border-white/40 dark:border-white/10 bg-white/20 dark:bg-slate-950/40 text-xs sm:text-sm backdrop-blur-md">
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-4 font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'code'
                ? 'border-cyan-500 text-blue-600 dark:text-cyan-400 bg-white/40 dark:bg-slate-900/50'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Files & Code Preview</span>
          </button>

          {item.cheatSheetSections && (
            <button
              onClick={() => setActiveTab('code')}
              className={`py-3 px-4 font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'code'
                  ? 'border-cyan-500 text-blue-600 dark:text-cyan-400 bg-white/40 dark:bg-slate-900/50'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Cheat Sheet Reference</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('install')}
            className={`py-3 px-4 font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'install'
                ? 'border-cyan-500 text-blue-600 dark:text-cyan-400 bg-white/40 dark:bg-slate-900/50'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Installation & Usage</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`py-3 px-4 font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'verify'
                ? 'border-cyan-500 text-blue-600 dark:text-cyan-400 bg-white/40 dark:bg-slate-900/50'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>SHA-256 Integrity</span>
          </button>

          {item.changelog && item.changelog.length > 0 && (
            <button
              onClick={() => setActiveTab('changelog')}
              className={`py-3 px-4 font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'changelog'
                  ? 'border-cyan-500 text-blue-600 dark:text-cyan-400 bg-white/40 dark:bg-slate-900/50'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Changelog</span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[55vh] space-y-6">
          {/* TAB 1: CODE / FILES / CHEATSHEET */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              {/* If multi-file starter kit */}
              {isMultiFile && item.files && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-1 shrink-0 font-medium">
                    <FolderArchive className="w-3.5 h-3.5 text-blue-500" /> Project Files:
                  </span>
                  {item.files.map((file, idx) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFileIndex(idx)}
                      className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                        selectedFileIndex === idx
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800 font-bold'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <FileCode2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      <span>{file.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Code viewer box */}
              {currentContent ? (
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-md">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs">
                    <span className="font-mono text-zinc-300 font-medium">
                      {currentFile ? currentFile.path : item.fileName || 'source_code'}
                    </span>
                    <button
                      onClick={() => handleCopyCode(currentContent)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition text-xs cursor-pointer font-medium"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-blue-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Raw</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs sm:text-sm font-mono text-zinc-100 overflow-x-auto leading-relaxed max-h-[380px]">
                    <code>{currentContent}</code>
                  </pre>
                </div>
              ) : item.cheatSheetSections ? (
                /* Cheat sheet structured sections */
                <div className="space-y-6">
                  {item.cheatSheetSections.map((sec, i) => (
                    <div key={i} className="bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {sec.title}
                      </h4>
                      {sec.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{sec.description}</p>
                      )}
                      <div className="space-y-3">
                        {sec.items.map((entry, eIdx) => (
                          <div key={eIdx} className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5 shadow-2xs">
                            <div className="flex items-start justify-between gap-2">
                              <pre className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold overflow-x-auto">
                                <code>{entry.command}</code>
                              </pre>
                              <button
                                onClick={() => handleCopyCode(entry.command)}
                                className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer shrink-0"
                                title="Copy snippet"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">{entry.explanation}</p>
                            {entry.example && (
                              <div className="mt-2 p-2 bg-zinc-900 dark:bg-zinc-950 rounded border border-zinc-800 text-[11px] font-mono text-zinc-200">
                                <pre>{entry.example}</pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-zinc-400 dark:text-zinc-500 text-sm">
                  Click 1-Click Download or Official Release to obtain this package.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INSTALLATION & USAGE */}
          {activeTab === 'install' && (
            <div className="space-y-6">
              {item.installCommand && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Quick Terminal Command</h4>
                  <div className="p-3 bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between shadow-2xs">
                    <code className="text-xs sm:text-sm font-mono text-blue-400">
                      {item.installCommand}
                    </code>
                    <button
                      onClick={handleCopyCommand}
                      className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 transition cursor-pointer font-medium"
                    >
                      {copiedCmd ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {item.installGuide && item.installGuide.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Step-by-Step Instructions</h4>
                  <div className="bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2.5">
                    {item.installGuide.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                        <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed font-medium">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {item.alternatives && item.alternatives.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Popular Alternatives</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.alternatives.map((alt) => (
                      <span key={alt} className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SHA-256 VERIFICATION */}
          {activeTab === 'verify' && (
            <div className="space-y-6">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Official SHA-256 Integrity Checksum</span>
                  <button
                    onClick={handleCopyHash}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold transition cursor-pointer"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHash ? 'Hash Copied!' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-white dark:bg-zinc-900 rounded font-mono text-xs text-blue-700 dark:text-blue-400 font-bold break-all select-all border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                  {item.sha256}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Verify your downloaded file against this cryptographic checksum using <code className="text-zinc-800 dark:text-zinc-200 font-mono bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">sha256sum &lt;filename&gt;</code> on Linux/macOS or <code className="text-zinc-800 dark:text-zinc-200 font-mono bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">Get-FileHash &lt;filename&gt;</code> in PowerShell.
                </p>
              </div>

              {/* In-Browser Integrity Tester */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Live In-Browser Verifier</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Paste the text or content below to verify its cryptographic hash directly inside your browser:
                </p>
                <textarea
                  value={testInput}
                  onChange={(e) => {
                    setTestInput(e.target.value);
                    setVerifyStatus('idle');
                  }}
                  placeholder="Paste file content to test..."
                  rows={3}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleTestVerify}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    Compute & Compare Hash
                  </button>

                  {verifyStatus === 'matched' && (
                    <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>100% Cryptographic Match!</span>
                    </div>
                  )}

                  {verifyStatus === 'mismatch' && (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-bold">
                      <AlertCircle className="w-4 h-4" />
                      <span>Hash Mismatch!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHANGELOG */}
          {activeTab === 'changelog' && item.changelog && (
            <div className="space-y-4">
              {item.changelog.map((entry, idx) => (
                <div key={idx} className="bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Version {entry.version}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{entry.date}</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                    {entry.notes.map((note, nIdx) => (
                      <li key={nIdx}>{note}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
