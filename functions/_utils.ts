// Cloudflare Pages Functions utility helpers

export interface Env {
  DB?: any; // Cloudflare D1 Database binding
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function jsonResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

export function mapDbRowToResource(row: any): any {
  if (!row) return null;

  let parsedOs = ['Cross-Platform'];
  if (row.os) {
    try {
      parsedOs = typeof row.os === 'string' ? JSON.parse(row.os) : row.os;
    } catch {
      parsedOs = [row.os];
    }
  }

  let parsedTags = ['Community Upload'];
  if (row.tags) {
    try {
      parsedTags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
    } catch {
      parsedTags = [row.tags];
    }
  }

  let parsedInstallGuide: string[] | undefined = undefined;
  if (row.install_guide) {
    try {
      parsedInstallGuide = typeof row.install_guide === 'string' ? JSON.parse(row.install_guide) : row.install_guide;
    } catch {
      parsedInstallGuide = [row.install_guide];
    }
  }

  return {
    id: row.id,
    title: row.title,
    tagline: row.tagline || '',
    description: row.description || '',
    category: row.category,
    os: parsedOs,
    format: row.format,
    size: row.size || '1.0 MB',
    version: row.version || '1.0.0',
    updatedDate: row.updated_date || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    sha256: row.sha256 || undefined,
    popular: Boolean(row.popular),
    recentlyAdded: Boolean(row.recently_added),
    downloadCount: Number(row.download_count || 0),
    license: row.license || 'Community / Open',
    sourceUrl: row.source_url || undefined,
    officialDownloadUrl: row.official_download_url || undefined,
    installCommand: row.install_command || undefined,
    author: row.author || 'Community Contributor',
    tags: parsedTags,
    fileName: row.file_name || undefined,
    isUserUploaded: Boolean(row.is_user_uploaded ?? true),
    mediaType: row.media_type || undefined,
    mediaUrl: row.media_url || (row.file_data ? `/api/resources/media/${row.id}` : undefined),
    rawContent: row.raw_content || undefined,
    mimeType: row.mime_type || undefined,
    installGuide: parsedInstallGuide,
  };
}

export async function hashStringSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
