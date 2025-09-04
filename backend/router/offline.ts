import {Context, Hono} from "hono";
import {createMiddleware} from 'hono/factory'
import {API_NODE_OFFLINE} from "../common/constants";

let active = 0
export const activeMiddleware = createMiddleware(async (c, next) => {
    if (c.req.path === API_NODE_OFFLINE) {
        return await next()
    }
    active++
    await next()
    active--
})


const offlineSelf = () => {
    if (active === 0) {
        process.exit(0)
    } else {
        setTimeout(offlineSelf, 1000)
    }
};

const nodeOffline = async (c: Context) => {
    offlineSelf()
    return c.json({message: 'ok'})
};

export const initOfflineRouter = (app: Hono) => {
    app.get(API_NODE_OFFLINE, nodeOffline)
    app.use('/*', activeMiddleware)
}