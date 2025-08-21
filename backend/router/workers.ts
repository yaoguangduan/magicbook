import {Context} from "hono";
import { createMiddleware } from 'hono/factory'
import { proxy } from 'hono/proxy'
const workerMap:Map<string,String> = new Map()

export const workerRegister = async (c:Context) =>{
    const {host,port} = await c.req.json<{port:number,host:string}>()
    workerMap.set(`${host}:${port}`,c.req.url)
    return c.json({message:'ok'})
}
export const proxyMiddleware = createMiddleware(async (c, next) => {
    if (process.env.mode === 'sub') {
        return await next()
    }
    const ws = Array.from(workerMap.keys());
    const random = Math.floor(Math.random() * ws.length);
    if (ws[random] === undefined) {
        return await next()
    }
    const url = new URL(c.req.url);
    const targetUrl = ws[random] + url.pathname + url.search;
    return proxy(targetUrl,{
        ...c.req,
        headers:c.req.header(),
    })
})