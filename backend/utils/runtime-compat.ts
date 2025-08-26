/**
 * Runtime Compatibility Utilities
 * 提供Node.js和Bun运行时的兼容性封装
 */

// 检测当前运行时环境
export const runtime = {
    // 检测是否为Node.js环境
    isNode: typeof process !== 'undefined' && process.versions && process.versions.node,
    
    // 检测是否为Bun环境
    isBun: typeof Bun !== 'undefined',
    
    // 检测是否为Web Worker环境
    isWorker: typeof self !== 'undefined' && typeof importScripts !== 'undefined',
    
    // 检测是否为浏览器环境
    isBrowser: typeof window !== 'undefined',
    
    // 获取运行时名称
    get name() {
        if (this.isBun) return 'bun'
        if (this.isNode) return 'node'
        if (this.isBrowser) return 'browser'
        if (this.isWorker) return 'worker'
        return 'unknown'
    },
    
    // 获取运行时版本
    get version() {
        if (this.isBun && typeof Bun !== 'undefined') return Bun.version
        if (this.isNode && process.versions) return process.versions.node
        return 'unknown'
    }
}

// 环境变量兼容性封装
export const env = {
    // 获取环境变量，兼容Node.js和Bun
    get(key: string, defaultValue?: string): string | undefined {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            return Bun.env[key] ?? defaultValue
        }
        
        if (runtime.isNode && typeof process !== 'undefined') {
            return process.env[key] ?? defaultValue
        }
        
        return defaultValue
    },
    
    // 设置环境变量
    set(key: string, value: string): void {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            Bun.env[key] = value
        }
        
        if (runtime.isNode && typeof process !== 'undefined') {
            process.env[key] = value
        }
    },
    
    // 获取所有环境变量
    getAll(): Record<string, string | undefined> {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            return Bun.env
        }
        
        if (runtime.isNode && typeof process !== 'undefined') {
            return process.env
        }
        
        return {}
    }
}

// 进程相关兼容性封装
export const proc = {
    // 获取当前工作目录
    cwd(): string {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            return process.cwd() // Bun也支持process.cwd()
        }
        
        if (runtime.isNode && typeof process !== 'undefined') {
            return process.cwd()
        }
        
        return '.'
    },
    
    // 获取命令行参数
    argv(): string[] {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            return process.argv // Bun也支持process.argv
        }
        
        if (runtime.isNode && typeof process !== 'undefined') {
            return process.argv
        }
        
        return []
    },
    
    // 退出进程
    exit(code: number = 0): never {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            process.exit(code) // Bun也支持process.exit()
        }
        
        if (runtime.isNode && typeof process !== 'undefined') {
            process.exit(code)
        }
        
        throw new Error(`Process exit with code ${code}`)
    },
    
    // 获取进程ID
    get pid(): number {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            return process.pid // Bun也支持process.pid
        }
        
        if (runtime.isNode && typeof process !== 'undefined') {
            return process.pid
        }
        
        return -1
    }
}

// 文件系统兼容性封装
export const fs = {
    // 写文件 - 兼容Bun.write和Node.js fs
    async writeFile(path: string, data: string | ArrayBuffer | Uint8Array): Promise<void> {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            await Bun.write(path, data)
            return
        }
        
        if (runtime.isNode) {
            const fs = await import('fs/promises')
            if (data instanceof ArrayBuffer) {
                await fs.writeFile(path, new Uint8Array(data))
            } else {
                await fs.writeFile(path, data)
            }
            return
        }
        
        throw new Error('Unsupported runtime for file operations')
    },
    
    // 读文件
    async readFile(path: string): Promise<ArrayBuffer> {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            const file = Bun.file(path)
            return await file.arrayBuffer()
        }
        
        if (runtime.isNode) {
            const fs = await import('fs/promises')
            const buffer = await fs.readFile(path)
            return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
        }
        
        throw new Error('Unsupported runtime for file operations')
    },
    
    // 读取文本文件
    async readTextFile(path: string): Promise<string> {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            const file = Bun.file(path)
            return await file.text()
        }
        
        if (runtime.isNode) {
            const fs = await import('fs/promises')
            return await fs.readFile(path, 'utf-8')
        }
        
        throw new Error('Unsupported runtime for file operations')
    },
    
    // 检查文件是否存在
    async exists(path: string): Promise<boolean> {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            const file = Bun.file(path)
            return await file.exists()
        }
        
        if (runtime.isNode) {
            const fs = await import('fs/promises')
            try {
                await fs.access(path)
                return true
            } catch {
                return false
            }
        }
        
        return false
    }
}

