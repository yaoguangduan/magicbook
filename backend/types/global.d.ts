// 全局类型声明
declare global {
    var config: {
        mode: string
        workers: number
        master: string
        redis: {
            url: string
        }
        web: {
            jwtSecret: string
        }
    }
    var runtime: {
        exec:string,
        main:string
    }

    var logger: {
        debug: (msg: string, ...args: any[]) => void
        info: (msg: string, ...args: any[]) => void
        warn: (msg: string, ...args: any[]) => void
        error: (msg: string, ...args: any[]) => void
    }
}

export {}