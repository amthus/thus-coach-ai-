import { LEGAL, LegalPage } from './LegalPage';
import { useI18n } from '../../lib/i18n';

export default function LegalNotice() {
  const { t } = useI18n();
  return (
    <LegalPage path="/mentions-legales" title={t('Mentions légales', 'Legal notice')}>
      <h2>{t('Éditeur', 'Publisher')}</h2>
      <p>
        {LEGAL.publisher}
        <br />
        {t('Contact :', 'Contact:')} <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
        <br />
        {t('Directeur de la publication : Malthus Ametepe', 'Publication director: Malthus Ametepe')}
      </p>
      <h2>{t('Hébergement', 'Hosting')}</h2>
      <p>{LEGAL.host}</p>
      <h2>{t('Propriété intellectuelle', 'Intellectual property')}</h2>
      <p>
        {t(
          "La marque ThusStride, son logo, son interface et ses contenus sont protégés. Toute reproduction sans autorisation est interdite. Le code source est distribué sous licence Apache 2.0.",
          'The ThusStride brand, logo, interface and content are protected. Any reproduction without permission is prohibited. Source code is distributed under the Apache 2.0 licence.',
        )}
      </p>
      <h2>{t('Signalement', 'Reporting')}</h2>
      <p>
        {t('Pour signaler un contenu ou une faille de sécurité, écrivez à ', 'To report content or a security vulnerability, write to ')}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
    </LegalPage>
  );
}
