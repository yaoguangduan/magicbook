import {download, downloadByToken, upload} from "./updown";
import {Hono} from "hono";
import {login} from "./login";
import {mysqlOp} from "./mysql";
import {doReq} from "./http";
import {API_HEALTH_CHECK} from "../common/constants";

// Master专用路由
const initMasterRoutes = (app: Hono) => {
    // 认证相关
    app.post('/api/auth/login', login)
    // 文件操作
    app.post('/api/upload', upload)
    app.get('/api/download', download)
    app.get('/api/download/token', downloadByToken)  // token下载，无需认证

    // HTTP代理
    app.post('/api/http', doReq)

    // MySQL操作
    app.post('/api/mysql', mysqlOp)
}


export const initRouter = async (app: Hono) => {

    app.get(API_HEALTH_CHECK, (c) => {
        return c.text('ok')
    })

    initMasterRoutes(app)
}
