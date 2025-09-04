import { SQL } from "bun";

let bunSQL: SQL | null = null;

// 初始化Bun SQL连接
async function initBunSQL() {
    if (bunSQL) {
        return bunSQL;
    }
    
    try {
        const serverUrl = config.mysql.url.replace(/\/magicbook$/, '/mysql');
        const serverSQL = new SQL(serverUrl);
        
        await serverSQL`CREATE DATABASE IF NOT EXISTS magicbook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

        bunSQL = new SQL(config.mysql.url);
        await bunSQL`SELECT 1 as test`;
        await initTables();
        return bunSQL;
    } catch (error) {
        logger.error('❌ MySQL connection failed:', error);
        bunSQL = null;
        throw error;
    }
}

// 初始化数据库表
async function initTables() {
    if (!bunSQL) {
        throw new Error('MySQL连接未初始化');
    }
    
    try {
        // 创建用户表
        await bunSQL`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_username (username)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        // 创建通用的KV存储表
        await bunSQL`
            CREATE TABLE IF NOT EXISTS kv_store (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                user_id INT NOT NULL,
                json_data JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_type_name_user (type, name, user_id),
                INDEX idx_type (type),
                INDEX idx_name (name),
                INDEX idx_user_id (user_id),
                INDEX idx_type_user (type, user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        await initDefaultUser();
        
    } catch (error) {
        logger.error('❌ 初始化数据库表失败:', error);
        throw error;
    }
}

// 初始化默认用户
async function initDefaultUser() {
    if (!bunSQL) {
        throw new Error('MySQL连接未初始化');
    }
    
    try {
        const rows = await bunSQL`
            SELECT id FROM users WHERE username = ${'root'}
        `;
        
        if (!rows || rows.length === 0) {
            await bunSQL`
                INSERT INTO users (username, password) VALUES (${'root'}, ${'root'})
            `;
            console.log('✅ 初始化默认用户成功');
        }
    } catch (error) {
        console.error('❌ 初始化默认用户失败:', error);
        throw error;
    }
}

// 获取Bun SQL实例
export const getMySQL = async (): Promise<SQL> => {
    if (!bunSQL) {
        try {
            await initBunSQL();
        } catch (error) {
            logger.error('❌ 无法初始化 MySQL 连接:', error);
            throw new Error(`MySQL 连接失败: ${error.message}`);
        }
    }
    
    if (!bunSQL) {
        throw new Error('MySQL 连接未初始化');
    }
    
    return bunSQL;
}

// 关闭连接
export const closeMySQL = async () => {
    if (bunSQL) {
        bunSQL = null;
        console.log('✅ MySQL 连接已关闭');
    }
}
