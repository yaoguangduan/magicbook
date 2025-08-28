import pino from 'pino'
import {MODE_MASTER} from './constants'
import * as fs from 'fs'

// 创建日志文件名
const createLogFileName = () => {
    const mode = process.env.mode || MODE_MASTER
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    if (mode === MODE_MASTER) {
        return `master-${date}.log`
    } else {
        return `worker-${process.pid}-${date}.log`
    }
}

// 创建Pino实例
const createPinoInstance = () => {
    const mode = process.env.mode || MODE_MASTER
    const isDev = process.env.ENV !== 'prod'
    const logDir = process.env.LOG_DIR || './logs'

    // 基础配置
    const config: pino.LoggerOptions = {
        name: 'magicbook',
        level: process.env.LOG_LEVEL || 'info',
        base: {
            mode,
            pid: process.pid
        },
        timestamp: pino.stdTimeFunctions.isoTime
    }

    // 生产环境：同时写入文件和stdout
    if (!isDev) {
        // 确保日志目录存在
        try {
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, {recursive: true})
            }
        } catch (error) {
            console.warn('Warning: Could not create log directory:', error)
        }

        const logFile = `${logDir}/${createLogFileName()}`

        config.transport = {
            targets: [
                // 文件输出（轮转）
                {
                    target: 'pino-roll',
                    options: {
                        file: logFile,
                        frequency: 'daily',        // 按日期轮转
                        size: '100m',             // 100MB轮转
                        limit: {
                            count: 10             // 保留10个文件
                        },
                        mkdir: true               // 确保目录存在
                    },
                    level: 'info'
                },
                // 控制台输出（带颜色）
                {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                        ignore: 'pid,hostname,name',
                        messageFormat: `[${mode.toUpperCase()}] {msg}`,
                        singleLine: true
                    },
                    level: 'info'
                }
            ]
        }
    } else {
        // 开发环境：彩色控制台输出
        config.transport = {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'yyyy-mm-dd HH:MM:ss.l',
                ignore: 'pid,hostname,name',
                messageFormat: `[${mode.toUpperCase()}] {msg}`,
                singleLine: true
            }
        }
    }

    return pino(config)
}

class Logger {
    private pino: pino.Logger | null = null

    constructor() {
        // 延迟初始化，不在构造函数中创建pino实例
    }

    debug(message: string, meta?: any) {
        this.ensureInitialized()
        this.pino!.debug(meta, message)
    }

    info(message: string, meta?: any) {
        this.ensureInitialized()
        this.pino!.info(meta, message)
    }

    warn(message: string, meta?: any) {
        this.ensureInitialized()
        this.pino!.warn(meta, message)
    }

    error(message: string, meta?: any) {
        this.ensureInitialized()
        this.pino!.error(meta, message)
    }

    // Worker管理相关日志
    workerUp(url: string) {
        this.info(`✅ Worker started: ${url}`, {worker: {url, action: 'start'}})
    }

    workerDown(url: string) {
        this.warn(`⭕ Worker down: ${url}`, {worker: {url, action: 'down'}})
    }

    workerRegister(url: string) {
        this.info(`➕ Worker registered `, {worker: {url, action: 'register'}})
    }

    workerOffline(url: string) {
        this.warn(`➖ Worker offline: ${url}`, {worker: {url, action: 'offline'}})
    }

    // 系统启动日志
    serverStart(host: string, port: number) {
        const url = `http://${host}:${port}`
        this.info(`🚀 Server started`, {
            info: {host, port, url}
        })
    }

    // 获取原始pino实例
    getPino() {
        this.ensureInitialized()
        return this.pino!
    }

    // 创建子logger
    child(bindings: any) {
        this.ensureInitialized()
        const childPino = this.pino!.child(bindings)
        const childLogger = Object.create(this)
        childLogger.pino = childPino
        return childLogger
    }

    // 确保pino实例已初始化
    private ensureInitialized() {
        if (!this.pino) {
            this.pino = createPinoInstance()
        }
    }
}

export const logger = new Logger()
export default logger
