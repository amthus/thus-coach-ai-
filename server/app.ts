import fs from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { AppContext } from './context';
import { errorHandler, notFound } from './lib/http';
import { csrfGuard, loadSession } from './middleware/auth';
import { accountRouter } from './routes/account';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { chatRouter } from './routes/chat';
import { trainingRouter } from './routes/training';
import { renderSeoHead, robotsTxt, sitemapXml } from './seo';

export interface ClientOptions {
  /** 'vite' in development (middleware mode), 'static' to serve the built bundle, 'none' for API-only (tests). */
  mode: 'vite' | 'static' | 'none';
  distDir?: string;
}

export async function createApp(ctx: AppContext, client: ClientOptions = { mode: 'none' }): Promise<Express> {
  const { config, db } = ctx;
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY);

  app.use(
    helmet({
      contentSecurityPolicy:
        client.mode === 'vite'
          ? false // Vite injects inline scripts for HMR in development.
          : {
              useDefaults: true,
              directives: {
                'default-src': ["'self'"],
                'script-src': ["'self'"],
                'style-src': ["'self'", "'unsafe-inline'"],
                'img-src': ["'self'", 'data:', 'blob:'],
                'font-src': ["'self'", 'data:'],
                'connect-src': ["'self'"],
                'frame-ancestors': ["'none'"],
                'form-action': ["'self'"],
                'object-src': ["'none'"],
                'base-uri': ["'self'"],
              },
            },
      crossOriginEmbedderPolicy: false,
      strictTransportSecurity: config.isProd ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    next();
  });
  app.use(compression());
  app.use(cookieParser());

  // ------------------------------------------------------------------ API
  const api = express.Router();
  api.use(express.json({ limit: '100kb' }));
  api.use(
    rateLimit({
      windowMs: 60_000,
      limit: config.isTest ? 10_000 : 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: { code: 'rate_limited', message: 'Trop de requêtes. Ralentissez un peu.' } },
    }),
  );
  api.use(csrfGuard([config.APP_URL]));
  api.use(loadSession(db));
  api.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  api.get('/health', async (_req, res) => {
    try {
      await db.selectFrom('app_migrations').select('name').limit(1).execute();
      res.json({ status: 'ok', database: 'ok' });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'unreachable' });
    }
  });
  api.get('/meta', (_req, res) => {
    res.json({ ai: { gemini: ctx.ai.geminiEnabled, granite: ctx.ai.graniteEnabled }, emailDelivery: ctx.mailer.configured });
  });

  api.use('/auth', authRouter(ctx));
  api.use('/me', accountRouter(ctx));
  api.use('/chat', chatRouter(ctx));
  api.use('/admin', adminRouter(ctx));
  api.use('/', trainingRouter(ctx));
  api.use((_req, _res, next) => next(notFound('Route API inconnue.')));
  api.use(errorHandler);
  app.use('/api', api);

  // ------------------------------------------------------------------ SEO files
  app.get('/robots.txt', (_req, res) => res.type('text/plain').send(robotsTxt(config.APP_URL)));
  app.get('/sitemap.xml', (_req, res) => res.type('application/xml').send(sitemapXml(config.APP_URL)));

  // ------------------------------------------------------------------ Client
  if (client.mode === 'vite') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
    app.use(vite.middlewares);
    app.get('*', async (req, res, next) => {
      try {
        const raw = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        const template = await vite.transformIndexHtml(req.originalUrl, raw);
        const { html, status } = renderSeoHead(template, req.path, config.APP_URL);
        res.status(status).type('html').send(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else if (client.mode === 'static') {
    const distDir = client.distDir ?? path.resolve('dist');
    const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
    app.use(
      '/assets',
      express.static(path.join(distDir, 'assets'), { immutable: true, maxAge: '1y', index: false, fallthrough: false }),
    );
    app.use(express.static(distDir, { index: false, maxAge: '1d' }));
    app.get('*', (req, res) => {
      const { html, status } = renderSeoHead(template, req.path, config.APP_URL);
      res.setHeader('Cache-Control', 'no-cache');
      res.status(status).type('html').send(html);
    });
  }

  app.use(errorHandler);
  return app;
}