// HTTP客户端兼容性封装
export const http = {
    // 发送HTTP请求 - 优先使用各运行时的原生实现
    async fetch(url: string | URL, options?: RequestInit): Promise<Response> {
        // Bun有优化的fetch实现
        if (runtime.isBun && typeof Bun !== 'undefined') {
            return await fetch(url, options)
        }
        
        // Node.js 18+有内置fetch
        if (runtime.isNode && typeof fetch !== 'undefined') {
            return await fetch(url, options)
        }
        
        // Node.js 18以下版本，抛出错误提示升级
        if (runtime.isNode) {
            throw new Error('Node.js 18+ required for fetch API, or install node-fetch polyfill')
        }
        
        throw new Error('Unsupported runtime for HTTP requests')
    }
}

// 性能测量兼容性封装
export const perf = {
    // 高精度时间戳
    now(): number {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            return performance.now() // Bun支持performance API
        }
        
        if (runtime.isNode && typeof performance !== 'undefined') {
            return performance.now()
        }
        
        if (runtime.isNode && typeof process !== 'undefined') {
            const hrTime = process.hrtime()
            return hrTime[0] * 1000 + hrTime[1] / 1000000
        }
        
        return Date.now()
    },
    
    // 内存使用情况
    memory(): { used: number; total: number } {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            // Bun特有的内存统计
            const memoryUsage = process.memoryUsage()
            return {
                used: memoryUsage.rss,
                total: memoryUsage.rss + memoryUsage.external
            }
        }
        
        if (runtime.isNode && typeof process !== 'undefined') {
            const memoryUsage = process.memoryUsage()
            return {
                used: memoryUsage.rss,
                total: memoryUsage.rss + memoryUsage.external
            }
        }
        
        return { used: 0, total: 0 }
    }
}

// 加密和哈希兼容性封装
export const crypto = {
    // 生成随机字节
    async randomBytes(length: number): Promise<Uint8Array> {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            // 使用Web Crypto API在Bun中
            return globalThis.crypto.getRandomValues(new Uint8Array(length))
        }
        
        if (runtime.isNode) {
            const crypto = await import('crypto')
            return new Uint8Array(crypto.randomBytes(length))
        }
        
        if (typeof globalThis.crypto !== 'undefined') {
            return globalThis.crypto.getRandomValues(new Uint8Array(length))
        }
        
        throw new Error('Unsupported runtime for crypto operations')
    },
    
    // 计算哈希
    async hash(algorithm: string, data: string | Uint8Array): Promise<string> {
        if (runtime.isBun && typeof Bun !== 'undefined') {
            const hasher = new Bun.CryptoHasher(algorithm as any)
            hasher.update(data)
            return hasher.digest('hex')
        }
        
        if (runtime.isNode) {
            const crypto = await import('crypto')
            return crypto.createHash(algorithm).update(data).digest('hex')
        }
        
        throw new Error('Unsupported runtime for crypto operations')
    }
}

// 日志兼容性封装
export const logger = {
    // 彩色日志输出
    info(message: string, ...args: any[]): void {
        if (runtime.isBun || runtime.isNode) {
            console.log(`\x1b[36m[INFO]\x1b[0m ${message}`, ...args)
        } else {
            console.log(`[INFO] ${message}`, ...args)
        }
    },
    
    warn(message: string, ...args: any[]): void {
        if (runtime.isBun || runtime.isNode) {
            console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`, ...args)
        } else {
            console.warn(`[WARN] ${message}`, ...args)
        }
    },
    
    error(message: string, ...args: any[]): void {
        if (runtime.isBun || runtime.isNode) {
            console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`, ...args)
        } else {
            console.error(`[ERROR] ${message}`, ...args)
        }
    },
    
    debug(message: string, ...args: any[]): void {
        if (env.get('NODE_ENV') === 'development' || env.get('DEBUG') === 'true') {
            if (runtime.isBun || runtime.isNode) {
                console.debug(`\x1b[90m[DEBUG]\x1b[0m ${message}`, ...args)
            } else {
                console.debug(`[DEBUG] ${message}`, ...args)
            }
        }
    }
}

// 导出便捷的运行时检查函数
export const isNode = runtime.isNode
export const isBun = runtime.isBun
export const isWorker = runtime.isWorker
export const isBrowser = runtime.isBrowser

// 导出一个完整的兼容性对象
export const compat = {
    runtime,
    env,
    proc,
    fs,
    http,
    perf,
    crypto,
    logger
}

export default compat
