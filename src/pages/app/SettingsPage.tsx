import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calculator, Download, LogOut, Shield, User } from 'lucide-react';
import { Alert, Button, Card, Checkbox, Input, Modal, PageHeader } from '../../components/ui/primitives';
import { useToast } from '../../components/ui/Toaster';
import { LanguageSwitch } from '../../components/LanguageSwitch';
import { passwordErrorText } from '../auth/AuthCard';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { resetSession, useLogout, useMe, useUpdateSettings } from '../../lib/queries';
import { api, ApiError } from '../../lib/api';
import { downloadFile } from '../../lib/training';
import { passwordSchema } from '../../../shared/schemas';

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: user } = useMe();
  const update = useUpdateSettings();
  const logout = useLogout();

  const [name, setName] = useState(user?.name ?? '');
  const [time, setTime] = useState(user?.reminderTime ?? '08:00');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );
  useEffect(() => {
    if (user) {
      setName(user.name);
      setTime(user.reminderTime);
    }
  }, [user]);

  const [pw, setPw] = useState({ current: '', next: '' });
  const [pwError, setPwError] = useState<string>();
  const changePw = useMutation({
    mutationFn: () => api.post('/auth/change-password', { currentPassword: pw.current, newPassword: pw.next }),
    onSuccess: () => {
      setPw({ current: '', next: '' });
      toast.success(t('Mot de passe modifié. Vos autres sessions ont été déconnectées.', 'Password changed. Your other sessions were signed out.'));
    },
  });

  const exportData = useMutation({
    mutationFn: () => api.get<unknown>('/me/export'),
    onSuccess: (data) => downloadFile(`thusstride-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json'),
    onError: () => toast.error(t("L'export a échoué.", 'Export failed.')),
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const deleteAccount = useMutation({
    mutationFn: () => api.post('/me/delete', { password: deletePw }),
    onSuccess: () => {
      resetSession(qc, null);
      navigate('/', { replace: true });
    },
  });

  const saveProfile = (e: FormEvent) => {
    e.preventDefault();
    update.mutate({ name, reminderTime: time }, { onSuccess: () => toast.success(t('Paramètres enregistrés.', 'Settings saved.')) });
  };

  const toggleReminders = async (enabled: boolean) => {
    if (enabled && permission === 'default') {
      const p = await Notification.requestPermission();
      setPermission(p);
    }
    update.mutate({ remindersEnabled: enabled });
  };

  const submitPw = (e: FormEvent) => {
    e.preventDefault();
    const r = passwordSchema.safeParse(pw.next);
    if (!r.success) return setPwError(passwordErrorText(r.error.issues.map((i) => i.message).join(','), t));
    setPwError(undefined);
    changePw.mutate();
  };

  return (
    <div className="space-y-6">
      <Seo title={t('Paramètres | ThusStride', 'Settings | ThusStride')} noindex />
      <PageHeader
        title={t('Paramètres', 'Settings')}
        subtitle={user ? t(`Membre depuis le ${new Date(user.createdAt).toLocaleDateString(locale)}`, `Member since ${new Date(user.createdAt).toLocaleDateString(locale)}`) : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg font-semibold">{t('Compte', 'Account')}</h2>
          <form onSubmit={saveProfile} className="mt-4 space-y-4">
            <Input label={t('Prénom ou pseudo', 'First name or nickname')} value={name} minLength={2} maxLength={80} onChange={(e) => setName(e.target.value)} />
            <Input label={t('Adresse e-mail', 'E-mail address')} value={user?.email ?? ''} disabled hint={t("L'adresse e-mail sert d'identifiant.", 'The e-mail address is your login.')} />
            <div className="space-y-1.5">
              <span className="block text-sm font-medium text-white/80">{t('Langue', 'Language')}</span>
              <LanguageSwitch />
            </div>
            <Input
              label={t('Heure du rappel quotidien', 'Daily reminder time')}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <Button type="submit" loading={update.isPending}>
              {t('Enregistrer', 'Save')}
            </Button>
          </form>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/5 pt-4">
            <Link to="/app/profil" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/25">
              <User className="h-4 w-4" /> {t('Profil athlète', 'Athlete profile')}
            </Link>
            <Link to="/app/outils" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/25">
              <Calculator className="h-4 w-4" /> {t('Outils', 'Tools')}
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/25">
                <Shield className="h-4 w-4" /> {t('Administration', 'Administration')}
              </Link>
            )}
            <Button variant="ghost" icon={<LogOut className="h-4 w-4" />} onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/connexion') })}>
              {t('Se déconnecter', 'Sign out')}
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-lg font-semibold">{t('Rappels', 'Reminders')}</h2>
            <div className="mt-4 space-y-3">
              <Checkbox
                checked={Boolean(user?.remindersEnabled)}
                onChange={toggleReminders}
                label={t(`Me rappeler ma séance chaque jour à ${user?.reminderTime ?? ''}`, `Remind me of my session every day at ${user?.reminderTime ?? ''}`)}
              />
              {permission === 'denied' && (
                <Alert tone="warn">
                  {t('Les notifications sont bloquées par votre navigateur. Autorisez-les dans les réglages du site.', 'Notifications are blocked by your browser. Allow them in the site settings.')}
                </Alert>
              )}
              {permission === 'unsupported' && <Alert tone="info">{t('Votre navigateur ne prend pas en charge les notifications.', 'Your browser does not support notifications.')}</Alert>}
              <p className="text-xs text-white/40">
                {t('Les rappels s’affichent lorsque ThusStride est ouvert dans un onglet ou installé.', 'Reminders appear while ThusStride is open in a tab or installed.')}
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-lg font-semibold">{t('Mot de passe', 'Password')}</h2>
            <form onSubmit={submitPw} className="mt-4 space-y-4">
              {changePw.error && <Alert tone="error">{changePw.error instanceof ApiError ? changePw.error.message : t('Erreur.', 'Error.')}</Alert>}
              <Input label={t('Mot de passe actuel', 'Current password')} type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
              <Input
                label={t('Nouveau mot de passe', 'New password')}
                type="password"
                autoComplete="new-password"
                value={pw.next}
                error={pwError}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
              />
              <Button type="submit" variant="secondary" loading={changePw.isPending} disabled={!pw.current || !pw.next}>
                {t('Changer le mot de passe', 'Change password')}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold">{t('Mes données', 'My data')}</h2>
        <p className="mt-1 text-sm text-white/50">
          {t('Conformément au RGPD, vous pouvez récupérer ou supprimer toutes vos données à tout moment.', 'Under GDPR, you can download or delete all your data at any time.')}{' '}
          <Link to="/confidentialite" className="text-lime underline">
            {t('En savoir plus', 'Learn more')}
          </Link>
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" icon={<Download className="h-4 w-4" />} loading={exportData.isPending} onClick={() => exportData.mutate()}>
            {t('Exporter mes données (JSON)', 'Export my data (JSON)')}
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            {t('Supprimer mon compte', 'Delete my account')}
          </Button>
        </div>
      </Card>

      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletePw('');
          deleteAccount.reset();
        }}
        title={t('Supprimer définitivement votre compte ?', 'Permanently delete your account?')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              {t('Annuler', 'Cancel')}
            </Button>
            <Button variant="danger" loading={deleteAccount.isPending} disabled={!deletePw} onClick={() => deleteAccount.mutate()}>
              {t('Supprimer définitivement', 'Delete permanently')}
            </Button>
          </>
        }
      >
        <Alert tone="error">
          {t(
            'Votre profil, vos plans, votre journal et vos conversations seront supprimés immédiatement. Cette action est irréversible.',
            'Your profile, plans, log and conversations will be deleted immediately. This cannot be undone.',
          )}
        </Alert>
        {deleteAccount.error && <Alert tone="error">{deleteAccount.error instanceof ApiError ? deleteAccount.error.message : t('Erreur.', 'Error.')}</Alert>}
        <Input label={t('Confirmez avec votre mot de passe', 'Confirm with your password')} type="password" autoComplete="current-password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} />
      </Modal>
    </div>
  );
}
