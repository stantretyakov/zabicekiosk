/**
 * Structured logging with Winston
 */

import winston from 'winston';
import type { LoggingConfig } from '../config/types.js';

let logger: winston.Logger;

export function createLogger(config: LoggingConfig): winston.Logger {
  const format =
    config.format === 'json'
      ? winston.format.combine(winston.format.timestamp(), winston.format.json())
      : winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}]: ${message}${metaStr}`;
          })
        );

  logger = winston.createLogger({
    level: config.level,
    format,
    transports: [new winston.transports.Console()],
  });

  return logger;
}

export function getLogger(): winston.Logger {
  if (!logger) {
    // Fallback logger if not initialized
    logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      transports: [new winston.transports.Console()],
    });
  }
  return logger;
}

export { logger };
