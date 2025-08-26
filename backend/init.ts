import {parseArgs} from "util";
import {AUTH_WRITE_LIST, MODE_MASTER, MODE_WORKER} from "./common/constants";
import {serveStatic} from "hono/bun";
import {Context, Hono} from "hono";
import {jwt} from "hono/jwt";
import {HTTPException} from "hono/http-exception";

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
}

export const initStatic = (app: Hono) => {
    if (process.env.mode === MODE_MASTER) {
        app.use('/*', serveStatic({
            root: './static',
            rewriteRequestPath: (path) => path.replace(/^\/static/, ''),
        }));
    }
}

export const initAuth = (app: Hono) => {
    app.use('/api/*', async (c: Context, next) => {
        if (process.env.mode === MODE_WORKER || AUTH_WRITE_LIST.includes(c.req.path)) {
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
export const initLogger = (app: Hono) => {
    app.use(async (c: Context, next) => {
        const before = Date.now()
        await next()
        console.log(new Date().toISOString(), process.env.mode, c.req.method, c.req.url, c.res.status, 'cost:', Date.now() - before, c.error ? c.error : '')
    })

}
