import {Context} from "hono";
import {getRedis} from "../common/database";

// 定义操作函数
export const redisOp = async (c: Context) => {
    const redis = await getRedis();
    const data = await c.req.json<string[]>();
    try {
        let ret = await redis.send(data[0], data.slice(1));
        if (ret != undefined) {
            return c.json({message: '操作成功', data: ret, type: 'success'})
        } else {
            return c.json({message: '操作完成', type: 'success'})
        }
    } catch (e) {
        console.error('Redis operation error:', e)
        return c.json({message: e.message, type: 'error'}, 500);
    }
};
