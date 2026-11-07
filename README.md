<p align="center"><img src="public/logo.svg" alt="ThusStride" height="56" /></p>

# ThusStride

**Coach de course à pied intelligent** : plan d'entraînement personnalisé, zones cardiaques (Karvonen), journal d'entraînement, ajustement de la charge selon la fatigue et coach IA — dans un espace personnel sécurisé.

## Fonctionnalités

| Espace | Pages |
| --- | --- |
| Public | Accueil, Fonctionnalités, À propos, FAQ, Connexion, Inscription, Mot de passe oublié / réinitialisation, Confidentialité, CGU, Mentions légales, Cookies, 404 |
| Athlète (`/app`) | Onboarding, Tableau de bord, Mon plan (calendrier, historique, export, impression), Coach IA, Journal (CSV), Physiologie & nutrition, Outils (allure, prédiction Riegel, chronomètre), Profil athlète, Paramètres (rappels, mot de passe, export RGPD, suppression du compte) |
| Administration (`/admin`) | Indicateurs plateforme, état des services, gestion des rôles (sans accès aux données de santé) |

- **Plans** : générés par Google Gemini ou IBM Granite (sortie validée par schéma), sinon par un **moteur de règles scientifiques** déterministe (progression ≤ 10 %/semaine, semaine d'assimilation, aucune séance intense en cas de douleur). La source réelle est toujours affichée.
- **Physiologie** : FC max (Tanaka ou mesurée), zones Karvonen, VO2max (Uth–Sørensen) uniquement si la FC de repos est mesurée.
- **Suivi** : validation des séances, fatigue (RPE 1–10), durée/distance/FC réelles, recommandation de charge, statistiques sur 8 semaines, série en cours.
- **Rappels** : notification quotidienne à l'heure choisie (navigateur).

## Architecture

```
server.ts            Point d'entrée Node (dev : Vite en middleware, prod : fichiers statiques)
api/index.ts         Point d'entrée serverless Vercel
server/
  app.ts             Express : helmet/CSP, compression, rate limiting, CSRF, routes, SEO
  config.ts          Variables d'environnement validées (zod)
  db/                Kysely – PostgreSQL (prod) ou SQLite intégré à Node (dev/tests), migrations
  middleware/auth.ts Sessions (cookie HttpOnly, jeton haché en base), rôles, CSRF
  routes/            auth, account (profil, paramètres, export, suppression), training, chat, admin
  services/          ai (Gemini / watsonx), planEngine (règles), mailer (SMTP)
  seo.ts             Métadonnées par route injectées dans le HTML, robots.txt, sitemap.xml
shared/              Schémas zod, types, physiologie, coachs, SEO — partagés client/serveur
src/
  app/               Routeur (pages chargées à la demande) et gardes d'accès
  layouts/           Public, espace connecté
  pages/             public, auth, legal, app, admin
  components/        UI (primitives, toasts, logo), plan, physiologie, formulaires
  lib/               Client API, React Query, i18n FR/EN, SEO, notifications
tests/               Vitest + supertest (API, sécurité, isolation des données, domaine)
```

## Démarrage

Prérequis : **Node.js ≥ 22.5**.

```bash
npm install
cp .env.example .env
npm run dev
```

L'application tourne sur http://localhost:3000. Sans `DATABASE_URL`, une base SQLite locale est créée dans `.data/`. Sans clé d'IA, les plans et conseils viennent du moteur de règles et le chat coach indique qu'il est indisponible.

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement (HMR) |
| `npm run lint` | Vérification TypeScript stricte |
| `npm test` | Tests (API, sécurité, domaine) |
| `npm run build` | Build client (`dist/`) et serveur (`dist-server/`) |
| `npm start` | Lancement en production |
| `npm run assets` | Régénère icônes, image Open Graph et images optimisées |

## Production

1. Créez une base **PostgreSQL** (Neon, Supabase, RDS…) et renseignez `DATABASE_URL` (`DATABASE_SSL=true` si requis). Les migrations s'appliquent au démarrage.
2. Renseignez `APP_URL` (domaine public, utilisé pour les URL canoniques, le sitemap et les e-mails), `ADMIN_EMAILS`, `SMTP_URL`, et au moins une clé d'IA (`GEMINI_API_KEY` et/ou `IBM_WATSONX_*`).
3. Renseignez `VITE_CONTACT_EMAIL` et `VITE_LEGAL_PUBLISHER` (mentions légales) **avant le build**.
4. Déployez : Vercel (`vercel.json` fourni) ou tout hébergeur Node (`npm run build && npm start`).

## Sécurité et conformité

- Mots de passe hachés avec **scrypt** (paramètres OWASP), comparaison en temps constant, pas d'énumération de comptes.
- Session par cookie `HttpOnly`, `Secure`, `SameSite=Lax` ; jeton stocké haché ; révocation à la réinitialisation / au changement de mot de passe.
- Protection CSRF (JSON obligatoire + vérification de l'origine), limitation de débit (authentification, IA, API).
- En-têtes : CSP stricte, HSTS, `frame-ancestors 'none'`, `Permissions-Policy`, `nosniff`.
- Toutes les entrées validées par zod ; cloisonnement strict des données par compte (testé).
- **RGPD** : consentement explicite aux données de santé, export JSON, suppression définitive, politique de confidentialité, un seul cookie strictement nécessaire, polices auto-hébergées (aucune requête tierce).
- Entrées utilisateur nettoyées avant insertion dans les prompts IA.

## SEO

Métadonnées par page injectées côté serveur (titre, description, canonical, Open Graph, Twitter, robots), `sitemap.xml` et `robots.txt` dynamiques, données structurées JSON-LD (Organization, WebSite, SoftwareApplication, FAQPage), manifeste PWA, icônes et image de partage 1200×630, vraies réponses 404, pages privées en `noindex`.

## Licence

Apache-2.0 — conçu par ThusDev (Malthus Ametepe).
