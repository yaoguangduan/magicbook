import {initRouter} from "./router";
import {Context, Hono} from 'hono';
import {serveStatic} from 'hono/bun'
import {prettyJSON} from 'hono/pretty-json'
import {parseArgs} from 'util'

process.env.CANVAS_SILENT = 'true';
process.env.CANVAS_VERBOSE = 'false';
process.env.CANVAS_DEBUG = 'false';

const { values, positionals } = parseArgs({
    args: Bun.argv,
    options: {
        mode: {
            type: 'string',
        },
        workers: {
            type: 'string',
        },
    },
    strict: true,
    allowPositionals: true,
});

for (let key in values) {
    process.env[key] = values[key]
}
if (process.env.mode === undefined) {
    process.env.mode = 'main'
}
const app = new Hono();
if(process.env.mode === 'main') {
    console.log('main mode')
    app.use('/*', serveStatic({
        root: './static',
        rewriteRequestPath: (path) => path.replace(/^\/static/, ''),
    }));
}
app.onError((err, c) => {
    console.error(err)
    return c.json({message: err.message,code:err.name, type: 'error'}, 500)
})
app.use(prettyJSON());
app.use(async (c: Context, next) => {
    const before = Date.now()
    await next()
    console.log(new Date().toISOString(),process.env.mode,c.req.method, c.req.url,c.res.status,'cost:',Date.now() - before,c.error ? c.error:'')
})

if(process.env.mode === 'main') {
    for (let i = 0; i < Number.parseInt(process.env.workers || '1'); i++) {
        Bun.spawn([positionals[0],'--watch',positionals[1], '--mode','sub'], {
            env:{
                ...process.env,
            },
            stdout: 'inherit',
            stderr: 'inherit',
        })
    }
}

await initRouter(app)
const server = Bun.serve( {
    fetch: app.fetch,
    port: process.env.mode === 'main' ? 3000 : 0
})
console.log(`Server started at http://localhost:${server.port}`)
try {
    if (process.env.mode === 'sub') {
        console.log(`Server register to main http://localhost:${server.port}`)
        const resp = await fetch(`http://localhost:3000/innerapi/worker/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                port: server.port,
                host: 'localhost',
            })
        })
        if (!resp.ok) {
            console.error(await resp.text())
            process.exit(1)
        }
        console.log('register result:',await resp.text())
    }
}catch (e) {
    console.error(e)
    process.exit(1)
}