import { Env, jsonResponse, mapDbRowToResource } from '../../_utils';

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    if (!env.DB) {
      return jsonResponse([]);
    }

    const { results } = await env.DB.prepare(
      'SELECT * FROM resources ORDER BY created_at DESC'
    ).all();

    const mapped = (results || []).map(mapDbRowToResource);
    return jsonResponse(mapped);
  } catch (err: any) {
    console.error('Error fetching resources from D1:', err);
    return jsonResponse({ error: err.message || 'Failed to fetch resources from database' }, 500);
  }
};
