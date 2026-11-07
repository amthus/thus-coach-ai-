import fs from 'node:fs';
import path from 'node:path';
import { Kysely, PostgresDialect, SqliteDialect, type SqliteDatabase, type SqliteStatement } from 'kysely';
import type { Database } from './schema';
import { migrate } from './migrations';

export type DB = Kysely<Database>;

/**
 * Adapts Node's built-in `node:sqlite` (Node >= 22.5) to the interface Kysely's SqliteDialect expects.
 * Avoids native add-ons so local development and CI work everywhere without compilation.
 */
async function createNodeSqlite(file: string): Promise<SqliteDatabase> {
  const { DatabaseSync } = await import('node:sqlite');
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

  return {
    close: () => db.close(),
    prepare(sql: string): SqliteStatement {
      const stmt = db.prepare(sql);
      const reader = /^\s*(select|with|pragma)\b/i.test(sql) || /\breturning\b/i.test(sql);
      const norm = (params: ReadonlyArray<unknown>) =>
        params.map((p) => (typeof p === 'boolean' ? (p ? 1 : 0) : p)) as never[];
      return {
        reader,
        all: (params) => stmt.all(...norm(params)) as unknown[],
        run: (params) => {
          const r = stmt.run(...norm(params));
          return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
        },
        iterate: (params) => stmt.iterate(...norm(params)) as IterableIterator<unknown>,
      };
    },
  };
}

export interface DbOptions {
  databaseUrl?: string;
  sqlitePath?: string;
  ssl?: boolean;
}

export async function createDb(opts: DbOptions): Promise<DB> {
  let db: DB;
  if (opts.databaseUrl) {
    const { default: pg } = await import('pg');
    // Return NUMERIC/BIGINT as JS numbers (values in this app are small).
    pg.types.setTypeParser(20, (v) => Number(v));
    pg.types.setTypeParser(1700, (v) => Number(v));
    db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new pg.Pool({
          connectionString: opts.databaseUrl,
          max: Number(process.env.DATABASE_POOL_MAX ?? 10),
          ssl: opts.ssl ? { rejectUnauthorized: false } : undefined,
        }),
      }),
    });
  } else {
    db = new Kysely<Database>({
      dialect: new SqliteDialect({ database: await createNodeSqlite(opts.sqlitePath ?? ':memory:') }),
    });
  }
  await migrate(db);
  return db;
}
