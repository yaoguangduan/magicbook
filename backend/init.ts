import {parseArgs} from "util";
import {AUTH_FREE_APIS, MODE_MASTER, MODE_WORKER} from "./common/constants";
import {serveStatic} from "hono/bun";
import {Context, Hono} from "hono";
import {jwt} from "hono/jwt";
import {HTTPException} from "hono/http-exception";
import {requestId} from "hono/request-id";
import logger from "./common/logger";

process.env.CANVAS_SILENT = 'true';
process.env.CANVAS_VERBOSE = 'false';
process.env.CANVAS_DEBUG = 'false';
export const initEnv = () => {

    const {values, positionals} = parseArgs({
        args: Bun.argv,
        options: {
            mode: {
                type: 'string',
            },
            workers: {
                type: 'string',
            },
            master: {
                type: 'string',
            }
        },
        strict: true,
        allowPositionals: true,
    });

    process.env.positionals = positionals.join(' ')
    for (let key in values) {
        process.env[key] = values[key]
    }

    if (process.env.mode === undefined) {
        process.env.mode = MODE_MASTER
    }
    if (process.env.JWT_SECRET === undefined) {
        process.env.JWT_SECRET = '123456'
    }
    if (process.env.REDIS_URL === undefined) {
        process.env.REDIS_URL = 'redis://:dtdyq@114.55.118.115:6379'
    }
    if (process.env.master === undefined) {
        process.env.master = 'http://localhost:3000'
    }
}
export const initStatic = (app: Hono) => {
    if (process.env.mode === MODE_MASTER) {
        app.use('/*', serveStatic({
            root: './backend/static',
            rewriteRequestPath: (path) => path.replace(/^\/backend\/static/, ''),
        }))
    }
}

export const initAuth = (app: Hono) => {
    app.use('/api/*', async (c: Context, next) => {
        if (AUTH_FREE_APIS.includes(c.req.path)) {
            return next()
        }
        return jwt({
            secret: process.env.JWT_SECRET,
        })(c, next)
    })
}
export const initNotFoundAndErrorHand = (app: Hono) => {
    app.notFound((c) => {
        if (process.env.mode === MODE_MASTER) {
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
        if (process.env.mode === MODE_WORKER && masterRequestId) {
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
                userAgent: c.req.header('user-agent'),
                contentType: c.req.header('content-type')
            }
        })

        // 绑定到context
        c.set('logger', reqLogger)
        c.set('requestId', currentRequestId)

        // 记录请求开始
        const startTime = Date.now()

        await next()

        // 只记录有问题的请求
        const duration = Date.now() - startTime
        const status = c.res.status

        if (status >= 400) {
            const logLevel = status >= 500 ? 'error' : 'warn'
            const message = `${c.req.method} ${c.req.url} ${status} ${duration}ms`

            reqLogger[logLevel](message, {
                res: {
                    statusCode: status,
                    responseTime: duration
                }
            })
        }
    })
}
