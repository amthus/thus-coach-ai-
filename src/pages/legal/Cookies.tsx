import { LegalPage } from './LegalPage';
import { useI18n } from '../../lib/i18n';

export default function Cookies() {
  const { t } = useI18n();
  return (
    <LegalPage path="/cookies" title={t('Politique de cookies', 'Cookie policy')}>
      <p>
        {t(
          "ThusStride n'utilise aucun cookie publicitaire, de mesure d'audience ou de réseau social. C'est pourquoi aucun bandeau de consentement ne vous est présenté : seuls des traceurs strictement nécessaires, exemptés de consentement (article 82 de la loi Informatique et Libertés), sont utilisés.",
          'ThusStride uses no advertising, analytics or social-network cookies. This is why no consent banner is shown: only strictly necessary trackers, exempt from consent, are used.',
        )}
      </p>
      <h2>{t('Cookie utilisé', 'Cookie used')}</h2>
      <ul>
        <li>
          <strong>ts_session</strong> –{' '}
          {t(
            'maintient votre connexion. HttpOnly, Secure, SameSite=Lax. Durée : 30 jours maximum, supprimé à la déconnexion.',
            'keeps you signed in. HttpOnly, Secure, SameSite=Lax. Lifetime: 30 days maximum, removed on sign-out.',
          )}
        </li>
      </ul>
      <h2>{t('Stockage local', 'Local storage')}</h2>
      <ul>
        <li>
          <strong>ts_language</strong> – {t('mémorise la langue choisie.', 'remembers the chosen language.')}
        </li>
        <li>
          <strong>ts_reminder_*</strong> – {t('évite d’afficher deux fois le rappel quotidien.', 'prevents showing the daily reminder twice.')}
        </li>
      </ul>
      <p>{t('Les polices de caractères sont hébergées par ThusStride : aucune requête n’est envoyée à des services tiers lors de votre navigation.', 'Fonts are self-hosted: no request is sent to third-party services while you browse.')}</p>
    </LegalPage>
  );
}
