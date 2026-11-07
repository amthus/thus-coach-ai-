import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { AuthCard } from './AuthCard';
import { Alert, Button, Input } from '../../components/ui/primitives';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { api, ApiError } from '../../lib/api';

export default function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const mutation = useMutation({ mutationFn: (e: string) => api.post('/auth/forgot-password', { email: e }) });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate(email);
  };

  return (
    <AuthCard
      title={t('Mot de passe oublié', 'Forgot password')}
      subtitle={t('Recevez un lien pour choisir un nouveau mot de passe.', 'Get a link to choose a new password.')}
      footer={
        <Link to="/connexion" className="text-lime hover:underline">
          ← {t('Retour à la connexion', 'Back to sign in')}
        </Link>
      }
    >
      <Seo title={t('Mot de passe oublié | ThusStride', 'Forgot password | ThusStride')} noindex />
      {mutation.isSuccess ? (
        <Alert tone="success">
          {t(
            'Si un compte existe pour cette adresse, un e-mail contenant un lien valable 1 heure vient d’être envoyé. Pensez à vérifier vos courriers indésirables.',
            'If an account exists for this address, an e-mail with a link valid for 1 hour has been sent. Check your spam folder.',
          )}
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {mutation.error && <Alert tone="error">{mutation.error instanceof ApiError ? mutation.error.message : t('Une erreur est survenue.', 'Something went wrong.')}</Alert>}
          <Input label={t('Adresse e-mail', 'E-mail address')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" className="w-full" size="lg" loading={mutation.isPending} disabled={!email}>
            {t('Envoyer le lien', 'Send the link')}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
