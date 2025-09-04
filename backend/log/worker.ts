export const log = {
    info: (message: string, meta?: any) => process.send({type: 'log', level: 'info', message, meta}),
    error: (message: string, meta?: any) => process.send({type: 'log', level: 'error', message, meta}),
    warn: (message: string, meta?: any) => process.send({type: 'log', level: 'warn', message, meta}),
    debug: (message: string, meta?: any) => process.send({type: 'log', level: 'debug', message, meta}),
    log: (level: string, message: string, meta?: any) => process.send({type: 'log', level: level, message, meta}),
    close: () => {
    },
}