import JSZip from 'jszip';
import { ResourceItem } from '../types';
import { getUserResourceBlob } from './storage';

/**
 * Downloads a single file with appropriate content and filename
 */
export const downloadSingleFile = (filename: string, content: string, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Retain object URL for 2 minutes to ensure browser disk write completes without "File not available on site" error
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
  }, 120000);
};

/**
 * Downloads a binary Blob directly
 */
export const downloadBlobFile = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Retain object URL for 2 minutes to allow browser async download stream to complete
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
  }, 120000);
};

/**
 * Creates and downloads a real ZIP archive containing all project files
 */
export const downloadZipArchive = async (zipFilename: string, files: { path: string; content: string }[]) => {
  const zip = new JSZip();

  files.forEach((file) => {
    // Normalise relative paths (strip leading /)
    const cleanPath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
    zip.file(cleanPath, file.content);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
  }, 120000);
};

/**
 * Converts any Google Drive link format into direct download and preview URLs
 */
export const parseGoogleDriveUrl = (url: string): { directDownloadUrl: string; fileId?: string; isGoogleDrive: boolean } => {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return { directDownloadUrl: trimmed, isGoogleDrive: false };
  }

  // Common patterns for Google Drive IDs:
  // 1. https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // 2. https://drive.google.com/open?id=FILE_ID
  // 3. https://drive.google.com/uc?id=FILE_ID
  // 4. https://docs.google.com/document/d/FILE_ID/...
  // 5. https://docs.google.com/spreadsheets/d/FILE_ID/...
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const fileId = match[1];
      return {
        fileId,
        directDownloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        isGoogleDrive: true,
      };
    }
  }

  return { directDownloadUrl: trimmed, isGoogleDrive: false };
};

/**
 * Triggers the main 1-click download action for any ResourceItem
 */
