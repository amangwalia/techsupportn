import { Env, jsonResponse, corsHeaders } from '../../../_utils';

export const onRequestGet = async ({ params, env }: { params: { id: string }; env: Env }) => {
  const { id } = params;

  if (!env.DB) {
    return jsonResponse({ error: 'Database not bound' }, 500);
  }

  const row = await env.DB.prepare('SELECT * FROM resources WHERE id = ?').bind(id).first();
  if (!row) {
    return jsonResponse({ error: 'Media not found' }, 404);
  }

  if (row.media_url && !row.file_data) {
    return Response.redirect(row.media_url, 302);
  }

  if (row.file_data) {
    const binaryString = atob(row.file_data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': row.mime_type || 'image/png',
        'Cache-Control': 'public, max-age=86400',
        ...corsHeaders,
      },
    });
  }

  if (row.raw_content) {
    return new Response(row.raw_content, {
      status: 200,
      headers: {
        'Content-Type': row.mime_type || 'text/plain; charset=utf-8',
        ...corsHeaders,
      },
    });
  }

  return jsonResponse({ error: 'No media content' }, 404);
};
