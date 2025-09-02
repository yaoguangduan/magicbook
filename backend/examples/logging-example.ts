#!/usr/bin/env bun
/**
 * Pino日志系统使用示例（修复Bun兼容性问题）
 */

import {Hono} from 'hono'
import {initEnv, initRequestIdAndLogger} from '../router/init'
import logger from '../log/logger'

// 初始化环境
initEnv()

const app = new Hono()

// 初始化requestId和日志中间件
initRequestIdAndLogger(app)

// 示例路由：展示如何使用logger
app.get('/test', (c) => {
    // 获取请求级别的logger（自动包含requestId）
    const reqLogger = c.get('logger')
    const requestId = c.get('requestId')

    // 使用请求级别的logger（包含requestId）
    reqLogger.info('Processing test request', {
        userId: 123,
        action: 'test'
    })

    // 使用全局logger
    logger.info('Global log message', {
        requestId,
        module: 'test-handler'
    })

    return c.json({
        message: 'Test completed',
        requestId
    })
})

app.post('/upload', async (c) => {
    const reqLogger = c.get('logger')
    const requestId = c.get('requestId')

    try {
        reqLogger.info('Starting file upload')

        // 模拟处理
        await new Promise(resolve => setTimeout(resolve, 100))

        reqLogger.info('File upload completed', {
            fileSize: 1024,
            fileName: 'test.pdf'
        })

        return c.json({success: true, requestId})
    } catch (error) {
        reqLogger.error('File upload failed', {error: error.message})
        return c.json({error: 'Upload failed'}, 500)
    }
})

// 测试错误日志
app.get('/error', (c) => {
    const reqLogger = c.get('logger')
    reqLogger.error('Simulated error for testing')
    return c.json({error: 'Test error'}, 500)
})

// 启动示例服务器
if (import.meta.main) {
    const server = Bun.serve({
        fetch: app.fetch,
        port: 3001
    })

    logger.serverStart('localhost', server.port)

    console.log('🚀 Example server running on http://localhost:3001')
    console.log('📝 Test endpoints:')
    console.log('  GET  http://localhost:3001/test')
    console.log('  POST http://localhost:3001/upload')
    console.log('  GET  http://localhost:3001/error')
    console.log('')
    console.log('💡 Try with curl:')
    console.log('  curl http://localhost:3001/test')
    console.log('  curl -X POST http://localhost:3001/upload')
    console.log('  curl http://localhost:3001/error')
}
