import {init} from "./env";
init()
import {initAuth, initNotFoundAndErrorHand, initRequestIdAndLogger, initStatic} from "./router/init";
import {initRouter} from "./router";
import {Hono} from 'hono';
import {prettyJSON} from 'hono/pretty-json'
import {MODE_MASTER} from "./common/constants";
import {initWorkerAPIAndMiddleware, startAndRegisterWorkers} from "./workers";
import cluster from "node:cluster";
import {getExternalIP} from "./common/ip";
const app = new Hono();

initStatic(app)
initRequestIdAndLogger(app)  // 日志中间件提前
initAuth(app)
initNotFoundAndErrorHand(app)
initWorkerAPIAndMiddleware(app)
app.use(prettyJSON());

await initRouter(app)

const server = Bun.serve({
    fetch: app.fetch,
    port: config.mode === MODE_MASTER ? 3000 : 0
})
const waitOk = async () => {
    while (true) {
        try {
            await fetch(`http://localhost:${server.port}/api/health`)
            break
        } catch (e) {
        }
    }
}
await waitOk()
const host = getExternalIP()
const port = server.port
logger.info('🚀 Server started at http://' + host + ':' + port)
if (config.mode === MODE_MASTER) {
    config.master = `http://${host}:${port}`
}

await startAndRegisterWorkers(app, server)