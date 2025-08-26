import {download, upload} from "./updown";
import {pdfConvert, pdfDecrypt, pdfEncrypt, pdfMerge, pdfSetPass} from "./pdf";
import {Hono} from "hono";
import {login} from "./login";
import {redisOp} from "./redis";
import {doReq} from "./http";

export const initRouter = async (app: Hono) => {
    app.post('/api/auth/login', login)

    app.get('/api/health', (c) => c.text('ok'))
    app.post('/api/upload', upload)
    app.get('/api/download', download)
    app.post('/api/redis', redisOp)

    app.post('/api/http', doReq)

    app.post('/api/pdf/merge', pdfMerge)
    app.post('/api/pdf/setpass', pdfSetPass)
    app.post('/api/pdf/encrypt', pdfEncrypt)
    app.post('/api/pdf/decrypt', pdfDecrypt)
    app.post('/api/pdf/convert', pdfConvert)
}
