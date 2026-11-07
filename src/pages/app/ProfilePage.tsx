import { Link } from 'react-router';
import { ProfileForm } from '../../components/ProfileForm';
import { Card, PageHeader, Skeleton } from '../../components/ui/primitives';
import { useToast } from '../../components/ui/Toaster';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { useProfile, useSaveProfile } from '../../lib/queries';
import { ApiError } from '../../lib/api';

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { data: profile, isLoading } = useProfile();
  const save = useSaveProfile();
  const toast = useToast();

  return (
    <div>
      <Seo title={t('Profil athlète | ThusStride', 'Athlete profile | ThusStride')} noindex />
      <PageHeader
        title={t('Profil athlète', 'Athlete profile')}
        subtitle={t(
          'Ces informations personnalisent vos plans, vos zones cardiaques et les réponses du coach.',
          'This information personalises your plans, heart-rate zones and coach answers.',
        )}
      />
      <Card>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <ProfileForm
            initial={profile}
            submitLabel={t('Enregistrer', 'Save')}
            loading={save.isPending}
            error={save.error instanceof ApiError ? save.error.message : null}
            onSubmit={(p) =>
              save.mutate(p, {
                onSuccess: () => toast.success(t('Profil enregistré. Générez un nouveau plan pour l’appliquer.', 'Profile saved. Generate a new plan to apply it.')),
              })
            }
          />
        )}
        {profile?.updatedAt && (
          <p className="mt-6 text-xs text-white/40">
            {t('Dernière mise à jour :', 'Last updated:')} {new Date(profile.updatedAt).toLocaleString(locale)} ·{' '}
            <Link to="/app/plan" className="text-lime hover:underline">
              {t('Régénérer mon plan', 'Regenerate my plan')}
            </Link>
          </p>
        )}
      </Card>
    </div>
  );
}
