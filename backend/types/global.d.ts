// 全局类型声明
declare global {
    var config: {
        env:string
        mysql: {
            url: string
        }
        web: {
            jwtSecret: string
        }
    }
    var runtime: {
        exec:string,
        main:string
        port:number
    }

    var logger: {
        debug: (msg: string, ...args: any[]) => void
        info: (msg: string, ...args: any[]) => void
        warn: (msg: string, ...args: any[]) => void
        error: (msg: string, ...args: any[]) => void
        child: (meta: any) => any
        close: () => void
        log: (level:string,message: string, meta?: any) => void
    }
}

export {}