/**
 * SEO metadata for public routes. Used by the client (<title>/<meta> per page) and by the
 * server, which injects it into the HTML shell so crawlers and social previews get
 * correct metadata without executing JavaScript.
 */
export const SITE = {
  name: 'ThusStride',
  tagline: 'Coach de course à pied intelligent',
  defaultDescription:
    "ThusStride crée votre plan d'entraînement de course à pied personnalisé, calcule vos zones cardiaques (méthode de Karvonen), suit vos séances et ajuste la charge selon votre fatigue grâce à un coach IA.",
  locale: 'fr_FR',
  themeColor: '#0A0A0A',
  ogImage: '/og-image.png',
  author: 'Malthus Ametepe – ThusDev',
};

export interface RouteSeo {
  path: string;
  title: string;
  description: string;
  index: boolean;
  /** Included in sitemap.xml */
  sitemap?: { changefreq: 'weekly' | 'monthly' | 'yearly'; priority: number };
}

export const PUBLIC_ROUTES: RouteSeo[] = [
  {
    path: '/',
    title: "ThusStride – Coach de course à pied IA et plan d'entraînement personnalisé",
    description: SITE.defaultDescription,
    index: true,
    sitemap: { changefreq: 'weekly', priority: 1 },
  },
  {
    path: '/fonctionnalites',
    title: 'Fonctionnalités – Plans, zones cardiaques et coach IA | ThusStride',
    description:
      "Plan de 4 semaines adapté à votre niveau, zones de fréquence cardiaque Karvonen, journal d'entraînement, calibration de la charge selon la fatigue et calculateur d'allure.",
    index: true,
    sitemap: { changefreq: 'monthly', priority: 0.9 },
  },
  {
    path: '/a-propos',
    title: 'À propos – Notre mission | ThusStride',
    description:
      "ThusStride rend l'entraînement de course à pied scientifique accessible à tous pour progresser sans se blesser.",
    index: true,
    sitemap: { changefreq: 'yearly', priority: 0.6 },
  },
  {
    path: '/faq',
    title: 'Questions fréquentes | ThusStride',
    description:
      "Réponses aux questions sur ThusStride : création du plan, données de santé, intelligence artificielle, sécurité et suppression du compte.",
    index: true,
    sitemap: { changefreq: 'monthly', priority: 0.7 },
  },
  { path: '/connexion', title: 'Connexion | ThusStride', description: 'Connectez-vous à votre espace ThusStride.', index: false },
  {
    path: '/inscription',
    title: 'Créer un compte gratuit | ThusStride',
    description: "Créez votre compte ThusStride et obtenez votre plan d'entraînement de course à pied personnalisé.",
    index: true,
    sitemap: { changefreq: 'yearly', priority: 0.8 },
  },
  { path: '/mot-de-passe-oublie', title: 'Mot de passe oublié | ThusStride', description: 'Réinitialisez votre mot de passe ThusStride.', index: false },
  { path: '/reinitialiser-mot-de-passe', title: 'Nouveau mot de passe | ThusStride', description: 'Choisissez un nouveau mot de passe.', index: false },
  {
    path: '/confidentialite',
    title: 'Politique de confidentialité | ThusStride',
    description: 'Comment ThusStride collecte, utilise et protège vos données personnelles et de santé (RGPD).',
    index: true,
    sitemap: { changefreq: 'yearly', priority: 0.3 },
  },
  {
    path: '/conditions-utilisation',
    title: "Conditions générales d'utilisation | ThusStride",
    description: "Conditions générales d'utilisation de la plateforme ThusStride.",
    index: true,
    sitemap: { changefreq: 'yearly', priority: 0.3 },
  },
  {
    path: '/mentions-legales',
    title: 'Mentions légales | ThusStride',
    description: 'Mentions légales de la plateforme ThusStride.',
    index: true,
    sitemap: { changefreq: 'yearly', priority: 0.2 },
  },
  {
    path: '/cookies',
    title: 'Politique de cookies | ThusStride',
    description: 'ThusStride utilise uniquement un cookie strictement nécessaire à la connexion.',
    index: true,
    sitemap: { changefreq: 'yearly', priority: 0.2 },
  },
];

export const PRIVATE_SEO: Pick<RouteSeo, 'title' | 'description' | 'index'> = {
  title: 'Mon espace | ThusStride',
  description: 'Espace personnel ThusStride.',
  index: false,
};

export function findRouteSeo(pathname: string): RouteSeo | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return PUBLIC_ROUTES.find((r) => r.path === clean) ?? null;
}
