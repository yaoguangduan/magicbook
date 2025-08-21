import {download, upload} from "./updown";
import {pdfConvert, pdfDecrypt, pdfEncrypt, pdfMerge, pdfSetPass} from "./pdf";
import {Context, Hono} from "hono";
import {proxyMiddleware, workerRegister} from "./workers";

export const initRouter = async (app: Hono) => {
    app.use('/api/*', proxyMiddleware)

    app.post('/innerapi/worker/register',  workerRegister)
    app.get('/api/health', (c) => c.text('ok'))
    app.post('/api/upload', upload)
    app.get('/api/download', download)
    app.post('/api/pdf/merge', pdfMerge)
    app.post('/api/pdf/setpass', pdfSetPass)
    app.post('/api/pdf/encrypt', pdfEncrypt)
    app.post('/api/pdf/decrypt', pdfDecrypt)
    app.post('/api/pdf/convert', pdfConvert)
}
