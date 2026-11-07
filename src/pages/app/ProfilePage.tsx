import { useState } from 'react';
import { Link } from 'react-router';
import { Pencil } from 'lucide-react';
import { ProfileForm } from '../../components/ProfileForm';
import { Badge, Button, Card, InfoList, PageHeader, SectionHeader, Skeleton } from '../../components/ui/primitives';
import { useToast } from '../../components/ui/Toaster';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { useProfile, useSaveProfile } from '../../lib/queries';
import { ApiError } from '../../lib/api';
import { getCoach } from '../../../shared/coaches';
import { estimateMaxHr } from '../../../shared/physiology';
import type { UserProfile } from '../../../shared/types';

function ProfileSummary({ profile }: { profile: UserProfile }) {
  const { t, lang } = useI18n();
  const coach = getCoach(profile.coachId);
  const level = {
    debutant: t('Débutant', 'Beginner'),
    intermediaire: t('Intermédiaire', 'Intermediate'),
    avance: t('Confirmé', 'Advanced'),
  }[profile.level];
  const objective = {
    sante: t('Santé et remise en forme', 'Health and fitness'),
    '5k': t('Courir 5 km', 'Run 5K'),
    '10k': t('Réussir un 10 km', 'Complete a 10K'),
    semi: t('Semi-marathon', 'Half marathon'),
    marathon: t('Marathon', 'Marathon'),
    vitesse: t('Vitesse et VMA', 'Speed and VO2max'),
  }[profile.objective];

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-lime">{t('Votre pratique', 'Your running')}</h3>
        <InfoList
          columns={3}
          items={[
            { label: t('Âge', 'Age'), value: `${profile.age} ${t('ans', 'years')}` },
            { label: t('Niveau', 'Level'), value: level },
            { label: t('Séances par semaine', 'Sessions per week'), value: profile.frequency },
            { label: t('Distance habituelle', 'Usual distance'), value: `${profile.avgDistance} km` },
            { label: t('Objectif principal', 'Main goal'), value: objective },
            { label: t('Précisions', 'Details'), value: profile.customObjective },
          ]}
        />
        <div className="mt-4">
          <InfoList columns={1} items={[{ label: t('Douleurs ou antécédents', 'Pain or injury history'), value: profile.injuryHistory || t('Aucun', 'None') }]} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-lime">{t('Physiologie', 'Physiology')}</h3>
        <InfoList
          columns={3}
          items={[
            { label: t('FC de repos', 'Resting HR'), value: profile.restingHr ? `${profile.restingHr} bpm` : t('Non renseignée', 'Not set') },
            {
              label: t('FC max', 'Max HR'),
              value: profile.maxHr ? (
                `${profile.maxHr} bpm`
              ) : (
                <>
                  {estimateMaxHr(profile.age)} bpm <Badge>{t('estimée', 'estimated')}</Badge>
                </>
              ),
            },
            { label: t('Poids', 'Weight'), value: profile.weightKg ? `${profile.weightKg} kg` : t('Non renseigné', 'Not set') },
          ]}
        />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-lime">{t('Coach', 'Coach')}</h3>
        <InfoList
          columns={2}
          items={[
            { label: t('Coach', 'Coach'), value: `${coach.name} - ${coach.style[lang]}` },
            { label: t("Moteur d'IA préféré", 'Preferred AI engine'), value: profile.aiProvider === 'granite' ? 'IBM Granite (watsonx)' : 'Google Gemini' },
          ]}
        />
      </section>
    </div>
  );
}

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { data: profile, isLoading } = useProfile();
  const save = useSaveProfile();
  const toast = useToast();
  const [editing, setEditing] = useState(false);

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
        ) : editing || !profile ? (
          <ProfileForm
            initial={profile}
            submitLabel={t('Enregistrer', 'Save')}
            loading={save.isPending}
            error={save.error instanceof ApiError ? save.error.message : null}
            onCancel={profile ? () => setEditing(false) : undefined}
            onSubmit={(p) =>
              save.mutate(p, {
                onSuccess: () => {
                  setEditing(false);
                  toast.success(t('Profil enregistré. Générez un nouveau plan pour l’appliquer.', 'Profile saved. Generate a new plan to apply it.'));
                },
              })
            }
          />
        ) : (
          <>
            <SectionHeader
              title={t('Mes informations', 'My information')}
              action={
                <Button size="sm" variant="secondary" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(true)}>
                  {t('Modifier', 'Edit')}
                </Button>
              }
            />
            <div className="mt-6">
              <ProfileSummary profile={profile} />
            </div>
          </>
        )}
        {profile?.updatedAt && !editing && (
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
