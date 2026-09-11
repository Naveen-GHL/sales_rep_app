import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:../../database/dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'nexus_super_secret_jwt_key_2026_ghl_jamin',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'nexus_super_secret_refresh_jwt_key_2026',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
};
