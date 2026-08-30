export type ResourceCategory = 
  | 'bat-files'
  | 'apps'
  | 'media'
  | 'seb-files'
  | 'tools'
  | 'documents';

export type OperatingSystem = 'Linux' | 'Windows' | 'macOS' | 'Android' | 'Cross-Platform';

export type FileFormat = 
  | 'BAT' 
  | 'EXE' 
  | 'MSI' 
  | 'APK' 
  | 'APP'
  | 'IMG' 
  | 'PNG' 
  | 'JPG' 
  | 'WEBP' 
  | 'GIF' 
  | 'SVG'
  | 'VIDEO' 
  | 'MP4' 
  | 'WEBM' 
  | 'MKV'
  | 'SEB' 
  | 'ZIP' 
  | 'ISO' 
  | 'PDF' 
  | 'MD' 
  | 'SH' 
  | 'PS1' 
  | 'YML' 
  | 'JSON' 
  | 'CONF' 
  | 'TXT' 
  | 'CLI';

export interface ResourceFile {
  name: string;
  path: string;
  content: string;
  language?: string;
  size?: string;
}

export interface CheatSheetSection {
  title: string;
  description?: string;
  items: {
    command: string;
    explanation: string;
    example?: string;
    category?: string;
  }[];
}

export interface ResourceItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: ResourceCategory;
  os: OperatingSystem[];
  format: FileFormat;
  size: string;
  version: string;
  updatedDate: string;
  sha256?: string;
  popular?: boolean;
  recentlyAdded?: boolean;
  downloadCount: number;
  license: string;
  sourceUrl?: string;
  officialDownloadUrl?: string;
  installCommand?: string;
  author?: string;
  tags: string[];
  // For single files or code
  rawContent?: string;
  codeLanguage?: string;
  fileName?: string;
  // For binary/media uploads
  isUserUploaded?: boolean;
  mediaType?: 'image' | 'video' | 'binary' | 'text';
  mediaUrl?: string; // Data URL or object URL
  fileData?: ArrayBuffer | string; // Stored binary or base64
  mimeType?: string;
  // For multi-file starter kits
  files?: ResourceFile[];
  // For structured cheat sheets
  cheatSheetSections?: CheatSheetSection[];
  // Documentation / instructions
  installGuide?: string[];
  changelog?: { version: string; date: string; notes: string[] }[];
  alternatives?: string[];
}

export interface StorageUsageInfo {
  totalBytes: number;
  usedBytes: number;
  remainingBytes: number;
  usedPercentage: number;
  formattedTotal: string;
  formattedUsed: string;
  formattedRemaining: string;
  fileCount: number;
  limitExceeded?: boolean;
}

