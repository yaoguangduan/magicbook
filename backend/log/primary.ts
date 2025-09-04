import winston from 'winston';
import path from 'path';
import fs from 'fs';

const LOG_DIR = process.env.LOG_DIR || './logs';
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, {recursive: true});
}

const customFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({stack: true}),
    winston.format.printf(({timestamp, level, message, ...meta}) => {
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
    winston.format.printf(({timestamp, level, message, ...meta}) => {
        let metaStr = '';
        if (Object.keys(meta).length > 0) {
            metaStr = ' ' + JSON.stringify(meta, null, 2);
        }
        return `[${timestamp}] [${level}] ${message}${metaStr}`;
    })
);

// 创建基础transports，避免重复创建
export const fileTransport =
    new winston.transports.File({
        filename: path.join(LOG_DIR, 'app.log'),
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 50, // 保留5个文件
        tailable: true,
        level: 'info'
    })
export const consoleTransport =
    new winston.transports.Console({
        format: consoleFormat,
        level: 'info'
    })
const createTransports = () => {
    return [
        consoleTransport,
        fileTransport
    ];
}

export const log = winston.createLogger({
    level: 'info',
    format: customFormat,
    transports: createTransports()
});