import { Router } from 'express';
import { z } from 'zod';
import type { AppContext } from '../context';
import type { AdminStats, AdminUserRow } from '../../shared/types';
import { badRequest, handler, notFound, parse } from '../lib/http';
import { requireAdmin } from '../middleware/auth';

/**
 * Administration space. Follows data minimisation: admins see account metadata and
 * aggregate counts only - never health profiles, plans content or conversations.
 */
export function adminRouter(ctx: AppContext) {
  const { db } = ctx;
  const r = Router();
  r.use(requireAdmin);

  const count = async (table: 'users' | 'plans' | 'workout_logs' | 'chat_messages') =>
    Number((await db.selectFrom(table).select(db.fn.countAll<number>().as('n')).executeTakeFirstOrThrow()).n);

  r.get(
    '/stats',
    handler(async (_req, res) => {
      const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const [users, plans, workouts, chatMessages, recent] = await Promise.all([
        count('users'),
        count('plans'),
        count('workout_logs'),
        count('chat_messages'),
        db.selectFrom('users').select(db.fn.countAll<number>().as('n')).where('created_at', '>=', since).executeTakeFirstOrThrow(),
      ]);
      const stats: AdminStats = { users, newUsers7d: Number(recent.n), plans, workouts, chatMessages };
      res.json({ stats });
    }),
  );

  r.get(
    '/users',
    handler(async (req, res) => {
      const { q, page } = parse(
        z.object({ q: z.string().trim().max(100).optional(), page: z.coerce.number().int().min(1).max(10_000).default(1) }),
        req.query,
      );
      const pageSize = 25;
      let query = db.selectFrom('users');
      if (q) query = query.where((eb) => eb.or([eb('email', 'like', `%${q.toLowerCase()}%`), eb('name', 'like', `%${q}%`)]));
      const total = Number((await query.select(db.fn.countAll<number>().as('n')).executeTakeFirstOrThrow()).n);
      const rows = await query
        .select((eb) => [
          'users.id',
          'users.email',
          'users.name',
          'users.role',
          'users.created_at',
          'users.last_login_at',
          eb.selectFrom('plans').select(eb.fn.countAll<number>().as('c')).whereRef('plans.user_id', '=', 'users.id').as('plans'),
          eb
            .selectFrom('workout_logs')
            .select(eb.fn.countAll<number>().as('c'))
            .whereRef('workout_logs.user_id', '=', 'users.id')
            .as('workouts'),
        ])
        .orderBy('users.created_at', 'desc')
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .execute();
      const users: AdminUserRow[] = rows.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.created_at,
        lastLoginAt: u.last_login_at,
        plans: Number(u.plans ?? 0),
        workouts: Number(u.workouts ?? 0),
      }));
      res.json({ users, total, page, pageSize });
    }),
  );

  r.patch(
    '/users/:id/role',
    handler(async (req, res) => {
      const { role } = parse(z.object({ role: z.enum(['athlete', 'admin']) }), req.body);
      if (req.params.id === req.user!.id) throw badRequest('self_role', 'Vous ne pouvez pas modifier votre propre rôle.');
      const result = await db.updateTable('users').set({ role }).where('id', '=', req.params.id).executeTakeFirst();
      if (!Number(result.numUpdatedRows)) throw notFound('Utilisateur introuvable.');
      res.json({ ok: true });
    }),
  );

  return r;
}
