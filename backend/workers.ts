import {Context, Hono} from "hono";
import {createMiddleware} from 'hono/factory'
import {proxy} from 'hono/proxy'
import {API_HEALTH_CHECK, API_NODE_OFFLINE, API_WORKER_REGISTER, API_WORKER_STATE, API_WORKER_HEARTBEAT, MAIN_PROC_LIST, MODE_MASTER, MODE_WORKER} from "./common/constants";
import {ConsistentHash} from "./common/hash";
import {always3, retry3, retry3Wait} from "./common/retry";
import {getExternalIP} from "./common/ip";
import logger from "./common/logger";

let active = 0
const hash = new ConsistentHash(50)
const workerHeartbeats = new Map<string, number>() // 存储worker的最后心跳时间
const HEARTBEAT_TIMEOUT = 30000 // 30秒心跳超时
export const workerRegister = async (c: Context) => {
    const {host, port} = await c.req.json<{ port: number, host: string }>()
    const workerUrl = `http://${host}:${port}`
    hash.addNode(workerUrl)
    logger.workerRegister(workerUrl)
    return c.json({message: 'ok'})
}

export const proxyMiddleware = createMiddleware(async (c, next) => {
    if (process.env.mode === MODE_WORKER || MAIN_PROC_LIST.includes(c.req.path)) {
        return await next()
    }
    const url = new URL(c.req.url);
    const host = url.host
    const node = hash.getNodeByKey(host);
    if (node === null || node === undefined) {
        return await next()
    }
    const targetUrl = node + url.pathname + url.search;

    // 代理请求，传递requestId给worker
    const before = Date.now()
    const headers = c.req.header()

    // 确保requestId传递给worker
    const requestIdValue = c.get('requestId') || c.var.requestId
    if (requestIdValue) {
        headers['x-request-id'] = requestIdValue
    }

    const requestInit = {
        method: c.req.method,
        headers,
        body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined
    }

    const response = await proxy(targetUrl, requestInit)


    return response
})
export const activeMiddleware = createMiddleware(async (c, next) => {
    if (c.req.path === API_NODE_OFFLINE) {
        return next()
    }
    active++
    await next()
    active--
})
const startOneWorker = () => {
    Bun.spawn([process.env.positionals.split(' ')[0],
        process.env.positionals.split(' ')[1],
        '--mode', MODE_WORKER,
        '--master', process.env.master], {
        env: {
            ...process.env,
        },
        stdout: 'inherit',
        stderr: 'inherit',
    })
};
export const startWorkers = (app: Hono) => {
    if (process.env.mode === MODE_MASTER) {
        const workerCount = Number.parseInt(process.env.workers || '0')
        if (workerCount > 0) {
            logger.info(`🚀 Starting ${workerCount} worker(s)...`)
            for (let i = 0; i < workerCount; i++) {
                startOneWorker()
            }
        } else {
            logger.info('📋 Master-only mode (no workers)')
        }
    }
}

const offlineSelf = () => {
    if (active === 0) {
        process.exit(0)
    } else {
        setTimeout(offlineSelf, 1000)
    }
};
const nodeOffline = async (c: Context) => {
    if (process.env.mode === MODE_MASTER) {
        for (let node of hash.getAllNodes()) {
            await retry3(async () => (await fetch(node + API_NODE_OFFLINE)).ok)
        }
    }
    offlineSelf()
    return c.json({message: 'ok'})
};
const workDetect = async () => {
    let urls = hash.getAllNodes()
    const current = urls.length
    let expected = Number.parseInt(process.env.workers || '0')
    const alive = async (node: string) => {
        try {
            return (await fetch(node + API_HEALTH_CHECK)).ok
        } catch (e) {
            return false
        }
    }

    const aliveList = new Array<string>()
    const deadList = new Array<string>()
    for (let url of urls) {
        if (await alive(url)) {
            aliveList.push(url)
        } else {
            deadList.push(url)
            hash.delNode(url)
        }
    }

    const offList = new Array<string>()
    urls = hash.getAllNodes()
    while (expected < urls.length) {
        const node = hash.getRandomNode()
        await always3(async () => {
            await fetch(node + API_NODE_OFFLINE)
        })
        offList.push(node)
        hash.delNode(node)
        urls = hash.getAllNodes()
    }
    while (expected > urls.length) {
        startOneWorker()
        expected--
    }
    logger.info('worker detect state', {expected, current, alive: aliveList.length, alives: aliveList, deads: deadList, to_offlines: offList})

    setTimeout(workDetect, 10000)
}
export const initWorkerAPIAndMiddleware = (app: Hono) => {
    if (process.env.mode === MODE_MASTER) {
        app.post(API_WORKER_REGISTER, workerRegister)
        app.get(API_WORKER_STATE, async (c: Context) => {
            return c.json({message: 'ok', cfg: process.env.workers, nodes: hash.getAllNodes()})
        })
        app.use('/api/*', proxyMiddleware)
        setTimeout(workDetect, 10000)
    }
    app.get(API_NODE_OFFLINE, nodeOffline)
    app.use('/*', activeMiddleware)
}
export const startAndRegisterWorkers = async (app: Hono, server: Bun.Server) => {
    try {
        if (process.env.mode === MODE_MASTER) {
            startWorkers(app)
        }
        if (process.env.mode === MODE_WORKER) {
            const b = await retry3Wait(async () => {
                const resp = await fetch(`${process.env.master}${API_WORKER_REGISTER}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        port: server.port,
                        host: getExternalIP(),
                    })
                })
                return resp.ok
            },10000)
            if (!b) {
                logger.error('Failed to register worker')
                process.exit(1)
            }
        }
    } catch (e) {
        logger.error('Failed to start and register workers:', e)
        process.exit(1)
    }
}