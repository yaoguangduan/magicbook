import {Context, Hono} from "hono";
import {createMiddleware} from 'hono/factory'
import {proxy} from 'hono/proxy'
import {MAIN_PROC_LIST, MODE_MASTER, MODE_WORKER, URL_WORKER_REGISTER} from "./common/constants";

const workerMap: Map<string, string> = new Map()

export const workerRegister = async (c: Context) => {
    const {host, port} = await c.req.json<{ port: number, host: string }>()
    workerMap.set(`${host}:${port}`, c.req.url)
    return c.json({message: 'ok'})
}
export const proxyMiddleware = createMiddleware(async (c, next) => {
    if (process.env.mode === MODE_WORKER || MAIN_PROC_LIST.includes(c.req.path)) {
        return await next()
    }
    const ws = Array.from(workerMap.keys());
    const random = Math.floor(Math.random() * ws.length);
    if (ws[random] === undefined) {
        return await next()
    }
    const url = new URL(c.req.url);
    const targetUrl = ws[random] + url.pathname + url.search;
    return proxy(targetUrl, {
        ...c.req,
        headers: c.req.header(),
    })
})
export const initWorkers = (app: Hono) => {
    if (process.env.mode === MODE_MASTER) {
        for (let i = 0; i < Number.parseInt(process.env.workers || '1'); i++) {
            Bun.spawn([process.env.positionals.split(' ')[0], '--watch', process.env.positionals.split(' ')[1], '--mode', MODE_WORKER], {
                env: {
                    ...process.env,
                },
                stdout: 'inherit',
                stderr: 'inherit',
            })
        }
    }
}
const workDetect = () => {
    const urls = Array.from(workerMap.keys())
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        fetch(url + "/api/health").then(res => {
            if (!res.ok) {
                console.log('worker ' + url + ' is down')
                workerMap.delete(url)
            } else {
                console.log('worker ' + url + ' is up')
            }
        })
    }
    setTimeout(workDetect, 30000)
}
export const initWorkerAndMiddleware = (app: Hono) => {
    initWorkers(app)
    if (process.env.mode === MODE_MASTER) {
        app.post('/api/worker/register', workerRegister)
    }
    app.use('/api/*', proxyMiddleware)
    setTimeout(workDetect, 30000)
}
export const registerIfIsWorker = async (app: Hono, server: Bun.Server) => {
    try {
        if (process.env.mode === MODE_WORKER) {
            console.log(`Server register to main http://localhost:${server.port}`)
            const resp = await fetch(`http://localhost:3000${URL_WORKER_REGISTER}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    port: server.port,
                    host: 'localhost',
                })
            })
            if (!resp.ok) {
                console.error('reguster error', await resp.json())
                process.exit(1)
            }
            console.log('register result:', await resp.text())
        }
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}