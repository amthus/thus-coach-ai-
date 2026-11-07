import { Router } from 'express';
import { z } from 'zod';
import type { AppContext } from '../context';
import { ProfileSchema, SettingsSchema } from '../../shared/schemas';
import { badRequest, handler, parse } from '../lib/http';
import { toChatMessage, toPlan, toProfile, toPublicUser, toWorkoutLog } from '../lib/mappers';
import { nowIso, verifyPassword } from '../lib/security';
import { requireAuth } from '../middleware/auth';

export function accountRouter(ctx: AppContext) {
  const { db } = ctx;
  const r = Router();
  r.use(requireAuth);

  r.get(
    '/profile',
    handler(async (req, res) => {
      const row = await db.selectFrom('profiles').selectAll().where('user_id', '=', req.user!.id).executeTakeFirst();
      res.json({ profile: row ? toProfile(row) : null });
    }),
  );

  r.put(
    '/profile',
    handler(async (req, res) => {
      const p = parse(ProfileSchema, req.body);
      const values = {
        user_id: req.user!.id,
        age: p.age,
        level: p.level,
        frequency: p.frequency,
        avg_distance: p.avgDistance,
        objective: p.objective,
        custom_objective: p.customObjective,
        injury_history: p.injuryHistory,
        resting_hr: p.restingHr ?? null,
        max_hr: p.maxHr ?? null,
        weight_kg: p.weightKg ?? null,
        coach_id: p.coachId,
        ai_provider: p.aiProvider,
        updated_at: nowIso(),
      };
      const { user_id: _u, ...updatable } = values;
      await db
        .insertInto('profiles')
        .values(values)
        .onConflict((oc) => oc.column('user_id').doUpdateSet(updatable))
        .execute();
      res.json({ profile: toProfile(values) });
    }),
  );

  r.patch(
    '/settings',
    handler(async (req, res) => {
      const s = parse(SettingsSchema, req.body);
      const patch: Record<string, unknown> = { updated_at: nowIso() };
      if (s.name !== undefined) patch.name = s.name;
      if (s.language !== undefined) patch.language = s.language;
      if (s.remindersEnabled !== undefined) patch.reminders_enabled = s.remindersEnabled ? 1 : 0;
      if (s.reminderTime !== undefined) patch.reminder_time = s.reminderTime;
      await db.updateTable('users').set(patch).where('id', '=', req.user!.id).execute();
      const user = await db.selectFrom('users').selectAll().where('id', '=', req.user!.id).executeTakeFirstOrThrow();
      const hasProfile = Boolean(
        await db.selectFrom('profiles').select('user_id').where('user_id', '=', user.id).executeTakeFirst(),
      );
      res.json({ user: toPublicUser(user, hasProfile) });
    }),
  );

  /** GDPR art. 15 & 20 - right of access and data portability. */
  r.get(
    '/export',
    handler(async (req, res) => {
      const id = req.user!.id;
      const [profile, plans, workouts, chat] = await Promise.all([
        db.selectFrom('profiles').selectAll().where('user_id', '=', id).executeTakeFirst(),
        db.selectFrom('plans').selectAll().where('user_id', '=', id).orderBy('created_at').execute(),
        db.selectFrom('workout_logs').selectAll().where('user_id', '=', id).orderBy('completed_at').execute(),
        db.selectFrom('chat_messages').selectAll().where('user_id', '=', id).orderBy('created_at').execute(),
      ]);
      const u = req.user!;
      const payload = {
        exportedAt: nowIso(),
        account: {
          ...toPublicUser(u, Boolean(profile)),
          termsAcceptedAt: u.terms_accepted_at,
          healthConsentAt: u.health_consent_at,
          lastLoginAt: u.last_login_at,
        },
        profile: profile ? toProfile(profile) : null,
        plans: plans.map(toPlan),
        workouts: workouts.map(toWorkoutLog),
        chatMessages: chat.map(toChatMessage),
      };
      res.setHeader('Content-Disposition', `attachment; filename="thusstride-export-${new Date().toISOString().slice(0, 10)}.json"`);
      res.json(payload);
    }),
  );

  /** GDPR art. 17 - right to erasure. Cascades to all personal data. */
  r.post(
    '/delete',
    handler(async (req, res) => {
      const { password } = parse(z.object({ password: z.string().min(1).max(128) }), req.body);
      if (!(await verifyPassword(password, req.user!.password_hash))) {
        throw badRequest('invalid_password', 'Mot de passe incorrect.');
      }
      const id = req.user!.id;
      await db.transaction().execute(async (trx) => {
        // Explicit deletes keep behaviour identical on databases where FK cascades are disabled.
        await trx.deleteFrom('chat_messages').where('user_id', '=', id).execute();
        await trx.deleteFrom('workout_logs').where('user_id', '=', id).execute();
        await trx.deleteFrom('plans').where('user_id', '=', id).execute();
        await trx.deleteFrom('profiles').where('user_id', '=', id).execute();
        await trx.deleteFrom('password_resets').where('user_id', '=', id).execute();
        await trx.deleteFrom('auth_sessions').where('user_id', '=', id).execute();
        await trx.deleteFrom('users').where('id', '=', id).execute();
      });
      res.clearCookie('ts_session', { path: '/' });
      res.json({ ok: true });
    }),
  );

  return r;
}
