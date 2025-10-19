import { fileURLToPath, URL } from 'node:url';
import EnvironmentPlugin from 'vite-plugin-environment';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), vueDevTools(), tailwindcss(), EnvironmentPlugin('all')],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
});
