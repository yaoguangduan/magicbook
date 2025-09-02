import {parseArgs} from "util";
import {AUTH_FREE_APIS, MODE_MASTER, MODE_WORKER} from "../common/constants";
import {serveStatic} from "hono/bun";
import {Context, Hono} from "hono";
import {jwt} from "hono/jwt";
import {HTTPException} from "hono/http-exception";
import {requestId} from "hono/request-id";
import logger from "../log/logger";
import {startFileCleaner} from "../common/file-cleaner";
import path from "path";

export const initStatic = (app: Hono) => {
    if (config.mode === MODE_MASTER) {
        // 获取 server.js 所在的目录
        const serverDir = path.dirname(new URL(import.meta.url).pathname);

        app.use('/*', serveStatic({
            root: serverDir,
        }))
    }
}

export const initAuth = (app: Hono) => {
    app.use('/api/*', async (c: Context, next) => {
        if (AUTH_FREE_APIS.includes(c.req.path)) {
            return await next()
        }
        return jwt({
            secret: config.web.jwtSecret,
        })(c, next)
    })
}
export const initNotFoundAndErrorHand = (app: Hono) => {
    app.notFound((c) => {
        if (config.mode === MODE_MASTER) {
            return c.redirect('/')
        }
        return c.json({message: 'not found', type: 'error'}, 404)
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
        if (config.mode === MODE_WORKER && masterRequestId) {
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
            req: {
                method: c.req.method,
                url: c.req.url,
                path: c.req.path,
                headers: c.req.header(),
            }
        })

        c.set('logger', reqLogger)
        await next()
    })
}
