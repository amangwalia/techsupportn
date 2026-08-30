import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Terminal, 
  Cpu, 
  Film, 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  Plus, 
  Sparkles,
  Layers,
  FolderArchive,
  Code,
  Copy,
  CheckCircle2,
  Share2,
  Cloud,
  Link as LinkIcon,
  HardDrive,
  AlertTriangle
} from 'lucide-react';
import { ResourceItem, ResourceCategory, OperatingSystem, FileFormat, StorageUsageInfo } from '../types';
import { saveUserUploadedResource, fetchStorageUsage, MAX_STORAGE_BYTES, formatByteSize } from '../utils/storage';
import { parseGoogleDriveUrl } from '../utils/downloader';

interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResourcePublished: (newResource: ResourceItem) => void;
  initialFile?: File | null;
  storageUsage?: StorageUsageInfo | null;
  onRefreshStorage?: () => void;
}

export const UploadResourceModal: React.FC<UploadResourceModalProps> = ({
  isOpen,
  onClose,
  onResourcePublished,
  initialFile,
  storageUsage: initialStorageUsage,
  onRefreshStorage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'gdrive'>('file');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileTextContent, setFileTextContent] = useState<string>('');

  // Storage Quota State
  const [storageUsage, setStorageUsage] = useState<StorageUsageInfo | null>(initialStorageUsage || null);
  const [storageLoading, setStorageLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('apps');
  const [selectedOs, setSelectedOs] = useState<OperatingSystem[]>(['Windows']);
  const [format, setFormat] = useState<FileFormat>('EXE');
  const [version, setVersion] = useState('1.0.0');
  const [author, setAuthor] = useState('My Upload');
  const [tagsInput, setTagsInput] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [installCommand, setInstallCommand] = useState('');
  const [externalDownloadUrl, setExternalDownloadUrl] = useState('');
  const [approxSize, setApproxSize] = useState('15 MB');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);

  // Fetch updated storage usage on modal mount
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const loadUsage = async () => {
      setStorageLoading(true);
      try {
        const usage = await fetchStorageUsage();
        if (mounted) {
          setStorageUsage(usage);
        }
      } catch (err) {
        console.warn('Failed to fetch storage usage:', err);
      } finally {
        if (mounted) setStorageLoading(false);
      }
    };
    loadUsage();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Format file size nicely
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Compute storage impact of selected file
  const currentUsed = storageUsage ? storageUsage.usedBytes : 0;
  const currentRemaining = Math.max(0, MAX_STORAGE_BYTES - currentUsed);
  const selectedFileSize = uploadMode === 'file' && selectedFile ? selectedFile.size : 0;
  const isOverQuota = uploadMode === 'file' && (currentUsed + selectedFileSize > MAX_STORAGE_BYTES);
  const remainingAfterUpload = Math.max(0, currentRemaining - selectedFileSize);

  // Generate clean TypeScript ResourceItem code representation
  const generateCodeSnippet = (): string => {
    const fileName = selectedFile?.name || `${title.toLowerCase().replace(/\s+/g, '_')}.${format.toLowerCase()}`;
    const id = `resource-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const isImg = selectedFile?.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(format.toLowerCase());
    const isVid = selectedFile?.type.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(format.toLowerCase());

    const itemObj: Record<string, any> = {
      id,
      title: title || 'Resource Title',
      tagline: tagline || `Download ${fileName}`,
      description: description || `Tool and utility for ${title}`,
      category,
      os: selectedOs,
      format,
      size: uploadMode === 'gdrive' ? approxSize : selectedFile ? formatFileSize(selectedFile.size) : '1.0 MB',
      version: version || '1.0.0',
      updatedDate: 'Aug 2026',
      popular: isPopular,
      recentlyAdded: true,
      downloadCount: 1,
      license: 'MIT',
      author: author || 'Level 1',
      tags: tags.length > 0 ? tags : [format, category],
      fileName,
      installCommand: installCommand || fileName,
      installGuide: [
        `Download ${fileName}.`,
        category === 'bat-files' 
          ? 'Right-click the file and select "Run as administrator".' 
          : 'Open or execute the downloaded application.'
      ]
    };

    if (uploadMode === 'gdrive' && externalDownloadUrl) {
      const parsed = parseGoogleDriveUrl(externalDownloadUrl);
      itemObj.officialDownloadUrl = parsed.directDownloadUrl || externalDownloadUrl;
    }

    if (fileTextContent) {
      itemObj.rawContent = fileTextContent;
    }

    return JSON.stringify(itemObj, null, 2);
  };

  const handleCopyCode = () => {
    const code = generateCodeSnippet();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Load initial file if passed from global drag and drop
  useEffect(() => {
    if (initialFile) {
      setUploadMode('file');
      handleFileProcess(initialFile);
    }
  }, [initialFile]);

  // Convert Google Drive share link to direct download link
  const getDirectDownloadUrl = (url: string): string => {
    const parsed = parseGoogleDriveUrl(url);
    return parsed.directDownloadUrl || url.trim();
  };

  // Auto-detect metadata on file selection
  const handleFileProcess = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg('');

    // Extract filename and clean title
    const name = file.name;
    const lastDot = name.lastIndexOf('.');
    const baseName = lastDot !== -1 ? name.substring(0, lastDot) : name;
    const ext = lastDot !== -1 ? name.substring(lastDot + 1).toLowerCase() : '';

    // Auto fill title
    const formattedTitle = baseName
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    setTitle(formattedTitle);
    setInstallCommand(name);

    // Detect format and category
    let detectedCategory: ResourceCategory = 'apps';
    let detectedFormat: FileFormat = 'EXE';
    let detectedOs: OperatingSystem[] = ['Windows'];
    let defaultTagline = `Uploaded ${name} file ready for direct download.`;

    if (['bat', 'cmd'].includes(ext)) {
      detectedCategory = 'bat-files';
      detectedFormat = 'BAT';
      detectedOs = ['Windows'];
      defaultTagline = 'Windows automation batch script';
    } else if (['ps1'].includes(ext)) {
      detectedCategory = 'bat-files';
      detectedFormat = 'PS1';
      detectedOs = ['Windows'];
      defaultTagline = 'Windows PowerShell script';
    } else if (['sh', 'bash'].includes(ext)) {
      detectedCategory = 'bat-files';
      detectedFormat = 'SH';
      detectedOs = ['Linux', 'macOS'];
      defaultTagline = 'Shell execution script';
    } else if (['exe', 'msi'].includes(ext)) {
      detectedCategory = 'apps';
      detectedFormat = ext.toUpperCase() as FileFormat;
      detectedOs = ['Windows'];
      defaultTagline = 'Windows application & executable package';
    } else if (['apk'].includes(ext)) {
      detectedCategory = 'apps';
      detectedFormat = 'APK';
      detectedOs = ['Android'];
      defaultTagline = 'Android package application';
    } else if (['dmg', 'app', 'pkg'].includes(ext)) {
      detectedCategory = 'apps';
      detectedFormat = 'APP';
      detectedOs = ['macOS'];
      defaultTagline = 'macOS application bundle';
    } else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      detectedCategory = 'media';
      detectedFormat = ext.toUpperCase() as FileFormat;
      detectedOs = ['Cross-Platform'];
      defaultTagline = 'High-resolution image asset';
    } else if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
      detectedCategory = 'media';
      detectedFormat = (ext === 'mp4' ? 'MP4' : ext === 'webm' ? 'WEBM' : 'VIDEO') as FileFormat;
      detectedOs = ['Cross-Platform'];
      defaultTagline = 'Video media file';
    } else if (['seb'].includes(ext)) {
      detectedCategory = 'seb-files';
      detectedFormat = 'SEB';
      detectedOs = ['Windows', 'macOS'];
      defaultTagline = 'Safe Exam Browser configuration';
    } else if (['pdf', 'md', 'txt', 'doc', 'docx'].includes(ext)) {
      detectedCategory = 'documents';
      detectedFormat = (ext === 'pdf' ? 'PDF' : ext === 'md' ? 'MD' : 'TXT') as FileFormat;
      detectedOs = ['Cross-Platform'];
      defaultTagline = 'Developer documentation file';
    } else if (['zip', 'tar', 'gz', 'rar', '7z', 'iso'].includes(ext)) {
      detectedCategory = 'tools';
      detectedFormat = (ext === 'iso' ? 'ISO' : 'ZIP') as FileFormat;
      detectedOs = ['Cross-Platform'];
      defaultTagline = 'Compressed archive & tool bundle';
    }

    setCategory(detectedCategory);
    setFormat(detectedFormat);
    setSelectedOs(detectedOs);
    setTagline(defaultTagline);
    setDescription(
      `Uploaded file: ${name} (${formatFileSize(file.size)}). Ready for standalone instant download.`
    );
    setTagsInput(`${detectedFormat}, ${detectedCategory.replace('-', ' ')}, ${detectedOs.join(', ')}`);

    // Handle preview and text reading
    if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else if (file.type.startsWith('video/') || ['mp4', 'webm', 'ogg'].includes(ext)) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }

    // Try reading text if it's text/script
    if (
      ['bat', 'cmd', 'ps1', 'sh', 'txt', 'md', 'json', 'yml', 'yaml', 'xml', 'conf', 'py', 'js', 'ts'].includes(ext) ||
      file.type.startsWith('text/')
    ) {
      try {
        const text = await file.text();
        setFileTextContent(text);
      } catch {
        setFileTextContent('');
      }
    } else {
      setFileTextContent('');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const toggleOs = (os: OperatingSystem) => {
    if (selectedOs.includes(os)) {
      if (selectedOs.length > 1) {
        setSelectedOs(selectedOs.filter((o) => o !== os));
      }
    } else {
      setSelectedOs([...selectedOs, os]);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadMode === 'file' && !selectedFile) {
      setErrorMsg('Please select or drop a file to upload.');
      return;
    }
    if (uploadMode === 'gdrive' && !externalDownloadUrl.trim()) {
      setErrorMsg('Please provide your Google Drive or public file download URL.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please provide a title for this resource.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const fileName = selectedFile?.name || `${title.toLowerCase().replace(/\s+/g, '_')}.${format.toLowerCase()}`;
      const isImg = selectedFile?.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(format.toLowerCase());
      const isVid = selectedFile?.type.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(format.toLowerCase());

      const resourceId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      let directOfficialUrl: string | undefined = undefined;
      if (uploadMode === 'gdrive' && externalDownloadUrl) {
        directOfficialUrl = getDirectDownloadUrl(externalDownloadUrl);
      }

      const newResource: ResourceItem = {
        id: resourceId,
        title: title.trim(),
        tagline: tagline.trim() || `Download ${fileName}`,
        description: description.trim() || `User uploaded ${fileName}`,
        category,
        os: selectedOs,
        format,
        size: uploadMode === 'gdrive' ? approxSize : selectedFile ? formatFileSize(selectedFile.size) : '1.0 MB',
        version: version.trim() || '1.0.0',
        updatedDate: 'Aug 2026',
        popular: isPopular,
        recentlyAdded: true,
        downloadCount: 1,
        license: 'Custom',
        author: author.trim() || 'Uploaded Resource',
        tags: tags.length > 0 ? tags : [format, 'Custom Upload'],
        fileName,
        installCommand: installCommand.trim() || fileName,
        isUserUploaded: true,
        officialDownloadUrl: directOfficialUrl,
        mediaType: isImg ? 'image' : isVid ? 'video' : fileTextContent ? 'text' : 'binary',
        mediaUrl: filePreviewUrl || undefined,
        rawContent: fileTextContent || undefined,
        mimeType: selectedFile?.type || undefined,
        installGuide: [
          `Download ${fileName}`,
          isImg ? 'View or embed image' : isVid ? 'Play video asset' : 'Open or execute the downloaded file'
        ]
      };

      // Save to Central Server
      const result = await saveUserUploadedResource(newResource, selectedFile || undefined);
      if (!result.success || !result.resource) {
        throw new Error(result.error || 'Failed to save to central server storage');
      }

      onRefreshStorage?.();
      onResourcePublished(result.resource);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while uploading. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative liquid-glass rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/50 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-md">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Add Resource to Catalog
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload files, scripts, or link directly from your Google Drive (15GB free storage)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full liquid-glass-chip hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handlePublish} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 rounded-xl text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Storage Quota Status Bar */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                <HardDrive className={`w-4 h-4 ${isOverQuota ? 'text-rose-500' : 'text-blue-600'}`} />
                <span>Cloud Storage Quota</span>
                <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400 font-mono">
                  (4.00 GB Limit)
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-zinc-500 dark:text-zinc-400">Remaining:</span>
                <span className={`font-bold font-mono ${isOverQuota ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {formatByteSize(currentRemaining)} left
                </span>
              </div>
            </div>

            {/* Storage Progress Bar */}
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden flex">
              <div 
                className={`h-full transition-all duration-300 ${
                  isOverQuota ? 'bg-rose-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(100, (currentUsed / MAX_STORAGE_BYTES) * 100)}%` }}
                title={`Used: ${formatByteSize(currentUsed)}`}
              />
              {selectedFileSize > 0 && !isOverQuota && (
                <div 
                  className="h-full bg-blue-400/60 dark:bg-blue-300/50 animate-pulse transition-all duration-300"
                  style={{ width: `${Math.min(100, (selectedFileSize / MAX_STORAGE_BYTES) * 100)}%` }}
                  title={`This File: ${formatByteSize(selectedFileSize)}`}
                />
              )}
            </div>

            {/* Storage Details Breakdown */}
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
              <span>Used: <strong className="text-zinc-700 dark:text-zinc-300 font-mono">{formatByteSize(currentUsed)}</strong></span>
              {selectedFileSize > 0 && (
                <span className="text-zinc-600 dark:text-zinc-300 font-mono">
                  Selected File: <strong className="text-blue-600 dark:text-blue-400">+{formatByteSize(selectedFileSize)}</strong>
                  {` (Will leave ${formatByteSize(remainingAfterUpload)})`}
                </span>
              )}
              <span>Total: <strong className="text-zinc-700 dark:text-zinc-300 font-mono">4.00 GB</strong></span>
            </div>

            {/* Over Quota Warning */}
            {isOverQuota && (
              <div className="flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 rounded-lg text-rose-700 dark:text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <strong className="block font-bold">Upload Exceeds 4 GB Storage Limit!</strong>
                  <span>
                    This file is {formatByteSize(selectedFileSize)}, but you only have {formatByteSize(currentRemaining)} left. Please select a smaller file, or choose Google Drive Link above to host files up to 15 GB for free.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mode Switcher: Direct File vs Google Drive */}
          <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                uploadMode === 'file'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Direct File Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('gdrive')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                uploadMode === 'gdrive'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>Google Drive Link (15GB)</span>
            </button>
          </div>

          {/* Google Drive URL Input Mode */}
          {uploadMode === 'gdrive' ? (
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    Google Drive Public Link Integration
                  </h3>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400">
                    Host unlimited apps and files on your 15GB Gmail Google Drive with 1-click downloads for all visitors.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Google Drive Share Link *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={externalDownloadUrl}
                    onChange={(e) => setExternalDownloadUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing"
                    required={uploadMode === 'gdrive'}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  💡 Tip: Right-click file in Google Drive &gt; Share &gt; Change to "Anyone with the link can view". The website automatically converts it into a direct 1-click download link.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Approximate Size
                  </label>
                  <input
                    type="text"
                    value={approxSize}
                    onChange={(e) => setApproxSize(e.target.value)}
                    placeholder="e.g. 45 MB, 1.2 GB"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Direct File / Command Name
                  </label>
                  <input
                    type="text"
                    value={installCommand}
                    onChange={(e) => setInstallCommand(e.target.value)}
                    placeholder="e.g. setup.exe, tool.zip"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Drag & Drop File Zone */
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                Select or Drop File
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                    : selectedFile
                    ? 'border-blue-400 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-950/10'
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-800/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Check className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-sm">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Custom File'}
                      </p>
                    </div>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold underline">
                      Click or drop another file to change
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        Drag and drop your file here, or <span className="text-blue-600 dark:text-blue-400">browse</span>
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Supports .exe, .bat, .seb, .zip, .apk, .mp4, .png, .jpg, .pdf, scripts, etc.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Media Live Preview (if image or video) */}
          {filePreviewUrl && (
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                Live Media Preview
              </span>
              {selectedFile?.type.startsWith('video/') || ['mp4', 'webm'].includes(format.toLowerCase()) ? (
                <video
                  src={filePreviewUrl}
                  controls
                  className="max-h-48 rounded-lg mx-auto bg-black"
                />
              ) : (
                <img
                  src={filePreviewUrl}
                  alt="Preview"
                  className="max-h-48 object-contain rounded-lg mx-auto"
                />
              )}
            </div>
          )}

          {/* Metadata Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Resource Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. My Windows Optimizer"
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="apps">🚀 Apps & Executables (.exe, .app, .apk)</option>
                <option value="bat-files">⚡ BAT & Scripts (.bat, .cmd, .ps1, .sh)</option>
                <option value="media">🎬 Media & Videos (.mp4, .png, .jpg)</option>
                <option value="seb-files">🛡️ SEB Files (.seb)</option>
                <option value="tools">🛠️ Tools & Utilities (.zip, .iso)</option>
                <option value="documents">📄 Documents (.pdf, .md, .txt)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Short Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Brief 1-sentence summary..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Detailed Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description, instructions, or features..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          {/* OS Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Operating System Compatibility
            </label>
            <div className="flex flex-wrap gap-2">
              {(['Windows', 'Linux', 'macOS', 'Android', 'Cross-Platform'] as OperatingSystem[]).map((os) => {
                const isSelected = selectedOs.includes(os);
                return (
                  <button
                    type="button"
                    key={os}
                    onClick={() => toggleOs(os)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-blue-300'
                    }`}
                  >
                    {os}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format & Version & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Format Badge
              </label>
              <input
                type="text"
                value={format}
                onChange={(e) => setFormat(e.target.value.toUpperCase() as FileFormat)}
                placeholder="EXE, BAT, MP4, etc."
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm outline-none font-mono focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Version
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm outline-none font-mono focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Author / Provider
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="My Upload"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tags & Popular toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Windows, Utility, Tool"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 sm:mt-5">
              <input
                type="checkbox"
                id="popular-checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-zinc-300 dark:border-zinc-700 focus:ring-blue-500"
              />
              <label htmlFor="popular-checkbox" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                Feature in Popular Carousel
              </label>
            </div>
          </div>

          {/* Permanent Global Embed Callout & Copy Code */}
          <div className="p-4 rounded-xl bg-zinc-900 text-zinc-100 border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Permanent Global Catalog Embedding
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    To make this resource permanently visible to every person worldwide across all browsers
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCodePreview(!showCodePreview)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
                >
                  {showCodePreview ? 'Hide Code' : 'View Code'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    copiedCode
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code Snippet</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {showCodePreview && (
              <pre className="p-3 rounded-lg bg-black/80 text-blue-400 font-mono text-[11px] overflow-x-auto max-h-48 border border-zinc-800">
                {generateCodeSnippet()}
              </pre>
            )}

            <p className="text-[11px] text-zinc-400">
              💡 <span className="font-semibold text-zinc-300">How to make permanent:</span> Click <span className="text-blue-400 font-mono">Copy Code Snippet</span> above, then paste it in your next chat message to the assistant: <span className="italic text-zinc-300">"Please add this resource to the catalog in code"</span>.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              {copiedCode ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Code Copied' : 'Copy Code for AI'}</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || (uploadMode === 'file' && isOverQuota)}
                className={`px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition cursor-pointer flex items-center gap-2 ${
                  saving || (uploadMode === 'file' && isOverQuota) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>
                  {saving 
                    ? 'Publishing...' 
                    : uploadMode === 'file' && isOverQuota 
                      ? 'Quota Exceeded' 
                      : 'Publish to Catalog'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
