import { createApp, type ClientOptions } from './app';
import { config } from './config';
import { createDb } from './db';
import { AiGateway } from './services/ai';
import { createMailer } from './services/mailer';

/** Builds a fully wired application. Shared by the long-running server and the serverless handler. */
export async function bootstrap(client: ClientOptions) {
  const db = await createDb({ databaseUrl: config.DATABASE_URL, sqlitePath: config.SQLITE_PATH, ssl: config.DATABASE_SSL });
  const ctx = { db, config, ai: new AiGateway(config), mailer: createMailer(config) };
  const app = await createApp(ctx, client);
  return { app, ctx };
}
