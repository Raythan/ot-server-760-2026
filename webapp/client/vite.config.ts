import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiPort = env.VITE_DEV_API_PORT || '3847';
  const apiHost = env.VITE_DEV_API_HOST || '127.0.0.1';
  const clientPort = Number(env.VITE_DEV_CLIENT_PORT || 5173);

  return {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
        manifest: {
          name: 'Tenebra OT — Contas',
          short_name: 'Tenebra OT',
          description: 'Tenebra OT — criar conta e personagens',
          theme_color: '#1a1a24',
          background_color: '#16171d',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        },
      }),
    ],
    server: {
      port: clientPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://${apiHost}:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
