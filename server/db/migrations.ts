import type { Kysely } from 'kysely';
import type { Database } from './schema';

type Migration = { name: string; up: (db: Kysely<any>) => Promise<void> };

/**
 * Forward-only, idempotent migrations. Append new entries; never edit an applied one.
 * Only portable column types are used so the same code runs on PostgreSQL and SQLite.
 */
const MIGRATIONS: Migration[] = [
  {
    name: '001_initial_schema',
    async up(db) {
      await db.schema
        .createTable('users')
        .ifNotExists()
        .addColumn('id', 'text', (c) => c.primaryKey())
        .addColumn('email', 'text', (c) => c.notNull().unique())
        .addColumn('name', 'text', (c) => c.notNull())
        .addColumn('password_hash', 'text', (c) => c.notNull())
        .addColumn('role', 'text', (c) => c.notNull().defaultTo('athlete'))
        .addColumn('language', 'text', (c) => c.notNull().defaultTo('fr'))
        .addColumn('reminders_enabled', 'integer', (c) => c.notNull().defaultTo(1))
        .addColumn('reminder_time', 'text', (c) => c.notNull().defaultTo('08:00'))
        .addColumn('terms_accepted_at', 'text', (c) => c.notNull())
        .addColumn('health_consent_at', 'text', (c) => c.notNull())
        .addColumn('created_at', 'text', (c) => c.notNull())
        .addColumn('updated_at', 'text', (c) => c.notNull())
        .addColumn('last_login_at', 'text')
        .execute();

      await db.schema
        .createTable('auth_sessions')
        .ifNotExists()
        .addColumn('id', 'text', (c) => c.primaryKey())
        .addColumn('user_id', 'text', (c) => c.notNull().references('users.id').onDelete('cascade'))
        .addColumn('created_at', 'text', (c) => c.notNull())
        .addColumn('expires_at', 'text', (c) => c.notNull())
        .addColumn('user_agent', 'text')
        .execute();
      await db.schema.createIndex('auth_sessions_user_idx').ifNotExists().on('auth_sessions').column('user_id').execute();

      await db.schema
        .createTable('password_resets')
        .ifNotExists()
        .addColumn('id', 'text', (c) => c.primaryKey())
        .addColumn('user_id', 'text', (c) => c.notNull().references('users.id').onDelete('cascade'))
        .addColumn('expires_at', 'text', (c) => c.notNull())
        .addColumn('used_at', 'text')
        .addColumn('created_at', 'text', (c) => c.notNull())
        .execute();

      await db.schema
        .createTable('profiles')
        .ifNotExists()
        .addColumn('user_id', 'text', (c) => c.primaryKey().references('users.id').onDelete('cascade'))
        .addColumn('age', 'integer', (c) => c.notNull())
        .addColumn('level', 'text', (c) => c.notNull())
        .addColumn('frequency', 'integer', (c) => c.notNull())
        .addColumn('avg_distance', 'real', (c) => c.notNull())
        .addColumn('objective', 'text', (c) => c.notNull())
        .addColumn('custom_objective', 'text', (c) => c.notNull().defaultTo(''))
        .addColumn('injury_history', 'text', (c) => c.notNull().defaultTo(''))
        .addColumn('resting_hr', 'integer')
        .addColumn('max_hr', 'integer')
        .addColumn('weight_kg', 'real')
        .addColumn('coach_id', 'text', (c) => c.notNull().defaultTo('michel'))
        .addColumn('ai_provider', 'text', (c) => c.notNull().defaultTo('gemini'))
        .addColumn('updated_at', 'text', (c) => c.notNull())
        .execute();

      await db.schema
        .createTable('plans')
        .ifNotExists()
        .addColumn('id', 'text', (c) => c.primaryKey())
        .addColumn('user_id', 'text', (c) => c.notNull().references('users.id').onDelete('cascade'))
        .addColumn('objective_label', 'text', (c) => c.notNull())
        .addColumn('level_label', 'text', (c) => c.notNull())
        .addColumn('coach_tips', 'text', (c) => c.notNull())
        .addColumn('weeks_json', 'text', (c) => c.notNull())
        .addColumn('source', 'text', (c) => c.notNull())
        .addColumn('coach_id', 'text', (c) => c.notNull())
        .addColumn('is_active', 'integer', (c) => c.notNull().defaultTo(0))
        .addColumn('created_at', 'text', (c) => c.notNull())
        .execute();
      await db.schema.createIndex('plans_user_idx').ifNotExists().on('plans').columns(['user_id', 'created_at']).execute();

      await db.schema
        .createTable('workout_logs')
        .ifNotExists()
        .addColumn('id', 'text', (c) => c.primaryKey())
        .addColumn('user_id', 'text', (c) => c.notNull().references('users.id').onDelete('cascade'))
        .addColumn('plan_id', 'text', (c) => c.notNull().references('plans.id').onDelete('cascade'))
        .addColumn('session_id', 'text', (c) => c.notNull())
        .addColumn('session_title', 'text', (c) => c.notNull())
        .addColumn('session_type', 'text', (c) => c.notNull())
        .addColumn('planned_duration_minutes', 'integer', (c) => c.notNull())
        .addColumn('fatigue', 'integer')
        .addColumn('actual_duration_minutes', 'integer')
        .addColumn('actual_distance_km', 'real')
        .addColumn('avg_hr', 'integer')
        .addColumn('notes', 'text', (c) => c.notNull().defaultTo(''))
        .addColumn('advice', 'text')
        .addColumn('advice_source', 'text')
        .addColumn('completed_at', 'text', (c) => c.notNull())
        .addUniqueConstraint('workout_logs_plan_session_uq', ['plan_id', 'session_id'])
        .execute();
      await db.schema
        .createIndex('workout_logs_user_idx')
        .ifNotExists()
        .on('workout_logs')
        .columns(['user_id', 'completed_at'])
        .execute();

      await db.schema
        .createTable('chat_messages')
        .ifNotExists()
        .addColumn('id', 'text', (c) => c.primaryKey())
        .addColumn('user_id', 'text', (c) => c.notNull().references('users.id').onDelete('cascade'))
        .addColumn('role', 'text', (c) => c.notNull())
        .addColumn('content', 'text', (c) => c.notNull())
        .addColumn('coach_id', 'text', (c) => c.notNull())
        .addColumn('source', 'text')
        .addColumn('created_at', 'text', (c) => c.notNull())
        .execute();
      await db.schema
        .createIndex('chat_messages_user_idx')
        .ifNotExists()
        .on('chat_messages')
        .columns(['user_id', 'created_at'])
        .execute();
    },
  },
];

export async function migrate(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('app_migrations')
    .ifNotExists()
    .addColumn('name', 'text', (c) => c.primaryKey())
    .addColumn('applied_at', 'text', (c) => c.notNull())
    .execute();

  const applied = new Set((await db.selectFrom('app_migrations').select('name').execute()).map((r) => r.name));
  for (const m of MIGRATIONS) {
    if (applied.has(m.name)) continue;
    await db.transaction().execute(async (trx) => {
      await m.up(trx);
      await trx.insertInto('app_migrations').values({ name: m.name, applied_at: new Date().toISOString() }).execute();
    });
  }
}
