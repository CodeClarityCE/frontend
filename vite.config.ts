import { fileURLToPath, URL } from 'node:url';
import EnvironmentPlugin from 'vite-plugin-environment';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools'

import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// https://vitejs.dev/config/
export default defineConfig({
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler' // or "modern"
            }
        },
        postcss: {
            plugins: [tailwind(), autoprefixer()]
        }
    },
    plugins: [vue(), vueDevTools(), EnvironmentPlugin('all')],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
});
