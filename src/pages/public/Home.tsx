import { Link } from 'react-router';
import { Activity, ArrowRight, BookOpen, CalendarDays, HeartPulse, MessageSquare, ShieldCheck } from 'lucide-react';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { PUBLIC_ROUTES } from '../../../shared/seo';

const seo = PUBLIC_ROUTES.find((r) => r.path === '/')!;
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ThusStride',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  description: seo.description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  inLanguage: ['fr', 'en'],
};

export default function Home() {
  const { t } = useI18n();

  const features = [
    {
      icon: CalendarDays,
      title: t('Un plan qui vous ressemble', 'A plan that fits you'),
      text: t(
        "4 semaines construites sur votre âge, votre niveau, vos disponibilités et vos antécédents. Progression ≤ 10 % par semaine et semaine d'assimilation.",
        '4 weeks built on your age, level, availability and history. Progression ≤ 10 % per week with a recovery week.',
      ),
    },
    {
      icon: HeartPulse,
      title: t('Vos vraies zones cardiaques', 'Your real heart-rate zones'),
      text: t(
        'Méthode de Karvonen à partir de votre FC de repos : fini les footings trop rapides qui fatiguent sans faire progresser.',
        'Karvonen method from your resting heart rate: no more easy runs done too fast.',
      ),
    },
    {
      icon: Activity,
      title: t('Charge ajustée à votre fatigue', 'Load adjusted to your fatigue'),
      text: t(
        'Après chaque séance, notez votre fatigue : ThusStride recommande immédiatement comment adapter les jours suivants.',
        'After each session, log your fatigue: ThusStride immediately recommends how to adapt the next days.',
      ),
    },
    {
      icon: MessageSquare,
      title: t('Un coach disponible 24 h/24', 'A coach available 24/7'),
      text: t(
        'Trois personnalités de coach pour répondre à vos questions sur l’allure, la récupération, la nutrition ou l’équipement.',
        'Three coach personalities answer your questions on pace, recovery, nutrition or gear.',
      ),
    },
    {
      icon: BookOpen,
      title: t('Journal et progression', 'Log and progress'),
      text: t(
        'Durée, distance, FC moyenne, ressenti : visualisez votre volume hebdomadaire et votre régularité.',
        'Duration, distance, average HR, feeling: see your weekly volume and consistency.',
      ),
    },
    {
      icon: ShieldCheck,
      title: t('Vos données protégées', 'Your data protected'),
      text: t(
        'Données de santé traitées avec votre consentement explicite, export et suppression en un clic (RGPD).',
        'Health data processed with your explicit consent, one-click export and deletion (GDPR).',
      ),
    },
  ];

  const steps = [
    { n: '01', title: t('Créez votre compte', 'Create your account'), text: t('Gratuit, en moins d’une minute.', 'Free, in under a minute.') },
    { n: '02', title: t('Décrivez votre profil', 'Describe your profile'), text: t('Niveau, objectif, fréquence, douleurs éventuelles.', 'Level, goal, frequency, any pain.') },
    { n: '03', title: t('Courez et notez', 'Run and log'), text: t('Votre plan s’ajuste à votre ressenti.', 'Your plan adapts to how you feel.') },
  ];

  return (
    <>
      <Seo
        title={seo.title}
        description={seo.description}
        jsonLd={JSON_LD}
      />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(204,255,0,0.12),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-medium text-lime">
            {t('Coach de course à pied intelligent', 'Smart running coach')}
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            {t('Progressez en course à pied', 'Improve your running')} <span className="text-lime">{t('sans vous blesser', 'without getting injured')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/60 sm:text-lg">
            {t(
              "ThusStride crée votre plan d'entraînement personnalisé, calcule vos zones cardiaques et ajuste la charge selon votre fatigue réelle.",
              'ThusStride builds your personalised training plan, computes your heart-rate zones and adjusts the load to your actual fatigue.',
            )}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/inscription"
              className="inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3.5 font-semibold text-black shadow-[0_0_40px_rgba(204,255,0,0.25)] hover:bg-white"
            >
              {t('Créer mon plan gratuit', 'Create my free plan')} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/fonctionnalites" className="rounded-xl border border-white/15 px-6 py-3.5 font-medium text-white/80 hover:border-white/30 hover:text-white">
              {t('Découvrir les fonctionnalités', 'Explore features')}
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/40">
            {t('Gratuit · Sans carte bancaire · Données hébergées de façon sécurisée', 'Free · No credit card · Securely hosted data')}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="pourquoi">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="pourquoi" className="font-display text-3xl font-bold tracking-tight">
            {t('Le problème que nous résolvons', 'The problem we solve')}
          </h2>
          <p className="mt-4 text-white/60">
            {t(
              "Une large part des coureurs amateurs se blessent dans leur première année, souvent parce qu'ils courent trop vite en endurance et augmentent leur volume trop brutalement. Un plan statique téléchargé ne tient compte ni de votre physiologie, ni de votre fatigue du jour.",
              'A large share of amateur runners get injured in their first year, often because they run easy runs too fast and ramp up volume too abruptly. A static downloaded plan ignores your physiology and how tired you are today.',
            )}
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article key={f.title} className="rounded-2xl border border-white/10 bg-panel p-6">
              <f.icon className="h-6 w-6 text-lime" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/5 bg-panel/50" aria-labelledby="comment">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="comment" className="text-center font-display text-3xl font-bold tracking-tight">
            {t('Comment ça marche', 'How it works')}
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="rounded-2xl border border-white/10 p-6">
                <span className="font-mono text-sm text-lime">{s.n}</span>
                <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/60">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t('Prêt pour votre prochaine foulée ?', 'Ready for your next stride?')}</h2>
        <p className="mt-4 text-white/60">{t('Votre plan personnalisé est à une minute.', 'Your personalised plan is one minute away.')}</p>
        <Link to="/inscription" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3.5 font-semibold text-black hover:bg-white">
          {t('Commencer maintenant', 'Get started')} <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  );
}
