import { UP_DOWN_DIR } from './dir';
import * as fs from 'fs/promises';
import path from 'path';
import logger from './logger';

// 文件清理配置
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30分钟检查一次
const FILE_MAX_AGE = 3 * 60 * 60 * 1000; // 3小时

let isRunning = false;

/**
 * 启动文件清理服务
 */
export const startFileCleaner = () => {
    if (isRunning) {
        return; // 已经在运行
    }
    
    isRunning = true;

    // 立即执行一次清理
    scheduleNextCleanup();
}

/**
 * 递归调度下一次清理，确保串行执行
 */
const scheduleNextCleanup = () => {
    setTimeout(async () => {
        try {
            await cleanup(); // 等待清理完成
        } catch (error) {
            logger.error('定时清理任务出错:', error);
        }
        
        // 清理完成后，再调度下一次
        scheduleNextCleanup();
    }, CLEANUP_INTERVAL);
}

/**
 * 执行文件清理
 */
const cleanup = async () => {
    try {
        const now = Date.now();
        const files = await fs.readdir(UP_DOWN_DIR);
        let deletedCount = 0;
        
        for (const file of files) {
            const filePath = path.join(UP_DOWN_DIR, file);
            try {
                const stats = await fs.stat(filePath);
                const fileAge = now - stats.mtime.getTime();
                
                // 如果文件超过3小时，删除它
                if (fileAge > FILE_MAX_AGE) {
                    await fs.unlink(filePath);
                    deletedCount++;
                    logger.info(`🗑️ 删除过期文件: ${file}`);
                }
            } catch (error) {
                // 忽略无法访问的文件
            }
        }
        
        if (deletedCount > 0) {
            logger.info(`✅ 清理完成: 删除了 ${deletedCount} 个文件`);
        }
    } catch (error) {
        logger.error('文件清理服务出错:', error);
    }
}
