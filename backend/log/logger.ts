import { log as primaryLog } from './primary';

const logger = primaryLog;

const createChildLogger = (context: any) => {
    return {
        error: (message: string, meta?: any) => logger.error(message, { ...context, ...meta }),
        warn: (message: string, meta?: any) => logger.warn(message, { ...context, ...meta }),
        info: (message: string, meta?: any) => logger.info(message, { ...context, ...meta }),
        debug: (message: string, meta?: any) => logger.debug(message, { ...context, ...meta }),
        child: (childContext: any) => createChildLogger({ ...context, ...childContext }),
    };
};

export default {
    error: (message: string, meta?: any) => logger.error(message, meta),
    warn: (message: string, meta?: any) => logger.warn(message, meta),
    info: (message: string, meta?: any) => logger.info(message, meta),
    debug: (message: string, meta?: any) => logger.debug(message, meta),
    log: (level:string,message: string, meta?: any) => logger.log(level,message, meta),
    child: createChildLogger,
    close: () => logger.close(),
};
