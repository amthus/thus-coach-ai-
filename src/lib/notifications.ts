import { useEffect, useMemo, useRef } from 'react';
import type { PublicUser, TrainingPlan, WorkoutLog } from '../../shared/types';
import { completedMap, nextSession } from './training';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  href: string;
  tone: 'info' | 'warn' | 'success';
}

/** Notifications are derived from real account data - nothing is simulated. */
export function useNotifications(
  user: PublicUser | null | undefined,
  plan: TrainingPlan | null | undefined,
  workouts: WorkoutLog[] | undefined,
  lang: 'fr' | 'en',
): AppNotification[] {
  return useMemo(() => {
    const L = (fr: string, en: string) => (lang === 'fr' ? fr : en);
    const list: AppNotification[] = [];
    if (!user) return list;
    if (!plan) {
      list.push({
        id: 'no-plan',
        title: L('Aucun plan actif', 'No active plan'),
        body: L('Générez votre plan de 4 semaines personnalisé.', 'Generate your personalised 4-week plan.'),
        href: '/app/plan',
        tone: 'warn',
      });
      return list;
    }
    const done = completedMap(workouts, plan.id);
    const next = nextSession(plan, done);
    if (next) {
      list.push({
        id: `next-${next.session.id}`,
        title: L('Prochaine séance', 'Next session'),
        body: `${next.session.day} - ${next.session.title} (${next.session.durationMinutes} min)`,
        href: '/app/plan',
        tone: 'info',
      });
    } else {
      list.push({
        id: `complete-${plan.id}`,
        title: L('Plan terminé', 'Plan completed'),
        body: L('Bravo ! Générez un nouveau cycle pour continuer à progresser.', 'Well done! Generate a new cycle to keep improving.'),
        href: '/app/plan',
        tone: 'success',
      });
    }
    const pending = workouts?.filter((w) => w.planId === plan.id && w.fatigue == null) ?? [];
    if (pending.length) {
      list.push({
        id: `fatigue-${pending[0].id}`,
        title: L('Fatigue à renseigner', 'Fatigue to log'),
        body: L(
          `Indiquez votre fatigue pour « ${pending[0].sessionTitle} » afin d'ajuster votre charge.`,
          `Log your fatigue for "${pending[0].sessionTitle}" to adjust your load.`,
        ),
        href: '/app/journal',
        tone: 'warn',
      });
    }
    return list;
  }, [user, plan, workouts, lang]);
}

/**
 * Daily training reminder shown as a system notification at the chosen time while
 * ThusStride is open (no push server, no tracking). Fires at most once per day.
 */
export function useDailyReminder(user: PublicUser | null | undefined, body: string | null, title: string) {
  const bodyRef = useRef(body);
  bodyRef.current = body;

  useEffect(() => {
    if (!user?.remindersEnabled || typeof window === 'undefined' || !('Notification' in window)) return;
    const key = `ts_reminder_${user.id}`;
    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = now.toISOString().slice(0, 10);
      let last: string | null = null;
      try {
        last = localStorage.getItem(key);
      } catch {
        /* ignore */
      }
      if (hhmm >= user.reminderTime && last !== today && bodyRef.current && Notification.permission === 'granted') {
        try {
          new Notification(title, { body: bodyRef.current, icon: '/icons/icon-192.png', tag: 'ts-daily' });
          localStorage.setItem(key, today);
        } catch {
          /* ignore */
        }
      }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [user?.id, user?.remindersEnabled, user?.reminderTime, title]);
}
