import * as Bun from 'bun'

export const f = async (data: any) => {

}
if (Bun.isMainThread) {
    const data = ''
    const ret = await f(data)
    console.log(ret)
} else {
    try {
        self.onmessage = async (msg: MessageEvent) => {
            if (msg.data.type == 'begin') {
                const ret = await f(msg.data.data)
                self.postMessage({
                    type: "complete",
                    data: ret
                })
            }
        }
    } catch (e) {
        self.postMessage({
            type: "exit",
            data: e.message
        })
    }
}