import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { SITE } from '../../shared/seo';

interface SeoProps {
  title: string;
  description?: string;
  noindex?: boolean;
  /** Optional JSON-LD structured data for this page. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

/**
 * Keeps <head> in sync during client-side navigation. The server already injects the
 * same metadata on first load for crawlers (see server/seo.ts).
 */
export function Seo({ title, description = SITE.defaultDescription, noindex = false, jsonLd }: SeoProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    const url = `${window.location.origin}${pathname === '/' ? '/' : pathname}`;
    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [title, description, noindex, pathname]);

  useEffect(() => {
    if (!jsonLd) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.page = 'true';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => script.remove();
  }, [jsonLd]);

  return null;
}
