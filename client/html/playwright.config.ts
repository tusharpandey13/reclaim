import { defineConfig } from '@playwright/test';

// Runs against the Vite dev server, which serves the invented data in fake/. Nothing here needs the backend.
const PORT = Number(process.env.E2E_PORT ?? 5172);

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  workers: 4,
  timeout: 30000,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    colorScheme: 'light',
    timezoneId: 'Asia/Kolkata',
    locale: 'en-IN',
    serviceWorkers: 'block',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: { command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`, port: PORT, reuseExistingServer: false },
});
