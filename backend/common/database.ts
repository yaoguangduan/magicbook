import {RedisClient} from "bun";

const redis = new RedisClient(process.env.REDIS_URL || 'redis://:dtdyq@114.55.118.115:6379', {
    connectionTimeout: 3000,
    autoReconnect: true,
    maxRetries: 3,
});
await redis.connect()
const root = await redis.hgetall('user:root')
if (root === null || Object.keys(root).length === 0) {
    await redis.hmset('user:root', ['username', 'root', 'password', 'root'])
}
export {redis}