import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

// Lazily create transporter to avoid crashing if SMTP is not configured
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });

  return _transporter;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  if (!env.SMTP_HOST) {
    logger.warn('SMTP not configured — skipping email send', { to: options.to, subject: options.subject });
    return;
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info('Email sent', { to: options.to, subject: options.subject });
  } catch (err) {
    logger.error('Failed to send email', { error: err, to: options.to });
    throw err;
  }
}
