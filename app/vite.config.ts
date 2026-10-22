import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Firebase is most of the bundle; a separate chunk stays cached across app updates.
  build: { rollupOptions: { output: { manualChunks: { firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'] } } }, chunkSizeWarningLimit: 700 }
});
