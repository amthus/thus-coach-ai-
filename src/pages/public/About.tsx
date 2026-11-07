import { Link } from 'react-router';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { PUBLIC_ROUTES } from '../../../shared/seo';

const seo = PUBLIC_ROUTES.find((r) => r.path === '/a-propos')!;
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ThusStride',
  founder: { '@type': 'Person', name: 'Malthus Ametepe' },
  brand: 'ThusDev',
};

export default function About() {
  const { t } = useI18n();
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Seo
        title={seo.title}
        description={seo.description}
        jsonLd={JSON_LD}
      />
      <h1 className="font-display text-4xl font-bold tracking-tight">{t('Notre mission', 'Our mission')}</h1>
      <p className="mt-6 text-lg leading-relaxed text-white/70">
        {t(
          "Rendre l'entraînement scientifique accessible à chaque coureur, quel que soit son niveau ou son budget, pour que courir reste un plaisir durable et non une source de blessures.",
          'Make science-based training accessible to every runner, whatever their level or budget, so that running remains a lasting pleasure rather than a source of injury.',
        )}
      </p>
      <h2 className="mt-12 font-display text-2xl font-semibold">{t('Nos principes', 'Our principles')}</h2>
      <ul className="mt-4 space-y-4 text-white/70">
        <li>
          <strong className="text-white">{t('La science d’abord.', 'Science first.')}</strong>{' '}
          {t(
            'Karvonen, distribution 80/20, progression maîtrisée : nos recommandations reposent sur des méthodes reconnues en physiologie de l’effort.',
            'Karvonen, 80/20 distribution, controlled progression: our guidance relies on established exercise-physiology methods.',
          )}
        </li>
        <li>
          <strong className="text-white">{t('La transparence.', 'Transparency.')}</strong>{' '}
          {t(
            "Chaque plan et chaque conseil indique sa source réelle : modèle d'IA utilisé ou moteur de règles.",
            'Every plan and piece of advice shows its real source: the AI model used or the rules engine.',
          )}
        </li>
        <li>
          <strong className="text-white">{t('Le respect de vos données.', 'Respect for your data.')}</strong>{' '}
          {t(
            'Minimisation, consentement explicite pour les données de santé, aucune revente, export et suppression à tout moment.',
            'Minimisation, explicit consent for health data, no resale, export and deletion at any time.',
          )}
        </li>
        <li>
          <strong className="text-white">{t('La prudence.', 'Caution.')}</strong>{' '}
          {t(
            'ThusStride est un outil d’entraînement : il ne remplace ni un médecin ni un kinésithérapeute.',
            'ThusStride is a training tool: it does not replace a doctor or a physiotherapist.',
          )}
        </li>
      </ul>
      <h2 className="mt-12 font-display text-2xl font-semibold">{t('Qui sommes-nous ?', 'Who are we?')}</h2>
      <p className="mt-4 text-white/70">
        {t(
          'ThusStride est conçu et développé par ThusDev, le studio de Malthus Ametepe, passionné de course à pied et d’ingénierie logicielle.',
          'ThusStride is designed and built by ThusDev, the studio of Malthus Ametepe, passionate about running and software engineering.',
        )}
      </p>
      <Link to="/inscription" className="mt-10 inline-block rounded-xl bg-lime px-6 py-3.5 font-semibold text-black hover:bg-white">
        {t('Rejoindre ThusStride', 'Join ThusStride')}
      </Link>
    </article>
  );
}
