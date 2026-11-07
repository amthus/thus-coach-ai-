import { useNavigate } from 'react-router';
import { ProfileForm } from '../../components/ProfileForm';
import { Card } from '../../components/ui/primitives';
import { useToast } from '../../components/ui/Toaster';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { useGeneratePlan, useMe, useSaveProfile } from '../../lib/queries';
import { ApiError } from '../../lib/api';
import type { ProfileInput } from '../../../shared/schemas';

/** First-run onboarding: profile, then the first plan is generated automatically. */
export default function Welcome() {
  const { t } = useI18n();
  const { data: user } = useMe();
  const save = useSaveProfile();
  const generate = useGeneratePlan();
  const navigate = useNavigate();
  const toast = useToast();

  const onSubmit = async (p: ProfileInput) => {
    try {
      await save.mutateAsync(p);
    } catch {
      return; // shown inline via save.error
    }
    try {
      await generate.mutateAsync();
      toast.success(t('Votre premier plan est prêt !', 'Your first plan is ready!'));
      navigate('/app/plan', { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Échec de la génération du plan.', 'Plan generation failed.'));
      navigate('/app/plan', { replace: true });
    }
  };

  const busy = save.isPending || generate.isPending;
  const err = save.error instanceof ApiError ? save.error.message : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Seo title={t('Bienvenue | ThusStride', 'Welcome | ThusStride')} noindex />
      <div className="mb-8">
        <p className="text-sm font-medium text-lime">{t('Étape 1 sur 1', 'Step 1 of 1')}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          {t(`Bienvenue ${user?.name ?? ''} !`, `Welcome ${user?.name ?? ''}!`)}
        </h1>
        <p className="mt-2 text-white/60">
          {t(
            'Parlez-nous de votre pratique : nous générerons immédiatement votre plan de 4 semaines.',
            'Tell us about your running: we will immediately generate your 4-week plan.',
          )}
        </p>
      </div>
      <Card>
        <ProfileForm
          submitLabel={generate.isPending ? t('Génération du plan…', 'Generating plan…') : t('Créer mon plan', 'Create my plan')}
          loading={busy}
          error={err}
          onSubmit={onSubmit}
        />
      </Card>
    </div>
  );
}
