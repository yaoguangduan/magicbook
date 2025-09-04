import {parseArgs} from "util";
import {AUTH_FREE_APIS} from "../common/constants";
import {serveStatic} from "hono/bun";
import {Context, Hono} from "hono";
import {jwt} from "hono/jwt";
import {HTTPException} from "hono/http-exception";
import {requestId} from "hono/request-id";
import {startFileCleaner} from "../common/file-cleaner";
import path from "path";

// 扩展Context类型以包含用户信息
declare module "hono" {
    interface ContextVariableMap {
        user: {
            username: string;
            user_id: number;
        };
    }
}

export const initStatic = (app: Hono) => {
    app.use('/*', serveStatic({
        root: './backend/static',
        rewriteRequestPath: (path) => path.replace(/^\/backend\/static/, '')
    }))
}

export const initAuth = (app: Hono) => {
    app.use('/api/*', async (c: Context, next) => {
        if (AUTH_FREE_APIS.includes(c.req.path)) {
            return await next()
        }
        
        // 使用JWT中间件进行认证，并在认证成功后解析用户信息
        return jwt({
            secret: config.web.jwtSecret,
        })(c, async () => {
            const payload = c.get('jwtPayload') as any;
            if (payload) {
                c.set('user', {
                    username: payload.username,
                    user_id: payload.user_id
                });
            }
            await next()
        })
    })
}
export const initNotFoundAndErrorHand = (app: Hono) => {
    app.notFound((c) => {
        if (c.req.path === '/') {
            return c.redirect('/index.html')
        }
        return c.redirect('/')
    })
    app.onError((err, c) => {
        if (err instanceof HTTPException) {
            return c.json({message: err.message, code: err.name, type: 'error'}, err.status)
        }
        return c.json({message: err.message, code: err.name, type: 'error'}, 500)
    })
}
export const initRequestIdAndLogger = (app: Hono) => {
    app.use(async (c: Context, next) => {
        const masterRequestId = c.req.header('x-request-id')
        if (masterRequestId) {
            c.set('requestId', masterRequestId)
            return await next()
        } else {
            return await requestId()(c, next)
        }
    })

    app.use(async (c: Context, next) => {
        const currentRequestId = c.get('requestId') || c.var.requestId

        const reqLogger = logger.child({
            requestId: currentRequestId,
        })
        c.set('logger', reqLogger)

        await next()
        if (c.req.path.indexOf('/api') === -1) {
            return
        }
        logger.info('client request', {
            requestId: currentRequestId,
            url: c.req.url,
            method: c.req.method,
            query: c.req.queries(),
            headers: c.req.header(),
            body:await c.req.text(),
            resp:{
                status: c.res.status,
                statusText: c.res.statusText,
                headers: c.res.headers,
            }
        })
    })
}
