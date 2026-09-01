import { Env, jsonResponse, corsHeaders } from '../../../_utils';

export const onRequestGet = async ({ params, env }: { params: { id: string }; env: Env }) => {
  const { id } = params;

  if (!env.DB) {
    return jsonResponse({ error: 'Database not bound' }, 500);
  }

  const row = await env.DB.prepare('SELECT * FROM resources WHERE id = ?').bind(id).first();
  if (!row) {
    return jsonResponse({ error: 'Resource not found' }, 404);
  }

  // Increment count
  try {
    await env.DB.prepare('UPDATE resources SET download_count = download_count + 1 WHERE id = ?').bind(id).run();
  } catch (e) {
    console.warn('Could not increment download count:', e);
  }

  // 1. If official / Google drive link
  if (row.official_download_url) {
    return Response.redirect(row.official_download_url, 302);
  }

  // 2. If raw text content
  if (row.raw_content) {
    return new Response(row.raw_content, {
      status: 200,
      headers: {
        'Content-Type': row.mime_type || 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${row.file_name || 'download.txt'}"`,
        ...corsHeaders,
      },
    });
  }

  // 3. If base64 file data
  if (row.file_data) {
    const binaryString = atob(row.file_data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': row.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${row.file_name || 'download.bin'}"`,
        ...corsHeaders,
      },
    });
  }

  return jsonResponse({ error: 'No downloadable file stream found' }, 404);
};
