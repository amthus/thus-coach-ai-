import { useMemo } from 'react';
import { Link } from 'react-router';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { PUBLIC_ROUTES } from '../../../shared/seo';

const seo = PUBLIC_ROUTES.find((r) => r.path === '/faq')!;

export default function Faq() {
  const { t } = useI18n();
  const items = useMemo(
    () => [
      {
        q: t('ThusStride est-il gratuit ?', 'Is ThusStride free?'),
        a: t('Oui, la création de compte et toutes les fonctionnalités actuelles sont gratuites.', 'Yes, signing up and all current features are free.'),
      },
      {
        q: t('Comment mon plan est-il créé ?', 'How is my plan created?'),
        a: t(
          "À partir de votre profil (âge, niveau, fréquence, distance habituelle, objectif, douleurs). Un modèle d'IA (Google Gemini ou IBM Granite) propose le plan, qui est ensuite vérifié. Si aucun modèle n'est disponible ou si la réponse est invalide, notre moteur de règles scientifiques génère le plan. La source est toujours affichée.",
          'From your profile (age, level, frequency, usual distance, goal, pain). An AI model (Google Gemini or IBM Granite) drafts the plan, which is then validated. If no model is available or the answer is invalid, our science-based rules engine builds it. The source is always shown.',
        ),
      },
      {
        q: t('Comment sont calculées mes zones cardiaques ?', 'How are my heart-rate zones computed?'),
        a: t(
          'Avec la méthode de Karvonen : FC cible = FC repos + % × (FC max - FC repos). Si vous ne connaissez pas votre FC max, elle est estimée par la formule de Tanaka (208 - 0,7 × âge).',
          'Using the Karvonen method: target HR = resting HR + % × (max HR - resting HR). If you do not know your max HR, it is estimated with the Tanaka formula (208 - 0.7 × age).',
        ),
      },
      {
        q: t('ThusStride remplace-t-il un médecin ?', 'Does ThusStride replace a doctor?'),
        a: t(
          'Non. ThusStride fournit des conseils d’entraînement généraux. En cas de douleur, de maladie ou de doute, consultez un professionnel de santé avant de courir.',
          'No. ThusStride provides general training guidance. In case of pain, illness or doubt, consult a health professional before running.',
        ),
      },
      {
        q: t('Que faites-vous de mes données de santé ?', 'What do you do with my health data?'),
        a: t(
          'Elles servent uniquement à personnaliser votre entraînement, avec votre consentement explicite. Elles ne sont ni vendues ni utilisées pour de la publicité. Les textes envoyés au coach IA sont transmis au fournisseur d’IA uniquement pour générer la réponse.',
          'They are used only to personalise your training, with your explicit consent. They are never sold or used for advertising. Text sent to the AI coach is forwarded to the AI provider solely to generate the answer.',
        ),
      },
      {
        q: t('Puis-je récupérer ou supprimer mes données ?', 'Can I download or delete my data?'),
        a: t(
          'Oui, depuis Paramètres : export complet au format JSON et suppression définitive du compte et de toutes les données associées.',
          'Yes, from Settings: full JSON export and permanent deletion of the account and all related data.',
        ),
      },
      {
        q: t('Les rappels fonctionnent-ils téléphone verrouillé ?', 'Do reminders work with the phone locked?'),
        a: t(
          "Les rappels sont des notifications du navigateur affichées lorsque ThusStride est ouvert (onglet ou application installée). Autorisez les notifications dans Paramètres.",
          'Reminders are browser notifications shown while ThusStride is open (tab or installed app). Allow notifications in Settings.',
        ),
      },
    ],
    [t],
  );

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
    }),
    [items],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Seo title={seo.title} description={seo.description} jsonLd={jsonLd} />
      <h1 className="font-display text-4xl font-bold tracking-tight">{t('Questions fréquentes', 'Frequently asked questions')}</h1>
      <div className="mt-10 divide-y divide-white/10 rounded-2xl border border-white/10 bg-panel">
        {items.map((i) => (
          <details key={i.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium">
              <h2 className="text-base">{i.q}</h2>
              <span className="text-lime transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-white/60">{i.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-white/50">
        {t('Une autre question ?', 'Another question?')}{' '}
        <Link to="/mentions-legales" className="text-lime underline">
          {t('Contactez-nous', 'Contact us')}
        </Link>
      </p>
    </div>
  );
}
