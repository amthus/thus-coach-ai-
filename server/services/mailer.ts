import type { AppConfig } from '../config';

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
  readonly configured: boolean;
}

/**
 * SMTP mailer (nodemailer) when SMTP_URL is set. Otherwise, outside production,
 * messages are written to the server log so flows such as password reset remain testable.
 */
export function createMailer(config: AppConfig): Mailer {
  if (config.SMTP_URL) {
    let transport: import('nodemailer').Transporter | null = null;
    return {
      configured: true,
      async send(mail) {
        if (!transport) {
          const nodemailer = await import('nodemailer');
          transport = nodemailer.createTransport(config.SMTP_URL);
        }
        await transport.sendMail({ from: config.MAIL_FROM, ...mail });
      },
    };
  }
  return {
    configured: false,
    async send(mail) {
      if (config.isProd) {
        console.error(`[mailer] SMTP_URL is not configured; e-mail "${mail.subject}" was not sent.`);
        return;
      }
      if (!config.isTest) console.info(`[mailer:dev] To: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n`);
    },
  };
}
