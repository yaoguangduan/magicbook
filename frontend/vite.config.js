import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    base: './', // 设置为相对路径，这样资源引用就是相对的
    esbuild: {
        target: 'esnext',
    },
    define: {
        global: 'globalThis',
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
                format: 'es',  // 确保输出 ES 模块
                // 禁用代码分割，生成单个JS文件
                manualChunks: undefined,
                inlineDynamicImports: true,
                // 自定义文件名
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name].[ext]'
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
