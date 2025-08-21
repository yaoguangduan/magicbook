import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    esbuild: {
        target: 'esnext',
    },
    build: {
        include: ['src/**/*.vue', 'src/**/*.ts'],
        module: "esnext",
        target: 'esnext',
        chunkSizeWarningLimit: 1024 * 1028 * 2,
        emptyOutDir: true,
        outDir: '../backend/static',
        rollupOptions: {
            output: {
                format: 'es'  // 确保输出 ES 模块
            }
        }
    },
    server: {
        allowedHosts: ["magicbook.com"],
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            }
        }
    }
})
