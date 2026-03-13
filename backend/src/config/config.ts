import dotenv from 'dotenv';

dotenv.config();

type Environment = 'development' | 'production' | 'test';

interface Config {
  env: Environment;
  port: number;
  databaseUrl: string;
  frontendUrl: string;
  bcrypt: {
    rounds: number;
  };
  session: {
    secret: string;
    maxAge: number;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
  };
  rabbitmq: {
    url: string;
  };
}

const isDevelopment = process.env.NODE_ENV !== 'production';

const config: Config = {
  env: (process.env.NODE_ENV as Environment) || 'development',
  port: parseInt(process.env.PORT || '6677', 10),
  databaseUrl: process.env.DATABASE_URL!,
  frontendUrl: process.env.FRONTEND_URL!,

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },

  session: {
    secret: process.env.SESSION_SECRET || 'fallback-secret-CHANGE-ME',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10),
    secure: !isDevelopment, // Disabled in development, enabled in production
    sameSite: isDevelopment ? 'lax' : 'strict',
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
  },
};

// Required environment variables validation

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

if (!config.frontendUrl) {
  throw new Error('FRONTEND_URL is required');
}

if (config.env === 'production' && config.session.secret.includes('fallback')) {
  throw new Error('SESSION_SECRET must be set in production');
}

// Startup log

console.log('[config] Loaded successfully');
console.log(`[config] env=${config.env} port=${config.port}`);
console.log(`[config] frontend_url=${config.frontendUrl}`);
console.log(`[config] secure_cookies=${config.session.secure} same_site=${config.session.sameSite}`);

export default config;