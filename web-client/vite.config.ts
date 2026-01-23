import { cwd } from 'node:process';
import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { customBuildPlugin } from './src/buildPlugin';

export default ({ mode }: { mode: string }) => {
    process.env = {
        ...process.env,
        ...loadEnv(mode, cwd(), ''),
    };

    return defineConfig({
        build: {
            sourcemap: true,
        },
        plugins: [
            preact(),
            tailwindcss(),
            VitePWA({
                strategies: 'generateSW',
                registerType: 'autoUpdate',
                workbox: {
                    clientsClaim: true,
                    cleanupOutdatedCaches: true,
                    skipWaiting: true,
                    globPatterns: ['**\/*.{js,wasm,css,html,svg}'],
                    runtimeCaching: [
                        {
                            // Cache Google Fonts CSS
                            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'google-fonts-cache',
                                expiration: {
                                    maxEntries: 10,
                                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                                },
                                cacheableResponse: {
                                    statuses: [0, 200],
                                },
                            },
                        },
                        {
                            // Cache Google Fonts files
                            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'google-fonts-assets',
                                expiration: {
                                    maxEntries: 30,
                                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                                },
                                cacheableResponse: {
                                    statuses: [0, 200],
                                },
                            },
                        },
                    ],
                },
                devOptions: {
                    enabled: true,
                    type: 'module',
                },
            }),
            customBuildPlugin(),
        ],
        server: {
            proxy: {
                '/api': {
                    target: `http://localhost:${process.env.UEKPZ4_PORT || 4000}`,
                    changeOrigin: true,
                },
            },
        },
    });
};
