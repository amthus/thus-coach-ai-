import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { createApp } from '../server/app';
import { config } from '../server/config';
import { createDb } from '../server/db';
import { AiGateway } from '../server/services/ai';
import type { Mail, Mailer } from '../server/services/mailer';

const sent: Mail[] = [];
let app: Express;

const profile = {
  age: 32,
  level: 'intermediaire',
  frequency: 4,
  avgDistance: 8,
  objective: '10k',
  customObjective: 'Moins de 50 min',
  injuryHistory: '',
  restingHr: 55,
  maxHr: null,
  weightKg: 70,
  coachId: 'helene',
  aiProvider: 'gemini',
};

async function register(email: string, name = 'Test User') {
  const agent = request.agent(app);
  const res = await agent
    .post('/api/auth/register')
    .send({ name, email, password: 'Sup3rSecurePass', acceptTerms: true, healthDataConsent: true, language: 'fr' });
  return { agent, res };
}

beforeAll(async () => {
  const db = await createDb({ sqlitePath: ':memory:' });
  const mailer: Mailer = { configured: true, send: async (m) => void sent.push(m) };
  app = await createApp({ db, config, ai: new AiGateway(config), mailer });
});

describe('auth', () => {
  it('registers, sets an httpOnly session cookie and returns the user', async () => {
    const { res } = await register('alice@example.com', 'Alice');
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'alice@example.com', role: 'athlete', hasProfile: false });
    expect(res.body.user.password_hash).toBeUndefined();
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/ts_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('rejects duplicate e-mails, weak passwords and missing consent', async () => {
    expect((await register('alice@example.com')).res.status).toBe(409);
    const weak = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@example.com', password: 'short', acceptTerms: true, healthDataConsent: true });
    expect(weak.status).toBe(400);
    const noConsent = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@example.com', password: 'Sup3rSecurePass', acceptTerms: true, healthDataConsent: false });
    expect(noConsent.status).toBe(400);
  });

  it('logs in with the right password only, with a generic error message', async () => {
    const bad = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'wrongpass1' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'wrongpass1' });
    expect(bad.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(bad.body.error.message).toBe(unknown.body.error.message);
    const ok = await request(app).post('/api/auth/login').send({ email: 'ALICE@example.com', password: 'Sup3rSecurePass' });
    expect(ok.status).toBe(200);
  });

  it('protects private routes and logs out', async () => {
    expect((await request(app).get('/api/me/profile')).status).toBe(401);
    const { agent } = await register('carol@example.com');
    expect((await agent.get('/api/auth/me')).body.user.email).toBe('carol@example.com');
    await agent.post('/api/auth/logout').send({});
    expect((await agent.get('/api/auth/me')).body.user).toBeNull();
  });

  it('blocks cross-site and non-JSON state-changing requests (CSRF)', async () => {
    const evil = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: 'alice@example.com', password: 'Sup3rSecurePass' });
    expect(evil.status).toBe(403);
    const form = await request(app).post('/api/auth/login').type('form').send('email=a@b.c&password=x');
    expect(form.status).toBe(403);
  });

  it('resets a password with a single-use e-mailed token and revokes sessions', async () => {
    const { agent } = await register('dave@example.com');
    await request(app).post('/api/auth/forgot-password').send({ email: 'dave@example.com' }).expect(200);
    await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@example.com' }).expect(200);
    const mail = sent.find((m) => m.to === 'dave@example.com')!;
    const token = /token=([^\s]+)/.exec(mail.text)![1];
    await request(app).post('/api/auth/reset-password').send({ token: decodeURIComponent(token), password: 'An0therGoodPass' }).expect(200);
    await request(app).post('/api/auth/reset-password').send({ token: decodeURIComponent(token), password: 'An0therGoodPass' }).expect(400);
    expect((await agent.get('/api/auth/me')).body.user).toBeNull();
    await request(app).post('/api/auth/login').send({ email: 'dave@example.com', password: 'An0therGoodPass' }).expect(200);
  });

  it('grants admin role to configured e-mails only', async () => {
    const { res } = await register('admin@example.com', 'Admin');
    expect(res.body.user.role).toBe('admin');
  });
});

