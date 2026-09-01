import { Env, jsonResponse } from '../_utils';

export const MAX_STORAGE_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB in bytes

export function formatByteSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i >= 3 ? 2 : 1)} ${units[i]}`;
}

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    let usedBytes = 0;
    let fileCount = 0;

    if (env.DB) {
      // Calculate storage used from D1 database records (lengths of stored file_data base64, raw_content, and metadata size)
      const rows = await env.DB.prepare(
        'SELECT id, file_data, raw_content, size FROM resources'
      ).all();

      if (rows && rows.results) {
        fileCount = rows.results.length;
        for (const row of rows.results as any[]) {
          if (row.file_data) {
            // Approx base64 binary size
            usedBytes += Math.round((String(row.file_data).length * 3) / 4);
          } else if (row.raw_content) {
            usedBytes += new TextEncoder().encode(String(row.raw_content)).length;
          } else if (row.size) {
            // Parse human-readable size e.g. "15 MB", "1.2 GB"
            const sizeStr = String(row.size).toUpperCase().trim();
            const num = parseFloat(sizeStr);
            if (!isNaN(num)) {
              if (sizeStr.includes('GB')) usedBytes += Math.round(num * 1024 * 1024 * 1024);
              else if (sizeStr.includes('MB')) usedBytes += Math.round(num * 1024 * 1024);
              else if (sizeStr.includes('KB')) usedBytes += Math.round(num * 1024);
              else usedBytes += Math.round(num);
            }
          }
        }
      }
    }

    const remainingBytes = Math.max(0, MAX_STORAGE_BYTES - usedBytes);
    const usedPercentage = Math.min(100, (usedBytes / MAX_STORAGE_BYTES) * 100);

    return jsonResponse({
      totalBytes: MAX_STORAGE_BYTES,
      usedBytes,
      remainingBytes,
      usedPercentage: parseFloat(usedPercentage.toFixed(2)),
      formattedTotal: '4.00 GB',
      formattedUsed: formatByteSize(usedBytes),
      formattedRemaining: formatByteSize(remainingBytes),
      fileCount,
      limitExceeded: usedBytes >= MAX_STORAGE_BYTES,
    });
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Failed to compute storage usage' }, 500);
  }
};
