import { Env, jsonResponse } from '../../../_utils';

export const onRequestPost = async ({ params, env }: { params: { id: string }; env: Env }) => {
  const { id } = params;

  if (!env.DB) {
    return jsonResponse({ error: 'Database not bound' }, 500);
  }

  await env.DB.prepare(
    'UPDATE resources SET download_count = download_count + 1 WHERE id = ?'
  ).bind(id).run();

  const row = await env.DB.prepare(
    'SELECT download_count FROM resources WHERE id = ?'
  ).bind(id).first();

  return jsonResponse({
    success: true,
    id,
    count: row ? row.download_count : 1,
  });
};
