/** Bundles the Node server into dist-server/server.mjs (cross-platform, no shell env syntax). */
import { build } from 'esbuild';

await build({
  entryPoints: ['server.ts'],
  outfile: 'dist-server/server.mjs',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  packages: 'external',
  sourcemap: true,
  // The production bundle defaults to production mode unless NODE_ENV is set explicitly.
  banner: { js: "process.env.NODE_ENV ??= 'production';" },
  logLevel: 'info',
});
