import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'workpulse-super-secret-jwt-key-2026',
  jwtExpireMinutes: parseInt(process.env.JWT_EXPIRE_MINUTES || '1440', 10), // 24 hours
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.AI_MODEL || 'gemini-3.7-flash',
  mongoUri: process.env.MONGODB_URI || '',
  databaseName: process.env.DATABASE_NAME || 'workpulse_db',
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  nodeEnv: process.env.NODE_ENV || 'development',
};
