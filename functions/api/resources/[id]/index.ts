import { Env, jsonResponse, mapDbRowToResource } from '../../../_utils';

export const onRequestGet = async ({ params, env }: { params: { id: string }; env: Env }) => {
  const { id } = params;

  if (!env.DB) {
    return jsonResponse({ error: 'Database not bound' }, 500);
  }

  const row = await env.DB.prepare('SELECT * FROM resources WHERE id = ?').bind(id).first();
  if (!row) {
    return jsonResponse({ error: 'Resource not found' }, 404);
  }

  return jsonResponse(mapDbRowToResource(row));
};

export const onRequestDelete = async ({ params, env }: { params: { id: string }; env: Env }) => {
  const { id } = params;

  if (!env.DB) {
    return jsonResponse({ error: 'Database not bound' }, 500);
  }

  await env.DB.prepare('DELETE FROM resources WHERE id = ?').bind(id).run();
  return jsonResponse({ success: true, id });
};
