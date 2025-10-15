import pg from 'pg';
import { AWS_CONFIG } from './aws.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

// Configuration du pool de connexions PostgreSQL
const pool = new Pool({
  host: AWS_CONFIG.rds.host,
  port: AWS_CONFIG.rds.port,
  database: AWS_CONFIG.rds.database,
  user: AWS_CONFIG.rds.user,
  password: AWS_CONFIG.rds.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Test de connexion
pool.on('connect', () => {
  logger.info('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Fonction helper pour les requêtes
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error', { text, error: error.message });
    throw error;
  }
};

// Fonction pour obtenir un client du pool
export const getClient = () => pool.connect();

// Initialisation de la base de données
export const initDatabase = async () => {
  try {
    // Création des tables si elles n'existent pas
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        cognito_sub VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS partitions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        composer VARCHAR(255),
        key VARCHAR(50),
        category VARCHAR(50) NOT NULL,
        messe_part VARCHAR(100),
        tags TEXT[],
        storage_path VARCHAR(500) NOT NULL,
        download_url TEXT NOT NULL,
        file_size INTEGER,
        file_type VARCHAR(50),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_partitions_category ON partitions(category);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_partitions_created_by ON partitions(created_by);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub);
    `);

    logger.info('✅ Database initialized successfully');
  } catch (error) {
    logger.error('❌ Database initialization failed', error);
    throw error;
  }
};

export default pool;
