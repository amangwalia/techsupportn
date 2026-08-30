import { Env, jsonResponse } from '../_utils';

export const onRequestGet = async ({ env }: { env: Env }) => {
  let dbStatus = 'disconnected';
  let totalCount = 0;

  if (env.DB) {
    try {
      const result = await env.DB.prepare('SELECT COUNT(*) as count FROM resources').first();
      dbStatus = 'connected';
      totalCount = result?.count || 0;
    } catch (err: any) {
      dbStatus = `error: ${err.message || String(err)}`;
    }
  }

  return jsonResponse({
    status: 'ok',
    environment: 'Cloudflare Pages Functions',
    d1Database: dbStatus,
    totalResources: totalCount,
    timestamp: new Date().toISOString(),
  });
};
