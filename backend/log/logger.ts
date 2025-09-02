import winston from 'winston';
import path from 'path';
import fs from 'fs';

// 确保日志目录存在
const LOG_DIR = process.env.LOG_DIR || './logs';
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 自定义日志格式
const customFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        // 重新组织字段顺序，把关键信息放在前面
        const logEntry = {
            timestamp,
            level,
            message,
            ...meta
        };
        return JSON.stringify(logEntry);
    })
);

// 控制台格式（美化输出）
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss.SSS'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let metaStr = '';
        if (Object.keys(meta).length > 0) {
            metaStr = ' ' + JSON.stringify(meta, null, 2);
        }
        return `[${timestamp}] [${level}] ${message}${metaStr}`;
    })
);

// 创建基础transports，避免重复创建
const createTransports = () => [
    // 控制台输出
    new winston.transports.Console({
        format: consoleFormat,
        level: process.env.CONSOLE_LOG_LEVEL || 'info'
    }),
    
    // 所有日志都放在一个文件中
    new winston.transports.File({
        filename: path.join(LOG_DIR, 'app.log'),
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 5, // 保留5个文件
        tailable: true,
        level: process.env.FILE_LOG_LEVEL || 'info'
    })
];

// 创建logger实例
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    transports: createTransports()
});

// 开发环境下的额外配置
if (process.env.NODE_ENV === 'development') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
        level: 'debug'
    }));
}

// 创建子logger的工厂函数 - 使用defaultMeta而不是创建新的transports
const createChildLogger = (context: any) => {
    // 直接使用主logger，通过defaultMeta添加上下文
    // 这样可以避免创建新的transports和事件监听器
    return {
        error: (message: string, meta?: any) => logger.error(message, { ...context, ...meta }),
        warn: (message: string, meta?: any) => logger.warn(message, { ...context, ...meta }),
        info: (message: string, meta?: any) => logger.info(message, { ...context, ...meta }),
        debug: (message: string, meta?: any) => logger.debug(message, { ...context, ...meta }),
        verbose: (message: string, meta?: any) => logger.verbose(message, { ...context, ...meta }),
        child: (childContext: any) => createChildLogger({ ...context, ...childContext }),
        close: () => logger.close()
    };
};

// 导出logger实例和工具函数
export default {
    // 基础日志方法
    error: (message: string, meta?: any) => logger.error(message, meta),
    warn: (message: string, meta?: any) => logger.warn(message, meta),
    info: (message: string, meta?: any) => logger.info(message, meta),
    debug: (message: string, meta?: any) => logger.debug(message, meta),
    verbose: (message: string, meta?: any) => logger.verbose(message, meta),
    
    // 创建子logger
    child: createChildLogger,
    
    // 获取原始winston实例（用于高级配置）
    getWinstonLogger: () => logger,
    
    // 关闭logger
    close: () => logger.close()
};

// 类型定义
export interface Logger {
    error: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    info: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
    verbose: (message: string, meta?: any) => void;
    child: (context: any) => Logger;
    close: () => void;
}