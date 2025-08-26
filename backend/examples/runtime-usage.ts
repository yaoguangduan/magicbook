/**
 * Runtime Compatibility Usage Examples
 * 展示如何使用runtime-compat模块编写兼容Node.js和Bun的代码
 */

import { compat, runtime, env, proc, fs, http, perf, crypto, logger } from '../utils/runtime-compat.js'

// 1. 基本运行时检测
export function detectRuntime() {
    logger.info(`Running on ${runtime.name} ${runtime.version}`)
    
    if (runtime.isBun) {
        logger.info('Using Bun optimizations')
    } else if (runtime.isNode) {
        logger.info('Using Node.js compatibility mode')
    }
}

// 2. 环境变量处理
export function handleEnvironment() {
    // 兼容的环境变量访问
    const port = env.get('PORT', '3000')
    const dbUrl = env.get('DATABASE_URL')
    const isDev = env.get('NODE_ENV') === 'development'
    
    logger.info(`Server will run on port ${port}`)
    logger.info(`Development mode: ${isDev}`)
    
    // 设置环境变量
    env.set('APP_INITIALIZED', 'true')
}

// 3. 文件操作兼容性
export async function fileOperations() {
    const configPath = './config.json'
    
    try {
        // 检查文件是否存在
        if (await fs.exists(configPath)) {
            // 读取文本文件
            const content = await fs.readTextFile(configPath)
            const config = JSON.parse(content)
            logger.info('Config loaded:', config)
        } else {
            // 写入默认配置
            const defaultConfig = {
                name: 'MagicBook',
                version: '1.0.0',
                runtime: runtime.name
            }
            
            await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2))
            logger.info('Default config created')
        }
    } catch (error) {
        logger.error('File operation failed:', error)
    }
}

// 4. HTTP请求兼容性
export async function httpOperations() {
    try {
        const startTime = perf.now()
        
        // 使用兼容的fetch API
        const response = await http.fetch('https://api.github.com/repos/microsoft/typescript', {
            headers: {
                'User-Agent': `MagicBook-${runtime.name}/${runtime.version}`
            }
        })
        
        const endTime = perf.now()
        
        if (response.ok) {
            const data = await response.json()
            logger.info(`GitHub API request completed in ${(endTime - startTime).toFixed(2)}ms`)
            logger.info(`Repository: ${data.full_name}, Stars: ${data.stargazers_count}`)
        }
    } catch (error) {
        logger.error('HTTP request failed:', error)
    }
}

// 5. 加密操作兼容性
export async function cryptoOperations() {
    try {
        // 生成随机字节
        const randomBytes = await crypto.randomBytes(16)
        logger.info(`Random bytes generated: ${Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`)
        
        // 计算哈希
        const text = 'Hello, MagicBook!'
        const hash = await crypto.hash('sha256', text)
        logger.info(`SHA256 hash of "${text}": ${hash}`)
    } catch (error) {
        logger.error('Crypto operation failed:', error)
    }
}

// 6. 性能监控兼容性
export function performanceMonitoring() {
    const startTime = perf.now()
    
    // 模拟一些工作
    const data = Array.from({ length: 100000 }, (_, i) => i * 2)
    const sum = data.reduce((a, b) => a + b, 0)
    
    const endTime = perf.now()
    const memory = perf.memory()
    
    logger.info(`Calculation completed in ${(endTime - startTime).toFixed(2)}ms`)
    logger.info(`Result: ${sum}`)
    logger.info(`Memory usage: ${(memory.used / 1024 / 1024).toFixed(2)}MB`)
}

// 7. 进程信息兼容性
export function processInfo() {
    logger.info(`Process ID: ${proc.pid}`)
    logger.info(`Working Directory: ${proc.cwd()}`)
    logger.info(`Command Line Args: ${proc.argv().join(' ')}`)
    
    // 获取所有环境变量
    const allEnv = env.getAll()
    const envCount = Object.keys(allEnv).length
    logger.info(`Environment variables count: ${envCount}`)
}

// 8. 完整的兼容性示例
export async function fullCompatibilityExample() {
    logger.info('=== Runtime Compatibility Demo ===')
    
    // 检测运行时
    detectRuntime()
    
    // 处理环境变量
    handleEnvironment()
    
    // 文件操作
    await fileOperations()
    
    // HTTP请求
    await httpOperations()
    
    // 加密操作
    await cryptoOperations()
    
    // 性能监控
    performanceMonitoring()
    
    // 进程信息
    processInfo()
    
    logger.info('=== Demo Completed ===')
}

// 9. 错误处理和降级策略
export function errorHandlingExample() {
    try {
        // 尝试使用Bun特有功能
        if (runtime.isBun) {
            logger.info('Using Bun-specific optimizations')
            // Bun特有的代码
        } else if (runtime.isNode) {
            logger.info('Using Node.js compatibility mode')
            // Node.js特有的代码
        } else {
            logger.warn('Unknown runtime, using basic functionality')
            // 基础兼容性代码
        }
    } catch (error) {
        logger.error('Runtime-specific operation failed, falling back to basic implementation')
        // 降级处理
    }
}

// 10. 导出所有示例函数
export default {
    detectRuntime,
    handleEnvironment,
    fileOperations,
    httpOperations,
    cryptoOperations,
    performanceMonitoring,
    processInfo,
    fullCompatibilityExample,
    errorHandlingExample
}

// 如果直接运行这个文件，执行完整示例
if (import.meta.main || proc.argv().includes(import.meta.filename)) {
    fullCompatibilityExample().catch(error => {
        logger.error('Demo failed:', error)
        proc.exit(1)
    })
}
