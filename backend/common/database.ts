import {RedisClient} from "bun";

let redis: RedisClient | null = null;

async function initRedis(redisUrl: string) {
    if (redis) {
        return
    }
    try {
        redis = new RedisClient(redisUrl, {
            connectionTimeout: 3000,
            autoReconnect: true,
            maxRetries: 3,
        });
        await redis.connect();
        const root = await redis.hgetall('user:root');
        if (root === null || Object.keys(root).length === 0) {
            await redis.hmset('user:root', ['username', 'root', 'password', 'root']);
        }
    } catch (error) {
        logger.error('❌ Redis connection failed:', error);
    }
}

// 获取 Redis 实例（确保已初始化）
export const getRedis = async (): Promise<RedisClient> =>{
    if (!redis) {
        await initRedis(config.redis.url);
    }
    return redis;
}
