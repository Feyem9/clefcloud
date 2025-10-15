import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Format personnalisé
const customFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Configuration du logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    // Console
    new winston.transports.Console({
      format: combine(
        colorize(),
        customFormat
      )
    }),
    // Fichier pour les erreurs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Fichier pour tous les logs
    new winston.transports.File({
      filename: 'logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Si on n'est pas en production, log aussi en debug
if (process.env.NODE_ENV !== 'production') {
  logger.level = 'debug';
}

export default logger;
