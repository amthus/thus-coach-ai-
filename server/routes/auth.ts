import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { AppContext } from '../context';
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
} from '../../shared/schemas';
import { badRequest, conflict, handler, parse, unauthorized } from '../lib/http';
import { toPublicUser } from '../lib/mappers';
import {
  addMinutes,
  getDummyHash,
  hashPassword,
  nowIso,
  randomToken,
  sha256,
  uuid,
  verifyPassword,
} from '../lib/security';
import { createSession, destroySession, requireAuth } from '../middleware/auth';

export function authRouter(ctx: AppContext) {
  const { db, config, mailer } = ctx;
  const r = Router();
  const sessionOpts = { ttlDays: config.SESSION_TTL_DAYS, secure: config.isProd };

  // Brute-force protection on credential endpoints.
  const strictLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: config.isTest ? 1000 : 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: 'rate_limited', message: 'Trop de tentatives. Réessayez dans quelques minutes.' } },
  });

  const hasProfile = async (userId: string) =>
    Boolean(await db.selectFrom('profiles').select('user_id').where('user_id', '=', userId).executeTakeFirst());

  r.post(
    '/register',
    strictLimiter,
    handler(async (req, res) => {
      const input = parse(RegisterSchema, req.body);
      const exists = await db.selectFrom('users').select('id').where('email', '=', input.email).executeTakeFirst();
      if (exists) throw conflict('email_taken', 'Un compte existe déjà avec cette adresse e-mail.');

      const now = nowIso();
      const user = {
        id: uuid(),
        email: input.email,
        name: input.name,
        password_hash: await hashPassword(input.password),
        role: config.adminEmails.includes(input.email) ? ('admin' as const) : ('athlete' as const),
        language: input.language,
        reminders_enabled: 1,
        reminder_time: '08:00',
        terms_accepted_at: now,
        health_consent_at: now,
        created_at: now,
        updated_at: now,
        last_login_at: now,
      };
      await db.insertInto('users').values(user).execute();
      await createSession(db, res, user.id, req.get('user-agent'), sessionOpts);
      res.status(201).json({ user: toPublicUser(user, false) });
    }),
  );

  r.post(
    '/login',
    strictLimiter,
    handler(async (req, res) => {
      const input = parse(LoginSchema, req.body);
      const user = await db.selectFrom('users').selectAll().where('email', '=', input.email).executeTakeFirst();
      // Always run a hash comparison to avoid leaking account existence through timing.
      const ok = await verifyPassword(input.password, user?.password_hash ?? (await getDummyHash()));
      if (!user || !ok) throw unauthorized('E-mail ou mot de passe incorrect.');

      const now = nowIso();
      await db.updateTable('users').set({ last_login_at: now }).where('id', '=', user.id).execute();
      // Opportunistic cleanup of this user's expired sessions.
      await db.deleteFrom('auth_sessions').where('user_id', '=', user.id).where('expires_at', '<', now).execute();
      await createSession(db, res, user.id, req.get('user-agent'), sessionOpts);
      res.json({ user: toPublicUser({ ...user, last_login_at: now }, await hasProfile(user.id)) });
    }),
  );

  r.post(
    '/logout',
    handler(async (req, res) => {
      await destroySession(db, req, res);
      res.json({ ok: true });
    }),
  );

  r.get(
    '/me',
    handler(async (req, res) => {
      if (!req.user) return res.json({ user: null });
      res.json({ user: toPublicUser(req.user, await hasProfile(req.user.id)) });
    }),
  );

  r.post(
    '/forgot-password',
    strictLimiter,
    handler(async (req, res) => {
      const { email } = parse(ForgotPasswordSchema, req.body);
      const user = await db.selectFrom('users').select(['id', 'name', 'language']).where('email', '=', email).executeTakeFirst();
      if (user) {
        const token = randomToken();
        await db
          .insertInto('password_resets')
          .values({ id: sha256(token), user_id: user.id, expires_at: addMinutes(60), used_at: null, created_at: nowIso() })
          .execute();
        const link = `${config.APP_URL}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;
        const fr = user.language === 'fr';
        await mailer.send({
          to: email,
          subject: fr ? 'Réinitialisation de votre mot de passe ThusStride' : 'Reset your ThusStride password',
          text: fr
            ? `Bonjour ${user.name},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.\n\nL'équipe ThusStride`
            : `Hi ${user.name},\n\nTo choose a new password, open this link (valid for 1 hour):\n${link}\n\nIf you did not request this, ignore this e-mail.\n\nThe ThusStride team`,
        });
      }
      // Same response whether or not the account exists (no user enumeration).
      res.json({ ok: true });
    }),
  );

  r.post(
    '/reset-password',
    strictLimiter,
    handler(async (req, res) => {
      const { token, password } = parse(ResetPasswordSchema, req.body);
      const row = await db
        .selectFrom('password_resets')
        .selectAll()
        .where('id', '=', sha256(token))
        .executeTakeFirst();
      if (!row || row.used_at || row.expires_at < nowIso()) {
        throw badRequest('invalid_token', 'Lien invalide ou expiré. Faites une nouvelle demande.');
      }
      const hash = await hashPassword(password);
      await db.transaction().execute(async (trx) => {
        await trx.updateTable('users').set({ password_hash: hash, updated_at: nowIso() }).where('id', '=', row.user_id).execute();
        await trx.updateTable('password_resets').set({ used_at: nowIso() }).where('id', '=', row.id).execute();
        // Revoke every active session after a password reset.
        await trx.deleteFrom('auth_sessions').where('user_id', '=', row.user_id).execute();
      });
      res.json({ ok: true });
    }),
  );

  r.post(
    '/change-password',
    requireAuth,
    strictLimiter,
    handler(async (req, res) => {
      const { currentPassword, newPassword } = parse(ChangePasswordSchema, req.body);
      const user = req.user!;
      if (!(await verifyPassword(currentPassword, user.password_hash))) {
        throw badRequest('invalid_password', 'Mot de passe actuel incorrect.');
      }
      await db
        .updateTable('users')
        .set({ password_hash: await hashPassword(newPassword), updated_at: nowIso() })
        .where('id', '=', user.id)
        .execute();
      // Keep the current session, revoke the others.
      await db.deleteFrom('auth_sessions').where('user_id', '=', user.id).where('id', '!=', req.sessionId!).execute();
      res.json({ ok: true });
    }),
  );

  return r;
}
