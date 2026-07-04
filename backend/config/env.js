// Loads .env and validates required variables at boot.
//
// Import this FIRST in index.js (before any other import) so a misconfigured
// server crashes loudly at startup instead of running in an insecure or
// half-working state (e.g. signing JWTs with the dev fallback secret, or
// booting with no database URI).
import 'dotenv/config';

export const IS_PROD = process.env.NODE_ENV === 'production';

// Required in every environment.
const required = ['SECRET_KEY', 'MONGO_URI'];

// Only required in production. In development you can run without email or
// image uploads working, so these are optional locally.
if (IS_PROD) {
  required.push(
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'EMAIL_FROM',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'BACKEND_URL',
    'FSQ_KEY', // venue search (gameRoutes) 500s without it
  );
}

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `❌ Missing required environment variable(s) for NODE_ENV=${process.env.NODE_ENV || 'development'}:\n   ${missing.join('\n   ')}`,
  );
  process.exit(1);
}

// Never let the insecure dev fallback secret reach production.
if (IS_PROD && process.env.SECRET_KEY === 'dev-secret-key') {
  console.error('❌ SECRET_KEY is still the insecure dev default. Set a real secret in production.');
  process.exit(1);
}

console.log(`✅ Environment: ${IS_PROD ? 'production' : 'development'} — config OK`);