describe('athlete space', () => {
  it('saves a profile, generates a plan (rules engine without AI keys), logs workouts and computes stats', async () => {
    const { agent } = await register('eve@example.com', 'Eve');

    await agent.post('/api/plans/generate').send({}).expect(400); // profile required
    await agent.put('/api/me/profile').send({ ...profile, age: 5 }).expect(400);
    const saved = await agent.put('/api/me/profile').send(profile).expect(200);
    expect(saved.body.profile.restingHr).toBe(55);

    const gen = await agent.post('/api/plans/generate').send({}).expect(201);
    const plan = gen.body.plan;
    expect(plan.source).toBe('rules-engine');
    expect(plan.weeks).toHaveLength(4);
    for (const w of plan.weeks) expect(w.sessions).toHaveLength(4);

    const active = await agent.get('/api/plans/active').expect(200);
    expect(active.body.plan.id).toBe(plan.id);

    const session = plan.weeks[0].sessions[0];
    const log = await agent
      .post('/api/workouts')
      .send({ planId: plan.id, sessionId: session.id, fatigue: 8, actualDistanceKm: 7.5 })
      .expect(201);
    await agent.post('/api/workouts').send({ planId: plan.id, sessionId: session.id }).expect(409);

    const advice = await agent.post(`/api/workouts/${log.body.workout.id}/advice`).send({}).expect(200);
    expect(advice.body.workout.adviceSource).toBe('rules-engine');
    expect(advice.body.workout.advice).toMatch(/15/);

    const stats = await agent.get('/api/stats').expect(200);
    expect(stats.body.stats).toMatchObject({ totalWorkouts: 1, totalDistanceKm: 7.5, avgFatigue: 8, currentStreakDays: 1 });
    expect(stats.body.stats.weekly).toHaveLength(8);

    const list = await agent.get('/api/plans').expect(200);
    expect(list.body.plans[0]).toMatchObject({ completedSessions: 1, totalSessions: 16 });
  });

  it('isolates data between users', async () => {
    const a = await register('frank@example.com');
    await a.agent.put('/api/me/profile').send(profile).expect(200);
    const plan = (await a.agent.post('/api/plans/generate').send({})).body.plan;

    const b = await register('grace@example.com');
    await b.agent.get(`/api/plans/${plan.id}`).expect(404);
    await b.agent.delete(`/api/plans/${plan.id}`).expect(404);
    await b.agent.post('/api/workouts').send({ planId: plan.id, sessionId: 'w1-s1' }).expect(404);
    expect((await b.agent.get('/api/workouts')).body.workouts).toHaveLength(0);
  });

  it('stores chat history and answers honestly when no AI provider is configured', async () => {
    const { agent } = await register('heidi@example.com');
    const res = await agent.post('/api/chat').send({ message: 'Bonjour coach' }).expect(201);
    expect(res.body.messages).toHaveLength(2);
    expect(res.body.messages[1].source).toBeNull();
    const hist = await agent.get('/api/chat').expect(200);
    expect(hist.body.messages).toHaveLength(2);
    expect(hist.body.aiAvailable).toBe(false);
    await agent.delete('/api/chat').expect(200);
    expect((await agent.get('/api/chat')).body.messages).toHaveLength(0);
  });

  it('exports and deletes all personal data (GDPR)', async () => {
    const { agent } = await register('ivan@example.com');
    await agent.put('/api/me/profile').send(profile).expect(200);
    await agent.post('/api/plans/generate').send({}).expect(201);
    const exp = await agent.get('/api/me/export').expect(200);
    expect(exp.body.account.email).toBe('ivan@example.com');
    expect(exp.body.plans).toHaveLength(1);
    expect(exp.headers['content-disposition']).toMatch(/attachment/);

    await agent.post('/api/me/delete').send({ password: 'nope' }).expect(400);
    await agent.post('/api/me/delete').send({ password: 'Sup3rSecurePass' }).expect(200);
    await request(app).post('/api/auth/login').send({ email: 'ivan@example.com', password: 'Sup3rSecurePass' }).expect(401);
  });

  it('updates settings', async () => {
    const { agent } = await register('judy@example.com');
    const res = await agent.patch('/api/me/settings').send({ language: 'en', reminderTime: '18:30', remindersEnabled: false }).expect(200);
    expect(res.body.user).toMatchObject({ language: 'en', reminderTime: '18:30', remindersEnabled: false });
    await agent.patch('/api/me/settings').send({ reminderTime: '25:00' }).expect(400);
  });
});

describe('admin space', () => {
  it('is restricted to admins and exposes no health data', async () => {
    const athlete = await register('ken@example.com');
    await athlete.agent.get('/api/admin/stats').expect(403);

    const admin = request.agent(app);
    await admin.post('/api/auth/login').send({ email: 'admin@example.com', password: 'Sup3rSecurePass' }).expect(200);
    const stats = await admin.get('/api/admin/stats').expect(200);
    expect(stats.body.stats.users).toBeGreaterThan(5);
    const users = await admin.get('/api/admin/users?q=ken').expect(200);
    expect(users.body.users).toHaveLength(1);
    expect(Object.keys(users.body.users[0]).sort()).toEqual(
      ['createdAt', 'email', 'id', 'lastLoginAt', 'name', 'plans', 'role', 'workouts'].sort(),
    );
    await admin.patch(`/api/admin/users/${users.body.users[0].id}/role`).send({ role: 'admin' }).expect(200);
  });
});

describe('platform', () => {
  it('serves health, security headers, robots and sitemap', async () => {
    const health = await request(app).get('/api/health').expect(200);
    expect(health.body.status).toBe('ok');
    expect(health.headers['x-content-type-options']).toBe('nosniff');
    expect(health.headers['x-powered-by']).toBeUndefined();
    const robots = await request(app).get('/robots.txt').expect(200);
    expect(robots.text).toMatch(/Disallow: \/app/);
    const sitemap = await request(app).get('/sitemap.xml').expect(200);
    expect(sitemap.text).toMatch(/<loc>http:\/\/localhost:3000\/fonctionnalites<\/loc>/);
    expect(sitemap.text).not.toMatch(/connexion/);
  });

  it('returns JSON errors for unknown API routes and invalid JSON', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body.error.code).toBe('not_found');
    const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(bad.status).toBe(400);
  });
});
