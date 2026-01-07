// vite.config.ts
import { fileURLToPath, URL } from 'node:url'; // Necessário
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'; // Importado

export default defineConfig({
    // 🎯 ADICIONANDO O ARRAY DE PLUGINS
    plugins: [
        vue(), // <-- AGORA O PLUGIN ESTÁ ATIVADO!
    ],

    
    // ...
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)) 
        }
    }
});