import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // اجازه دسترسی به دامنه دارکوب
    allowedHosts: [
      'safa27-payesh.darkube.ir',
      '.darkube.ir' // برای پذیرش هر زیردامنه‌ای از دارکوب
    ]
  }
});