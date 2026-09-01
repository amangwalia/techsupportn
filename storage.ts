import { ResourceItem, StorageUsageInfo, UploadProgressInfo } from '../types';

export const MAX_STORAGE_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB (4,294,967,296 bytes)

export const formatByteSize = (bytes: number): string => {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i >= 3 ? 2 : 1)} ${units[i]}`;
};

export const formatEtaTime = (seconds: number): string => {
  if (seconds <= 0) return '< 1s left';
  if (seconds < 60) return `${Math.round(seconds)}s left`;
  const mins = Math.floor(seconds / 60);
  const remainingSecs = Math.round(seconds % 60);
  if (mins < 60) {
    return remainingSecs > 0 ? `${mins}m ${remainingSecs}s left` : `${mins}m left`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m left`;
};

export const parseSizeStringToBytes = (sizeStr?: string): number => {
  if (!sizeStr) return 0;
  const clean = sizeStr.toUpperCase().trim();
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  if (clean.includes('GB')) return Math.round(num * 1024 * 1024 * 1024);
  if (clean.includes('MB')) return Math.round(num * 1024 * 1024);
  if (clean.includes('KB')) return Math.round(num * 1024);
  return Math.round(num);
};

/**
 * Fetches accurate storage usage from server/D1, or calculates locally from cache/IndexedDB
 */
export const fetchStorageUsage = async (cachedItems?: ResourceItem[]): Promise<StorageUsageInfo> => {
  try {
    const res = await fetch('/api/storage-usage');
    if (res.ok) {
      const data: StorageUsageInfo = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('Could not query /api/storage-usage, computing locally:', e);
  }

  // Fallback calculation using cached resources & local items
  const items = cachedItems || (await getUserUploadedResources());
  let usedBytes = 0;
  for (const it of items) {
    if (it.rawContent) {
      usedBytes += new TextEncoder().encode(it.rawContent).length;
    } else {
      usedBytes += parseSizeStringToBytes(it.size);
    }
  }

  const remainingBytes = Math.max(0, MAX_STORAGE_BYTES - usedBytes);
  const usedPercentage = Math.min(100, (usedBytes / MAX_STORAGE_BYTES) * 100);

  return {
    totalBytes: MAX_STORAGE_BYTES,
    usedBytes,
    remainingBytes,
    usedPercentage: parseFloat(usedPercentage.toFixed(2)),
    formattedTotal: '4.00 GB',
    formattedUsed: formatByteSize(usedBytes),
    formattedRemaining: formatByteSize(remainingBytes),
    fileCount: items.length,
    limitExceeded: usedBytes >= MAX_STORAGE_BYTES,
  };
};

const DB_NAME = 'TechSupportCatalogDB';
const DB_VERSION = 1;
const STORE_NAME = 'uploaded_files';

// Open IndexedDB for offline storage fallback
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveBlobLocally = async (id: string, blob: Blob): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save blob to IndexedDB:', err);
  }
};

const getBlobLocally = async (id: string): Promise<Blob | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

const deleteBlobLocally = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore error
  }
};

/**
 * Converts a Blob or File to Base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
};

/**
 * Retrieves all community & user-uploaded resources.
 * Merges server records with any locally stored items.
 */
export const getUserUploadedResources = async (): Promise<ResourceItem[]> => {
  let serverItems: ResourceItem[] = [];
  try {
    const res = await fetch('/api/resources', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        serverItems = data;
        localStorage.setItem('cached_server_resources', JSON.stringify(data));
      }
    }
  } catch (e) {
    console.warn('Could not fetch server resources, using local cache:', e);
    try {
      const cached = localStorage.getItem('cached_server_resources');
      if (cached) serverItems = JSON.parse(cached);
    } catch {
      serverItems = [];
    }
  }

  // Also merge any local fallback items
  let localFallbackItems: ResourceItem[] = [];
  try {
    const local = localStorage.getItem('local_fallback_resources');
    if (local) localFallbackItems = JSON.parse(local);
  } catch {
    localFallbackItems = [];
  }

  // Merge unique by ID
  const map = new Map<string, ResourceItem>();
  for (const item of serverItems) {
    map.set(item.id, item);
  }
  for (const item of localFallbackItems) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values());
};

