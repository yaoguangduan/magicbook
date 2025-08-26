import {initAuth, initEnv, initLogger, initNotFoundAndErrorHand, initStatic} from "./init";
import {initRouter} from "./router";
import {Hono} from 'hono';
import {prettyJSON} from 'hono/pretty-json'
import {MODE_MASTER} from "./common/constants";
import {initWorkerAndMiddleware, registerIfIsWorker} from "./workers";

const app = new Hono();
initEnv()
initStatic(app)
initAuth(app)
initNotFoundAndErrorHand(app)
initLogger(app)
initWorkerAndMiddleware(app)
app.use(prettyJSON());

await initRouter(app)
const server = Bun.serve({
    fetch: app.fetch,
    port: process.env.mode === MODE_MASTER ? 3000 : 0
})
console.log(`Server started at http://localhost:${server.port}`)
await registerIfIsWorker(app, server)