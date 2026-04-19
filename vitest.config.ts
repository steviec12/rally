import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    exclude: ['node_modules', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      // Unit test coverage scope: pure business logic (src/lib/) and API route handlers (src/app/api/).
      // UI components and Server Component pages are integration/E2E tested via /e2e/home.spec.ts and Playwright.
      include: ['src/lib/**/*.{ts,tsx}', 'src/app/api/**/*.ts'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/generated/**',
        'src/app/layout.tsx',
        // page.tsx Server Components and client UI components are covered by E2E tests in /e2e/home.spec.ts and Playwright.
        'src/app/**/page.tsx',
        'src/app/components/**',
        'src/app/**/layout.tsx',
      ],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
