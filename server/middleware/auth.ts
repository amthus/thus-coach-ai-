import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../db';
import type { UsersTable } from '../db/schema';
import { forbidden, unauthorized } from '../lib/http';
import { addDays, nowIso, randomToken, sha256 } from '../lib/security';

export const SESSION_COOKIE = 'ts_session';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UsersTable;
      sessionId?: string;
    }
  }
}

export interface SessionOptions {
  ttlDays: number;
  secure: boolean;
}

export async function createSession(db: DB, res: Response, userId: string, userAgent: string | undefined, opts: SessionOptions) {
  const token = randomToken();
  const expiresAt = addDays(opts.ttlDays);
  await db
    .insertInto('auth_sessions')
    .values({
      id: sha256(token),
      user_id: userId,
      created_at: nowIso(),
      expires_at: expiresAt,
      user_agent: userAgent?.slice(0, 255) ?? null,
    })
    .execute();
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: opts.secure,
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export async function destroySession(db: DB, req: Request, res: Response) {
  if (req.sessionId) await db.deleteFrom('auth_sessions').where('id', '=', req.sessionId).execute();
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

/** Loads the user from the session cookie when present. Never fails the request. */
export function loadSession(db: DB) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.[SESSION_COOKIE];
      if (typeof token === 'string' && token.length >= 20 && token.length <= 100) {
        const id = sha256(token);
        const row = await db
          .selectFrom('auth_sessions')
          .innerJoin('users', 'users.id', 'auth_sessions.user_id')
          .selectAll('users')
          .select(['auth_sessions.id as session_id', 'auth_sessions.expires_at'])
          .where('auth_sessions.id', '=', id)
          .executeTakeFirst();
        if (row && row.expires_at > nowIso()) {
          const { session_id, expires_at: _e, ...user } = row;
          req.user = user;
          req.sessionId = session_id;
        } else if (row) {
          await db.deleteFrom('auth_sessions').where('id', '=', id).execute();
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(unauthorized());
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== 'admin') return next(forbidden());
  next();
}

/**
 * CSRF defence for cookie-authenticated APIs: state-changing requests must be JSON
 * (cross-site forms cannot send it without a CORS preflight) and, when the browser
 * sends an Origin header, it must match our own origin. Combined with SameSite=Lax.
 */
export function csrfGuard(allowedOrigins: string[]) {
  const allowed = new Set(allowedOrigins.map((o) => o.replace(/\/$/, '')));
  return (req: Request, _res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (origin) {
      const host = req.get('host');
      const sameHost = host && (origin === `https://${host}` || origin === `http://${host}`);
      if (!sameHost && !allowed.has(origin)) return next(forbidden('Origine de la requête non autorisée.'));
    }
    const hasBody = req.method !== 'DELETE';
    if (hasBody && !req.is('application/json')) return next(forbidden('Content-Type application/json requis.'));
    next();
  };
}
