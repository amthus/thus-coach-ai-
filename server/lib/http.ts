import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (code: string, message: string, details?: unknown) => new HttpError(400, code, message, details);
export const unauthorized = (message = 'Authentification requise.') => new HttpError(401, 'unauthorized', message);
export const forbidden = (message = 'Accès refusé.') => new HttpError(403, 'forbidden', message);
export const notFound = (message = 'Ressource introuvable.') => new HttpError(404, 'not_found', message);
export const conflict = (code: string, message: string) => new HttpError(409, code, message);

/** Wraps async route handlers so rejected promises reach the error middleware (Express 4). */
export const handler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export function parse<S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest('validation_error', 'Données invalides.', result.error.flatten().fieldErrors);
  }
  return result.data;
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: { code: 'validation_error', message: 'Données invalides.', details: err.flatten().fieldErrors } });
  }
  if (err && typeof err === 'object' && 'type' in err && (err as { type: string }).type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'payload_too_large', message: 'Requête trop volumineuse.' } });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: { code: 'invalid_json', message: 'JSON invalide.' } });
  }
  console.error(`[error] ${req.method} ${req.path}`, err);
  return res.status(500).json({ error: { code: 'internal_error', message: 'Erreur interne du serveur.' } });
}