export const triggerResourceDownload = async (item: ResourceItem): Promise<boolean> => {
  try {
    // 1. If it has an official / Google Drive / External cloud download link
    if (item.officialDownloadUrl) {
      const parsed = parseGoogleDriveUrl(item.officialDownloadUrl);
      const targetUrl = parsed.directDownloadUrl || item.officialDownloadUrl;

      // Create a hidden anchor and trigger click (allows direct browser download / prompt)
      const link = document.createElement('a');
      link.href = targetUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = item.fileName || `${item.title.replace(/\s+/g, '_')}.${getFileExtension(item.format)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    // 2. If it's a community / user-uploaded binary or local file
    if (item.isUserUploaded || item.id.startsWith('comm-') || item.id.startsWith('user-') || item.id.startsWith('local-')) {
      // Check if we have a locally stored Blob
      const localBlob = await getUserResourceBlob(item.id);
      if (localBlob) {
        const filename = item.fileName || `${item.title.replace(/\s+/g, '_')}.${getFileExtension(item.format)}`;
        downloadBlobFile(filename, localBlob);
        return true;
      }

      // Otherwise trigger server download endpoint
      const downloadUrl = `/api/resources/file/${encodeURIComponent(item.id)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = item.fileName || `${item.title.replace(/\s+/g, '_')}.${getFileExtension(item.format)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    // 3. Multi-file starter kit -> download as zip
    if (item.files && item.files.length > 0) {
      const zipName = item.fileName || `${item.id}-starter.zip`;
      await downloadZipArchive(zipName, item.files);
      return true;
    } else if (item.rawContent) {
      // Single script/config/cheat sheet -> download as appropriate file
      const filename = item.fileName || `${item.id}.${getFileExtension(item.format)}`;
      const mime = getMimeType(item.format);
      downloadSingleFile(filename, item.rawContent, mime);
      return true;
    } else if (item.cheatSheetSections) {
      // Convert structured cheat sheet into comprehensive Markdown file
      const mdContent = generateMarkdownFromCheatSheet(item);
      const filename = `${item.id}-cheatsheet.md`;
      downloadSingleFile(filename, mdContent, 'text/markdown');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Download failed:', error);
    return false;
  }
};

/**
 * Calculates SHA-256 of text or file content using Web Crypto API
 */
export const calculateSha256 = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Calculates SHA-256 of an uploaded Blob/File
 */
export const calculateFileSha256 = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Helper to get extension based on format
 */
export const getFileExtension = (format: string): string => {
  switch (format.toUpperCase()) {
    case 'SEB':
      return 'seb';
    case 'BAT':
    case 'CMD':
      return 'bat';
    case 'SH':
      return 'sh';
    case 'PS1':
      return 'ps1';
    case 'YML':
    case 'YAML':
      return 'yml';
    case 'JSON':
      return 'json';
    case 'CONF':
      return 'conf';
    case 'PY':
      return 'py';
    case 'MD':
      return 'md';
    case 'PDF':
      return 'pdf';
    case 'ZIP':
      return 'zip';
    case 'ISO':
      return 'iso';
    case 'CLI':
    case 'EXE':
      return 'exe';
    case 'MSI':
      return 'msi';
    case 'APK':
      return 'apk';
    case 'APP':
      return 'app';
    case 'PNG':
      return 'png';
    case 'JPG':
    case 'JPEG':
      return 'jpg';
    case 'WEBP':
      return 'webp';
    case 'GIF':
      return 'gif';
    case 'SVG':
      return 'svg';
    case 'MP4':
    case 'VIDEO':
      return 'mp4';
    case 'WEBM':
      return 'webm';
    case 'MKV':
      return 'mkv';
    default:
      return 'txt';
  }
};

/**
 * Helper to get mime type
 */
export const getMimeType = (format: string): string => {
  switch (format.toUpperCase()) {
    case 'SEB':
      return 'application/seb';
    case 'BAT':
    case 'CMD':
      return 'application/x-bat';
    case 'SH':
    case 'PS1':
      return 'application/x-sh';
    case 'JSON':
      return 'application/json';
    case 'YML':
    case 'YAML':
      return 'application/x-yaml';
    case 'MD':
      return 'text/markdown';
    case 'PY':
      return 'text/x-python';
    case 'PDF':
      return 'application/pdf';
    case 'PNG':
      return 'image/png';
    case 'JPG':
    case 'JPEG':
      return 'image/jpeg';
    case 'WEBP':
      return 'image/webp';
    case 'GIF':
      return 'image/gif';
    case 'SVG':
      return 'image/svg+xml';
    case 'MP4':
    case 'VIDEO':
      return 'video/mp4';
    case 'WEBM':
      return 'video/webm';
    case 'MKV':
      return 'video/x-matroska';
    case 'EXE':
    case 'MSI':
    case 'ISO':
    case 'APK':
      return 'application/octet-stream';
    case 'ZIP':
      return 'application/zip';
    default:
      return 'text/plain';
  }
};

/**
 * Generates a clean Markdown export for cheat sheets
 */
export const generateMarkdownFromCheatSheet = (item: ResourceItem): string => {
  let md = `# ${item.title}\n\n`;
  md += `> ${item.tagline || item.description}\n\n`;
  md += `- **Version:** ${item.version}\n`;
  md += `- **Updated:** ${item.updatedDate}\n`;
  md += `- **License:** ${item.license}\n`;
  md += `- **SHA-256 Integrity:** \`${item.sha256}\`\n\n`;
  md += `---\n\n`;

  if (item.cheatSheetSections) {
    item.cheatSheetSections.forEach((section) => {
      md += `## ${section.title}\n`;
      if (section.description) {
        md += `${section.description}\n\n`;
      }
      section.items.forEach((entry) => {
        md += `### \`${entry.command}\`\n`;
        md += `${entry.explanation}\n`;
        if (entry.example) {
          md += `\`\`\`bash\n${entry.example}\n\`\`\`\n`;
        }
        md += `\n`;
      });
    });
  } else if (item.rawContent) {
    md += `\`\`\`${item.codeLanguage || 'text'}\n${item.rawContent}\n\`\`\`\n`;
  }

  return md;
};
