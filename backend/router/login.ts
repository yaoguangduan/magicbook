import {Context} from "hono";
import {findByUsername, verifyPassword} from "../database/modules/User";
import {sign} from "hono/jwt";

export const login = async (c: Context) => {
    const {username, password, remember} = await c.req.json<{ username: string, password: string, remember: boolean }>()

    try {
        const isValid = await verifyPassword(username, password)

        if (!isValid) {
            return c.json({message: '用户名或密码错误', type: 'error'}, 400)
        }

        // 获取用户信息以获取用户ID
        const user = await findByUsername(username)
        if (!user) {
            return c.json({message: '用户不存在', type: 'error'}, 400)
        }

        const token = await sign({
            username: username,
            user_id: user.id,
            exp: Math.floor(Date.now() / 1000) + (remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24),
        }, config.web.jwtSecret)

        return c.json({message: '登录成功', type: 'success', token: token})
    } catch (error) {
        logger.error('登录失败:', error)
        return c.json({message: '登录失败，请稍后重试', type: 'error'}, 500)
    }
}
