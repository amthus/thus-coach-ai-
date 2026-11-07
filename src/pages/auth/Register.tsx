import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { AuthCard, passwordErrorText } from './AuthCard';
import { Alert, Button, Checkbox, Input } from '../../components/ui/primitives';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { useRegister } from '../../lib/queries';
import { ApiError } from '../../lib/api';
import { RegisterSchema } from '../../../shared/schemas';
import { PUBLIC_ROUTES } from '../../../shared/seo';

const seo = PUBLIC_ROUTES.find((r) => r.path === '/inscription')!;

export default function Register() {
  const { t, lang } = useI18n();
  const register = useRegister();
  const [form, setForm] = useState({ name: '', email: '', password: '', acceptTerms: false, healthDataConsent: false });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = RegisterSchema.safeParse({ ...form, language: lang });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({
        name: f.name && t('Indiquez votre prénom (2 caractères minimum).', 'Enter your name (at least 2 characters).'),
        email: f.email && t('Adresse e-mail invalide.', 'Invalid e-mail address.'),
        password: passwordErrorText(f.password?.join(','), t),
        acceptTerms: f.acceptTerms && t("Vous devez accepter les conditions d'utilisation.", 'You must accept the terms of use.'),
        healthDataConsent:
          f.healthDataConsent && t('Ce consentement est nécessaire pour personnaliser votre entraînement.', 'This consent is required to personalise your training.'),
      });
      return;
    }
    setErrors({});
    register.mutate(parsed.data);
  };

  const apiError = register.error instanceof ApiError ? register.error.message : register.error ? t('Une erreur est survenue.', 'Something went wrong.') : null;

  return (
    <AuthCard
      title={t('Créez votre compte', 'Create your account')}
      subtitle={t('Gratuit. Votre plan personnalisé en quelques minutes.', 'Free. Your personalised plan in a few minutes.')}
      footer={
        <>
          {t('Déjà inscrit ?', 'Already registered?')}{' '}
          <Link to="/connexion" className="font-medium text-lime hover:underline">
            {t('Se connecter', 'Sign in')}
          </Link>
        </>
      }
    >
      <Seo title={seo.title} description={seo.description} />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {apiError && <Alert tone="error">{apiError}</Alert>}
        <Input label={t('Prénom ou pseudo', 'First name or nickname')} autoComplete="given-name" required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        <Input label={t('Adresse e-mail', 'E-mail address')} type="email" autoComplete="email" required value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
        <Input
          label={t('Mot de passe', 'Password')}
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          error={errors.password}
          hint={t('10 caractères minimum, avec au moins une lettre et un chiffre.', 'At least 10 characters, with a letter and a digit.')}
        />
        <Checkbox
          checked={form.acceptTerms}
          onChange={(v) => set('acceptTerms', v)}
          error={errors.acceptTerms}
          label={
            <>
              {t("J'accepte les", 'I accept the')}{' '}
              <Link to="/conditions-utilisation" target="_blank" className="text-lime underline">
                {t("conditions d'utilisation", 'terms of use')}
              </Link>{' '}
              {t('et la', 'and the')}{' '}
              <Link to="/confidentialite" target="_blank" className="text-lime underline">
                {t('politique de confidentialité', 'privacy policy')}
              </Link>
              .
            </>
          }
        />
        <Checkbox
          checked={form.healthDataConsent}
          onChange={(v) => set('healthDataConsent', v)}
          error={errors.healthDataConsent}
          label={t(
            "Je consens explicitement au traitement de mes données de santé (âge, fréquence cardiaque, douleurs, fatigue) pour personnaliser mon entraînement. Je peux retirer ce consentement en supprimant mon compte.",
            'I explicitly consent to the processing of my health data (age, heart rate, pain, fatigue) to personalise my training. I can withdraw this consent by deleting my account.',
          )}
        />
        <Button type="submit" className="w-full" size="lg" loading={register.isPending}>
          {t('Créer mon compte', 'Create my account')}
        </Button>
      </form>
    </AuthCard>
  );
}
