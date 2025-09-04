import {init} from "./env";
init()
import {initAuth, initNotFoundAndErrorHand, initRequestIdAndLogger, initStatic} from "./router/init";
import {initRouter} from "./router";
import {Hono} from 'hono';
import {prettyJSON} from 'hono/pretty-json'
import {initOfflineRouter} from "./router/offline";
import {getExternalIP} from "./common/ip";
import logger from "./log/logger";
import {getMySQL} from "./database/database";
const app = new Hono();

// 初始化MySQL连接
try {
    await getMySQL();
    logger.info('✅ MySQL 连接初始化成功');
} catch (error) {
    logger.error('❌ MySQL 连接初始化失败:', error);
    process.exit(1);
}

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
