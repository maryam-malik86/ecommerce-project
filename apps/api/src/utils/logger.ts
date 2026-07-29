import winston from 'winston';
import { env } from '../config/env.js';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const developmentFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${ts}] ${level}: ${stack ?? message}${metaStr}`;
  }),
);

const productionFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports: [
    new winston.transports.Console(),
    // In production, add file transports or external log service here
    ...(env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});
