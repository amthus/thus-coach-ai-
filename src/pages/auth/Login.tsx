import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { AuthCard } from './AuthCard';
import { Alert, Button, Input } from '../../components/ui/primitives';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { useLogin } from '../../lib/queries';
import { ApiError } from '../../lib/api';

export default function Login() {
  const { t } = useI18n();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
    // On success GuestOnly redirects to ?next or /app.
  };

  const error = login.error instanceof ApiError ? login.error.message : login.error ? t('Une erreur est survenue.', 'Something went wrong.') : null;

  return (
    <AuthCard
      title={t('Bon retour !', 'Welcome back!')}
      subtitle={t('Connectez-vous à votre espace ThusStride.', 'Sign in to your ThusStride space.')}
      footer={
        <>
          {t('Pas encore de compte ?', 'No account yet?')}{' '}
          <Link to="/inscription" className="font-medium text-lime hover:underline">
            {t('Créer un compte', 'Create an account')}
          </Link>
        </>
      }
    >
      <Seo title={t('Connexion | ThusStride', 'Sign in | ThusStride')} description={t('Connectez-vous à votre espace ThusStride.', 'Sign in to your ThusStride space.')} noindex />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Input label={t('Adresse e-mail', 'E-mail address')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label={t('Mot de passe', 'Password')}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end">
          <Link to="/mot-de-passe-oublie" className="text-sm text-white/60 hover:text-lime">
            {t('Mot de passe oublié ?', 'Forgot password?')}
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={login.isPending} disabled={!email || !password}>
          {t('Se connecter', 'Sign in')}
        </Button>
      </form>
    </AuthCard>
  );
}
