import {download, downloadByToken, upload} from "./updown";
import {pdfConvert, pdfDecrypt, pdfEncrypt, pdfMerge, pdfSetPass} from "./pdf";
import {Hono} from "hono";
import {login} from "./login";
import {redisOp} from "./redis";
import {doReq} from "./http";
import {API_HEALTH_CHECK, MODE_MASTER, MODE_WORKER} from "../common/constants";
import logger from "../common/logger";

// Master专用路由
const initMasterRoutes = (app: Hono) => {
    // 认证相关
    app.post('/api/auth/login', login)
}

// Worker专用路由  
const initWorkerRoutes = (app: Hono) => {
    // 文件操作
    app.post('/api/upload', upload)
    app.get('/api/download', download)
    app.get('/api/download/token', downloadByToken)  // token下载，无需认证

    // HTTP代理
    app.post('/api/http', doReq)

    // Redis操作
    app.post('/api/redis', redisOp)

    // PDF处理
    app.post('/api/pdf/merge', pdfMerge)
    app.post('/api/pdf/setpass', pdfSetPass)
    app.post('/api/pdf/encrypt', pdfEncrypt)
    app.post('/api/pdf/decrypt', pdfDecrypt)
    app.post('/api/pdf/convert', pdfConvert)
}

// 共享路由（Master和Worker都有）
const initSharedRoutes = (app: Hono) => {
    app.get(API_HEALTH_CHECK, (c) => c.text('ok'))
}

// 根据模式初始化路由
export const initRouter = async (app: Hono) => {
    const mode = process.env.mode || MODE_MASTER

    // 所有模式都需要共享路由
    initSharedRoutes(app)

    // 根据模式初始化特定路由
    if (mode === MODE_MASTER) {
        // Master需要注册自己的路由
        initMasterRoutes(app)

        // Master也要注册Worker路由，以便在没有Worker时能处理请求
        initWorkerRoutes(app)
    } else if (mode === MODE_WORKER) {
        // Worker只需要注册Worker路由
        initWorkerRoutes(app)
    } else {
        logger.error(`Unknown mode: ${mode}`)
        throw new Error(`Unknown mode: ${mode}`)
    }
}
