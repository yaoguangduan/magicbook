import {initAuth, initEnv, initNotFoundAndErrorHand, initRequestIdAndLogger, initStatic} from "./init";
import {initRouter} from "./router";
import {Hono} from 'hono';
import {prettyJSON} from 'hono/pretty-json'
import {MODE_MASTER} from "./common/constants";
import {initWorkerAPIAndMiddleware, startAndRegisterWorkers} from "./workers";
import logger from "./common/logger";

import {getExternalIP} from "./common/ip";

const app = new Hono();
initEnv()
initStatic(app)
initAuth(app)
initNotFoundAndErrorHand(app)
initRequestIdAndLogger(app)
initWorkerAPIAndMiddleware(app)
app.use(prettyJSON());

await initRouter(app)

const server = Bun.serve({
    fetch: app.fetch,
    port: process.env.mode === MODE_MASTER ? 3000 : 0
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
logger.serverStart(host, port)
process.env.host = `${host}:${port}`
if (process.env.mode === MODE_MASTER) {
    process.env.master = `http://${host}:${port}`
}

await startAndRegisterWorkers(app, server)