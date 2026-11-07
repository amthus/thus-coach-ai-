import { useDeferredValue, useState } from 'react';
import { Badge, Button, Card, Input, PageHeader, Skeleton } from '../../components/ui/primitives';
import { useToast } from '../../components/ui/Toaster';
import { Seo } from '../../lib/seo';
import { useI18n } from '../../lib/i18n';
import { useAdminStats, useAdminUsers, useMe, useMeta, useSetUserRole } from '../../lib/queries';
import { ApiError } from '../../lib/api';

export default function AdminPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const { data: me } = useMe();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: meta } = useMeta();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const deferredQ = useDeferredValue(q);
  const { data: users, isFetching } = useAdminUsers(deferredQ, page);
  const setRole = useSetUserRole();

  const kpis = [
    { label: t('Utilisateurs', 'Users'), value: stats?.users },
    { label: t('Nouveaux (7 j)', 'New (7 d)'), value: stats?.newUsers7d },
    { label: t('Plans générés', 'Plans generated'), value: stats?.plans },
    { label: t('Séances enregistrées', 'Sessions logged'), value: stats?.workouts },
    { label: t('Messages coach', 'Coach messages'), value: stats?.chatMessages },
  ];
  const pages = users ? Math.max(1, Math.ceil(users.total / users.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <Seo title={t('Administration | ThusStride', 'Administration | ThusStride')} noindex />
      <PageHeader
        title={t('Administration', 'Administration')}
        subtitle={t(
          'Vue d’ensemble de la plateforme. Par minimisation des données, les profils de santé, plans et conversations ne sont pas visibles ici.',
          'Platform overview. For data minimisation, health profiles, plans and conversations are not visible here.',
        )}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} as="div" className="!p-4">
            <p className="text-xs text-white/50">{k.label}</p>
            {statsLoading ? <Skeleton className="mt-2 h-7 w-12" /> : <p className="mt-1 font-display text-2xl font-bold">{k.value ?? 0}</p>}
          </Card>
        ))}
      </div>

      {meta && (
        <Card>
          <h2 className="font-display text-lg font-semibold">{t('Services', 'Services')}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Badge tone={meta.ai.gemini ? 'lime' : 'neutral'}>Google Gemini : {meta.ai.gemini ? 'OK' : t('non configuré', 'not configured')}</Badge>
            <Badge tone={meta.ai.granite ? 'lime' : 'neutral'}>IBM Granite : {meta.ai.granite ? 'OK' : t('non configuré', 'not configured')}</Badge>
            <Badge tone={meta.emailDelivery ? 'lime' : 'amber'}>E-mails : {meta.emailDelivery ? 'OK' : t('SMTP non configuré', 'SMTP not configured')}</Badge>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-lg font-semibold">{t('Utilisateurs', 'Users')}</h2>
          <div className="w-full sm:w-72">
            <Input
              label={t('Rechercher', 'Search')}
              placeholder={t('Nom ou e-mail', 'Name or e-mail')}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className={`mt-4 overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-white/40">
                <th className="pb-2 font-medium">{t('Utilisateur', 'User')}</th>
                <th className="pb-2 font-medium">{t('Inscription', 'Signed up')}</th>
                <th className="pb-2 font-medium">{t('Dernière connexion', 'Last login')}</th>
                <th className="pb-2 font-medium">Plans</th>
                <th className="pb-2 font-medium">{t('Séances', 'Sessions')}</th>
                <th className="pb-2 font-medium">{t('Rôle', 'Role')}</th>
              </tr>
            </thead>
            <tbody>
              {!users ? (
                <tr>
                  <td colSpan={6} className="py-6">
                    <Skeleton className="h-8" />
                  </td>
                </tr>
              ) : users.users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-white/40">
                    {t('Aucun résultat.', 'No results.')}
                  </td>
                </tr>
              ) : (
                users.users.map((u) => (
                  <tr key={u.id} className="border-t border-white/5">
                    <td className="py-3">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-white/40">{u.email}</p>
                    </td>
                    <td className="py-3 text-white/60">{new Date(u.createdAt).toLocaleDateString(locale)}</td>
                    <td className="py-3 text-white/60">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString(locale) : '—'}</td>
                    <td className="py-3">{u.plans}</td>
                    <td className="py-3">{u.workouts}</td>
                    <td className="py-3">
                      {u.id === me?.id ? (
                        <Badge tone="lime">admin</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant={u.role === 'admin' ? 'secondary' : 'ghost'}
                          loading={setRole.isPending && setRole.variables?.id === u.id}
                          onClick={() => {
                            const role = u.role === 'admin' ? 'athlete' : 'admin';
                            if (!window.confirm(t(`Passer ${u.email} en ${role} ?`, `Set ${u.email} as ${role}?`))) return;
                            setRole.mutate(
                              { id: u.id, role },
                              { onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Erreur') },
                            );
                          }}
                        >
                          {u.role}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {users && pages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2 text-sm">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ←
            </Button>
            <span className="text-white/50">
              {page} / {pages}
            </span>
            <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              →
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
