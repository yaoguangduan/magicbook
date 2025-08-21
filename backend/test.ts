import {Hono} from 'hono'

const app = new Hono()
app.get('/posts/', async (c) => {
    const {id, comment_id} = await c.req.json<{ id: number, comment_id: string }>()
    console.log(id, comment_id)
    // ...
})