import {init} from "./env";
import {initAuth, initNotFoundAndErrorHand, initRequestIdAndLogger, initStatic} from "./router/init";
import {initRouter} from "./router";
import {Hono} from 'hono';
import {prettyJSON} from 'hono/pretty-json'
import {initOfflineRouter} from "./router/offline";
import {getExternalIP} from "./common/ip";
import logger from "./log/logger";
import {getMySQL} from "./database/mysql";

init()

const app = new Hono();

initRequestIdAndLogger(app)  // 日志中间件提前
initAuth(app)
initOfflineRouter(app)
initStatic(app)  // 静态文件中间件在notFound之前
initNotFoundAndErrorHand(app)  // notFound处理器放在最后
app.use(prettyJSON());

await initRouter(app)

const server = Bun.serve({
    fetch: app.fetch,
    port: runtime.port,
    reusePort: true,
    development: false
})
const host = getExternalIP()
const port = server.port
logger.info('🚀 Server started at http://' + host + ':' + port)
