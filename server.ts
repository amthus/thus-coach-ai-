/**
 * ThusStride - HTTP server entry point (development and self-hosted production).
 * For Vercel, see api/index.ts.
 */
import path from 'node:path';
import { bootstrap } from './server/bootstrap';
import { config } from './server/config';

async function main() {
  const { app, ctx } = await bootstrap(
    config.isProd ? { mode: 'static', distDir: path.resolve('dist') } : { mode: 'vite' },
  );

  const server = app.listen(config.PORT, '0.0.0.0', () => {
    console.info(`ThusStride listening on http://localhost:${config.PORT} (${config.NODE_ENV})`);
    console.info(`Database: ${config.DATABASE_URL ? 'PostgreSQL' : `SQLite (${config.SQLITE_PATH})`}`);
    console.info(`AI providers: gemini=${ctx.ai.geminiEnabled} granite=${ctx.ai.graniteEnabled}`);
  });

  const shutdown = (signal: string) => {
    console.info(`${signal} received, shutting down…`);
    server.close(async () => {
      await ctx.db.destroy();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
