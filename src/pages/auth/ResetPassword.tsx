import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { AuthCard, passwordErrorText } from './AuthCard';
import { Alert, Button, Input } from '../../components/ui/primitives';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { api, ApiError } from '../../lib/api';
import { passwordSchema } from '../../../shared/schemas';

export default function ResetPassword() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const mutation = useMutation({ mutationFn: () => api.post('/auth/reset-password', { token, password }) });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const r = passwordSchema.safeParse(password);
    if (!r.success) return setError(passwordErrorText(r.error.issues.map((i) => i.message).join(','), t));
    if (password !== confirm) return setError(t('Les mots de passe ne correspondent pas.', 'Passwords do not match.'));
    setError(undefined);
    mutation.mutate();
  };

  return (
    <AuthCard title={t('Nouveau mot de passe', 'New password')}>
      <Seo title={t('Nouveau mot de passe | ThusStride', 'New password | ThusStride')} noindex />
      {!token ? (
        <Alert tone="error">
          {t('Lien incomplet.', 'Incomplete link.')}{' '}
          <Link to="/mot-de-passe-oublie" className="underline">
            {t('Faire une nouvelle demande', 'Request a new one')}
          </Link>
        </Alert>
      ) : mutation.isSuccess ? (
        <div className="space-y-4">
          <Alert tone="success">{t('Mot de passe modifié. Vous pouvez vous connecter.', 'Password changed. You can now sign in.')}</Alert>
          <Link to="/connexion" className="block rounded-lg bg-lime px-4 py-2.5 text-center font-semibold text-black">
            {t('Se connecter', 'Sign in')}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {mutation.error && (
            <Alert tone="error">{mutation.error instanceof ApiError ? mutation.error.message : t('Une erreur est survenue.', 'Something went wrong.')}</Alert>
          )}
          <Input label={t('Nouveau mot de passe', 'New password')} type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
          <Input label={t('Confirmer le mot de passe', 'Confirm password')} type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button type="submit" className="w-full" size="lg" loading={mutation.isPending}>
            {t('Enregistrer', 'Save')}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
