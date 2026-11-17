import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Dev only: run the aggregate server alongside Vite with `npm run dev:server`.
  server: { proxy: { '/api': 'http://localhost:3000' } },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
  },
});
