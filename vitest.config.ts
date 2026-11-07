import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      SCRYPT_LOG_N: '10',
      ADMIN_EMAILS: 'admin@example.com',
      GEMINI_API_KEY: '',
      IBM_WATSONX_API_KEY: '',
      DATABASE_URL: '',
    },
    testTimeout: 20_000,
  },
});
