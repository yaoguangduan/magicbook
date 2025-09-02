import {Context} from "hono";
import {getRedis} from "../common/database";
import {sign} from "hono/jwt";

export const login = async (c: Context) => {
    const redis = await getRedis()
    const {username, password, remember} = await c.req.json<{ username: string, password: string, remember: boolean }>()
    const user = await redis.hgetall(`user:${username}`)

    if (user === null || Object.keys(user).length === 0) {
        return c.json({message: '用户不存在', type: 'error'}, 400)
    }
    if (user.password !== password) {
        return c.json({message: '密码错误', type: 'error'}, 400)
    }
    const token = await sign({
        username: username,
        exp: Math.floor(Date.now() / 1000) + (remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24),
    }, config.web.jwtSecret)
    return c.json({message: '登录成功', type: 'success', token: token})
}
