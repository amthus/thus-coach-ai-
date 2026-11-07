/**
 * Vercel serverless entry. Static assets are served by Vercel's CDN; this function handles
 * /api/*, robots.txt, sitemap.xml and HTML routes (with server-injected SEO metadata).
 */
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { bootstrap } from '../server/bootstrap';

let appPromise: ReturnType<typeof bootstrap> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  appPromise ??= bootstrap({ mode: 'static', distDir: path.join(process.cwd(), 'dist') });
  const { app } = await appPromise;
  return app(req as never, res as never);
}
