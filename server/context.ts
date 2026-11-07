import type { AppConfig } from './config';
import type { DB } from './db';
import type { AiGateway } from './services/ai';
import type { Mailer } from './services/mailer';

export interface AppContext {
  db: DB;
  config: AppConfig;
  ai: AiGateway;
  mailer: Mailer;
}
