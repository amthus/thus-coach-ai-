import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '../lib/i18n';
import type { DashboardStats } from '../../shared/types';

export default function WeeklyChart({ data }: { data: DashboardStats['weekly'] }) {
  const { t, locale } = useI18n();
  const rows = data.map((w) => ({
    ...w,
    label: new Date(`${w.weekStart}T00:00:00Z`).toLocaleDateString(locale, { day: '2-digit', month: 'short', timeZone: 'UTC' }),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'rgba(204,255,0,0.06)' }}
          contentStyle={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
          formatter={(value) => [`${value} min`, t('Durée', 'Duration')]}
          labelFormatter={(l) => `${t('Semaine du', 'Week of')} ${l}`}
        />
        <Bar dataKey="minutes" fill="#CCFF00" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
