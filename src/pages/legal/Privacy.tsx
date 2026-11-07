import { Link } from 'react-router';
import { LEGAL, LegalPage } from './LegalPage';
import { useI18n } from '../../lib/i18n';

export default function Privacy() {
  const { t } = useI18n();
  return (
    <LegalPage path="/confidentialite" title={t('Politique de confidentialité', 'Privacy policy')}>
      <p>
        {t(
          `ThusStride respecte le Règlement général sur la protection des données (RGPD - UE 2016/679) et la loi Informatique et Libertés. Le responsable du traitement est ${LEGAL.publisher}, joignable à ${LEGAL.contactEmail}.`,
          `ThusStride complies with the General Data Protection Regulation (GDPR - EU 2016/679). The data controller is ${LEGAL.publisher}, reachable at ${LEGAL.contactEmail}.`,
        )}
      </p>

      <h2>{t('1. Données collectées', '1. Data we collect')}</h2>
      <ul>
        <li>{t('Compte : prénom, adresse e-mail, mot de passe (stocké uniquement sous forme de hachage scrypt), langue, préférences de rappel.', 'Account: first name, e-mail, password (stored only as a scrypt hash), language, reminder preferences.')}</li>
        <li>{t('Profil athlète (données de santé) : âge, niveau, fréquence et distance habituelles, objectif, antécédents de douleurs, FC de repos et FC max, poids.', 'Athlete profile (health data): age, level, usual frequency and distance, goal, pain history, resting and max heart rate, weight.')}</li>
        <li>{t("Activité : plans générés, séances réalisées, fatigue ressentie, FC moyenne, notes, messages échangés avec le coach.", 'Activity: generated plans, completed sessions, perceived fatigue, average HR, notes, messages exchanged with the coach.')}</li>
        <li>{t('Données techniques : date de dernière connexion, navigateur utilisé pour chaque session (pour la sécurité).', 'Technical data: last login date, browser used for each session (for security).')}</li>
      </ul>
      <p>{t('Nous ne collectons aucune donnée de géolocalisation et n’utilisons aucun traceur publicitaire ni outil de mesure d’audience tiers.', 'We collect no geolocation data and use no advertising trackers or third-party analytics.')}</p>

      <h2>{t('2. Finalités et bases légales', '2. Purposes and legal bases')}</h2>
      <ul>
        <li>{t('Fourniture du service (compte, plans, journal, coach) - exécution du contrat (art. 6.1.b).', 'Providing the service (account, plans, log, coach) - performance of contract (art. 6.1.b).')}</li>
        <li>{t('Traitement des données de santé - consentement explicite (art. 9.2.a), recueilli à l’inscription.', 'Processing of health data - explicit consent (art. 9.2.a), collected at sign-up.')}</li>
        <li>{t('Sécurité (limitation des tentatives, journaux d’erreurs) - intérêt légitime (art. 6.1.f).', 'Security (rate limiting, error logs) - legitimate interest (art. 6.1.f).')}</li>
      </ul>

      <h2>{t('3. Destinataires et sous-traitants', '3. Recipients and processors')}</h2>
      <ul>
        <li>{t(`Hébergement : ${LEGAL.host}.`, `Hosting: ${LEGAL.host}.`)}</li>
        <li>
          {t(
            "Intelligence artificielle : lorsque vous générez un plan, demandez un ajustement ou écrivez au coach, les informations nécessaires (profil, séance, message) sont transmises à Google (Gemini API) ou à IBM (watsonx.ai) uniquement pour produire la réponse. Aucun nom de famille ni adresse e-mail n'est transmis.",
            'Artificial intelligence: when you generate a plan, request an adjustment or message the coach, the necessary information (profile, session, message) is sent to Google (Gemini API) or IBM (watsonx.ai) solely to produce the answer. No surname or e-mail address is sent.',
          )}
        </li>
        <li>{t("Envoi d'e-mails transactionnels (réinitialisation du mot de passe) via notre prestataire SMTP.", 'Transactional e-mails (password reset) via our SMTP provider.')}</li>
      </ul>
      <p>
        {t(
          "Certains prestataires peuvent être situés hors de l'Union européenne ; les transferts sont encadrés par les clauses contractuelles types de la Commission européenne ou le Data Privacy Framework.",
          'Some providers may be located outside the EU; transfers are covered by the European Commission standard contractual clauses or the Data Privacy Framework.',
        )}
      </p>
      <p>{t('Vos données ne sont jamais vendues.', 'Your data is never sold.')}</p>

      <h2>{t('4. Durées de conservation', '4. Retention')}</h2>
      <ul>
        <li>{t('Compte et données associées : jusqu’à la suppression du compte par vous-même.', 'Account and related data: until you delete your account.')}</li>
        <li>{t('Sessions de connexion : 30 jours maximum.', 'Login sessions: 30 days maximum.')}</li>
        <li>{t('Liens de réinitialisation du mot de passe : 1 heure, usage unique.', 'Password reset links: 1 hour, single use.')}</li>
      </ul>

      <h2>{t('5. Sécurité', '5. Security')}</h2>
      <p>
        {t(
          "Connexion chiffrée (HTTPS/HSTS), mots de passe hachés avec scrypt, cookie de session HttpOnly et SameSite, protection contre la falsification de requêtes, limitation du nombre de tentatives, en-têtes de sécurité stricts et cloisonnement des données par compte.",
          'Encrypted connection (HTTPS/HSTS), scrypt-hashed passwords, HttpOnly SameSite session cookie, request-forgery protection, rate limiting, strict security headers and per-account data isolation.',
        )}
      </p>

      <h2>{t('6. Vos droits', '6. Your rights')}</h2>
      <p>
        {t(
          'Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité, ainsi que du droit de retirer votre consentement à tout moment. Depuis ',
          'You have the rights of access, rectification, erasure, restriction, objection and portability, and may withdraw your consent at any time. From ',
        )}
        <Link to="/app/parametres">{t('Paramètres', 'Settings')}</Link>
        {t(
          ', vous pouvez exporter toutes vos données (JSON) et supprimer définitivement votre compte. Pour toute autre demande : ',
          ', you can export all your data (JSON) and permanently delete your account. For any other request: ',
        )}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
      <p>
        {t('Vous pouvez également introduire une réclamation auprès de la CNIL (', 'You may also lodge a complaint with your supervisory authority, e.g. the CNIL (')}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
          cnil.fr
        </a>
        ).
      </p>

      <h2>{t('7. Mineurs', '7. Minors')}</h2>
      <p>{t('Le service est réservé aux personnes âgées de 15 ans et plus (âge du consentement numérique en France).', 'The service is reserved for people aged 15 and over.')}</p>
    </LegalPage>
  );
}