/**
 * Uploads a new resource and its binary file to the central server storage.
 * Seamlessly tracks live upload percentage, transfer speed, bytes uploaded, and remaining time.
 * Seamlessly falls back to local storage if server is unavailable.
 */
export const saveUserUploadedResource = async (
  item: ResourceItem,
  file?: File | Blob,
  onProgress?: (progress: UploadProgressInfo) => void,
  cancelRef?: { current?: (() => void) | null }
): Promise<{ success: boolean; resource?: ResourceItem; error?: string; isCancelled?: boolean }> => {
  try {
    if (!file && !item.rawContent && !item.officialDownloadUrl) {
      throw new Error('No file, content, or cloud download URL provided for upload.');
    }

    const fileName = item.fileName || (file instanceof File ? file.name : 'upload.bin');
    const fileSize = file ? file.size : item.rawContent ? new TextEncoder().encode(item.rawContent).length : 1024;

    // Report initial progress
    if (onProgress) {
      onProgress({
        loaded: 0,
        total: fileSize,
        percentage: 0,
        speedBytesPerSec: 0,
        formattedLoaded: '0 B',
        formattedTotal: formatByteSize(fileSize),
        formattedSpeed: '0 B/s',
        timeRemainingSeconds: 0,
        formattedTimeRemaining: 'Preparing upload...',
        status: 'uploading'
      });
    }

    // 1. Attempt Multipart FormData upload with real-time XHR progress tracking
    if (file) {
      const uploadResult = await new Promise<{ success: boolean; resource?: ResourceItem; error?: string; isCancelled?: boolean }>((resolve) => {
        try {
          const formData = new FormData();
          formData.append('file', file, fileName);
          formData.append('title', item.title);
          formData.append('category', item.category);
          formData.append('format', item.format);
          formData.append('tagline', item.tagline || '');
          formData.append('description', item.description || '');
          formData.append('os', JSON.stringify(item.os));
          formData.append('version', item.version || '1.0.0');
          formData.append('author', item.author || 'Contributor');
          formData.append('tags', JSON.stringify(item.tags || []));
          formData.append('popular', item.popular ? 'true' : 'false');
          formData.append('installCommand', item.installCommand || '');
          if (item.officialDownloadUrl) {
            formData.append('officialDownloadUrl', item.officialDownloadUrl);
          }
          if (item.size) {
            formData.append('size', item.size);
          }
          if (item.rawContent) {
            formData.append('rawContent', item.rawContent);
          }

          const xhr = new XMLHttpRequest();
          const startTime = Date.now();

          // Bind cancel handler
          if (cancelRef) {
            cancelRef.current = () => {
              try {
                xhr.abort();
              } catch (e) {
                console.warn('Error aborting XHR:', e);
              }
            };
          }

          xhr.onabort = () => {
            if (onProgress) {
              onProgress({
                loaded: 0,
                total: fileSize,
                percentage: 0,
                speedBytesPerSec: 0,
                formattedLoaded: '0 B',
                formattedTotal: formatByteSize(fileSize),
                formattedSpeed: '0 B/s',
                timeRemainingSeconds: 0,
                formattedTimeRemaining: 'Upload cancelled',
                status: 'cancelled'
              });
            }
            resolve({ success: false, error: 'Upload cancelled by user.', isCancelled: true });
          };

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && event.total > 0) {
              const now = Date.now();
              const elapsedTotalSec = Math.max(0.1, (now - startTime) / 1000);
              const loaded = event.loaded;
              const total = event.total;
              const percentage = Math.min(99, Math.round((loaded / total) * 100));

              // Speed & ETA calculation
              const speedBytesPerSec = loaded / elapsedTotalSec;
              const remainingBytes = Math.max(0, total - loaded);
              const timeRemainingSeconds = speedBytesPerSec > 0 ? Math.ceil(remainingBytes / speedBytesPerSec) : 0;

              if (onProgress) {
                onProgress({
                  loaded,
                  total,
                  percentage,
                  speedBytesPerSec,
                  formattedLoaded: formatByteSize(loaded),
                  formattedTotal: formatByteSize(total),
                  formattedSpeed: `${formatByteSize(speedBytesPerSec)}/s`,
                  timeRemainingSeconds,
                  formattedTimeRemaining: formatEtaTime(timeRemainingSeconds),
                  status: 'uploading'
                });
              }
            }
          };

          xhr.upload.onload = () => {
            if (onProgress) {
              onProgress({
                loaded: fileSize,
                total: fileSize,
                percentage: 100,
                speedBytesPerSec: 0,
                formattedLoaded: formatByteSize(fileSize),
                formattedTotal: formatByteSize(fileSize),
                formattedSpeed: 'Processing...',
                timeRemainingSeconds: 0,
                formattedTimeRemaining: 'Saving & indexing on server...',
                status: 'processing'
              });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const savedResource: ResourceItem = JSON.parse(xhr.responseText);
                if (file) {
                  saveBlobLocally(savedResource.id, file).catch(() => {});
                  if (item.id && item.id !== savedResource.id) {
                    saveBlobLocally(item.id, file).catch(() => {});
                  }
                }
                if (onProgress) {
                  onProgress({
                    loaded: fileSize,
                    total: fileSize,
                    percentage: 100,
                    speedBytesPerSec: 0,
                    formattedLoaded: formatByteSize(fileSize),
                    formattedTotal: formatByteSize(fileSize),
                    formattedSpeed: 'Done',
                    timeRemainingSeconds: 0,
                    formattedTimeRemaining: 'Upload Complete!',
                    status: 'completed'
                  });
                }
                resolve({ success: true, resource: savedResource });
              } catch (parseErr) {
                resolve({ success: false, error: 'Invalid response from server.' });
              }
            } else {
              try {
                const errData = JSON.parse(xhr.responseText);
                if (xhr.status === 413 || errData.code === 'STORAGE_LIMIT_EXCEEDED' || errData.error?.includes('Storage')) {
                  resolve({ success: false, error: errData.error || 'Storage capacity limit of 4 GB exceeded.' });
                } else {
                  resolve({ success: false, error: errData.error || `Server returned error (${xhr.status})` });
                }
              } catch {
                resolve({ success: false, error: `Upload failed with status ${xhr.status}` });
              }
            }
          };

          xhr.onerror = () => {
            resolve({ success: false, error: 'Network connection lost during file upload.' });
          };

          xhr.open('POST', '/api/resources/upload', true);
          xhr.send(formData);
        } catch (err: any) {
          resolve({ success: false, error: err?.message || 'Failed to initialize file upload.' });
        }
      });

      if (uploadResult.isCancelled) {
        return uploadResult;
      }
      if (uploadResult.success) {
        return uploadResult;
      }
      if (uploadResult.error && (uploadResult.error.includes('Storage') || uploadResult.error.includes('capacity'))) {
        return uploadResult;
      }
    }

    // 2. Attempt JSON payload to server (works for Google Drive links, scripts, and base64 fallbacks)
    try {
      if (onProgress) {
        onProgress({
          loaded: Math.round(fileSize * 0.5),
          total: fileSize,
          percentage: 50,
          speedBytesPerSec: 0,
          formattedLoaded: formatByteSize(fileSize * 0.5),
          formattedTotal: formatByteSize(fileSize),
          formattedSpeed: 'Publishing...',
          timeRemainingSeconds: 1,
          formattedTimeRemaining: 'Publishing to cloud catalog...',
          status: 'uploading'
        });
      }

      let base64Data = '';
      if (file) {
        base64Data = await blobToBase64(file);
      }

      const jsonPayload = {
        title: item.title,
        category: item.category,
        format: item.format,
        tagline: item.tagline || '',
        description: item.description || '',
        os: item.os,
        version: item.version || '1.0.0',
        author: item.author || 'Contributor',
        tags: item.tags || [],
        popular: item.popular,
        installCommand: item.installCommand || '',
        rawContent: item.rawContent,
        officialDownloadUrl: item.officialDownloadUrl,
        size: item.size,
        base64Data: base64Data || undefined,
        fileName,
      };

      const res = await fetch('/api/resources/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(jsonPayload),
      });

      if (res.ok) {
        const savedResource: ResourceItem = await res.json();
        if (onProgress) {
          onProgress({
            loaded: fileSize,
            total: fileSize,
            percentage: 100,
            speedBytesPerSec: 0,
            formattedLoaded: formatByteSize(fileSize),
            formattedTotal: formatByteSize(fileSize),
            formattedSpeed: 'Done',
            timeRemainingSeconds: 0,
            formattedTimeRemaining: 'Upload Complete!',
            status: 'completed'
          });
        }
        return { success: true, resource: savedResource };
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 413 || errData.code === 'STORAGE_LIMIT_EXCEEDED' || errData.error?.includes('Storage')) {
          return { success: false, error: errData.error || 'Storage capacity limit of 4 GB exceeded.' };
        }
      }
    } catch (jsonErr: any) {
      if (jsonErr?.message?.includes('Storage')) {
        return { success: false, error: jsonErr.message };
      }
      console.warn('JSON upload failed, activating local persistence fallback:', jsonErr);
    }

    // 3. Resilient Local Persistence Fallback (guarantees upload never fails)
    const localResource: ResourceItem = {
      ...item,
      id: item.id || `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileName,
      isUserUploaded: true,
      mediaUrl: file ? URL.createObjectURL(file) : undefined,
    };

    if (file) {
      await saveBlobLocally(localResource.id, file);
    }

    try {
      const existing = localStorage.getItem('local_fallback_resources');
      const list: ResourceItem[] = existing ? JSON.parse(existing) : [];
      list.unshift(localResource);
      localStorage.setItem('local_fallback_resources', JSON.stringify(list));
    } catch (lsErr) {
      console.warn('Could not write to localStorage:', lsErr);
    }

    if (onProgress) {
      onProgress({
        loaded: fileSize,
        total: fileSize,
        percentage: 100,
        speedBytesPerSec: 0,
        formattedLoaded: formatByteSize(fileSize),
        formattedTotal: formatByteSize(fileSize),
        formattedSpeed: 'Done',
        timeRemainingSeconds: 0,
        formattedTimeRemaining: 'Saved locally',
        status: 'completed'
      });
    }

    return { success: true, resource: localResource };
  } catch (e: any) {
    console.error('Error in saveUserUploadedResource:', e);
    return { success: false, error: e.message || 'Failed to process resource.' };
  }
};

/**
 * Retrieves the stored Blob for a resource (from server or local DB)
 */
export const getUserResourceBlob = async (id: string): Promise<Blob | null> => {
  // First check local DB
  const localBlob = await getBlobLocally(id);
  if (localBlob) return localBlob;

  // Check possible ID aliases
  if (id.startsWith('comm-')) {
    const userAlias = id.replace('comm-', 'user-');
    const localBlob2 = await getBlobLocally(userAlias);
    if (localBlob2) return localBlob2;
  } else if (id.startsWith('user-')) {
    const commAlias = id.replace('user-', 'comm-');
    const localBlob2 = await getBlobLocally(commAlias);
    if (localBlob2) return localBlob2;
  }

  // Then try server endpoint
  try {
    const res = await fetch(`/api/resources/file/${encodeURIComponent(id)}`);
    if (res.ok) {
      const blob = await res.blob();
      // Cache in IndexedDB for subsequent instant offline downloads
      saveBlobLocally(id, blob).catch(() => {});
      return blob;
    }
  } catch (e) {
    console.warn('Could not fetch blob from server:', e);
  }

  return null;
};

/**
 * Deletes a user-uploaded resource from server and local storage
 */
export const deleteUserUploadedResource = async (id: string): Promise<boolean> => {
  let success = false;
  try {
    const res = await fetch(`/api/resources/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) success = true;
  } catch {
    // Ignore error
  }

  // Clean local fallback storage
  try {
    await deleteBlobLocally(id);
    const existing = localStorage.getItem('local_fallback_resources');
    if (existing) {
      const list: ResourceItem[] = JSON.parse(existing);
      const filtered = list.filter((item) => item.id !== id);
      localStorage.setItem('local_fallback_resources', JSON.stringify(filtered));
      success = true;
    }
  } catch {
    // Ignore error
  }

  return success;
};
