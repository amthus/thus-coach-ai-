import { PRIVATE_SEO, PUBLIC_ROUTES, SITE, findRouteSeo } from '../shared/seo';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function robotsTxt(appUrl: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /app',
    'Disallow: /admin',
    'Disallow: /api/',
    '',
    `Sitemap: ${appUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

export function sitemapXml(appUrl: string, lastmod = new Date().toISOString().slice(0, 10)): string {
  const urls = PUBLIC_ROUTES.filter((r) => r.sitemap)
    .map(
      (r) =>
        `  <url>\n    <loc>${appUrl}${r.path === '/' ? '/' : r.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${r.sitemap!.changefreq}</changefreq>\n    <priority>${r.sitemap!.priority.toFixed(1)}</priority>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Replaces the block between <!--seo:start--> and <!--seo:end--> in the HTML shell
 * with route-specific metadata (title, description, canonical, Open Graph, Twitter, robots).
 */
export function renderSeoHead(template: string, pathname: string, appUrl: string): { html: string; status: number } {
  const route = findRouteSeo(pathname);
  const isPrivate = /^\/(app|admin)(\/|$)/.test(pathname);
  const known = Boolean(route) || isPrivate;
  const meta = route ?? (isPrivate ? { ...PRIVATE_SEO, path: pathname } : { title: 'Page introuvable | ThusStride', description: SITE.defaultDescription, index: false, path: pathname });
  const canonical = `${appUrl}${route ? (route.path === '/' ? '/' : route.path) : pathname}`;
  const title = escapeHtml(meta.title);
  const desc = escapeHtml(meta.description);
  const image = `${appUrl}${SITE.ogImage}`;

  const head = [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}" />`,
    `<meta name="robots" content="${meta.index ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:locale" content="${SITE.locale}" />`,
    `<meta property="og:locale:alternate" content="en_US" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${SITE.name} - ${escapeHtml(SITE.tagline)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');

  const html = template
    .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n    ${head}\n    <!--seo:end-->`)
    .replace(/__APP_URL__/g, appUrl);
  return { html, status: known ? 200 : 404 };
}
