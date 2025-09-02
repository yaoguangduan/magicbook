
import logger from './log/logger'
import {parseArgs} from "util";
import {MODE_MASTER} from "./common/constants";

process.env.CANVAS_SILENT = 'true';
process.env.CANVAS_VERBOSE = 'false';
process.env.CANVAS_DEBUG = 'false';
export const init = () =>{

    const {values, positionals} = parseArgs({
        args: Bun.argv,
        options: {
            mode: {
                type: 'string',
            },
            workers: {
                type: 'string',
            },
            master: {
                type: 'string',
            }
        },
        strict: true,
        allowPositionals: true,
    });
    globalThis.config = {
            workers: parseInt(values.workers || '0'),
            mode: values.mode || MODE_MASTER,
            master: values.master || 'http://localhost:3000',
            redis: {
                url: process.env.REDIS_URL || 'redis://:dtdyq@114.55.118.115:6379',
            },
            web: {
                jwtSecret: process.env.JWT_SECRET || 'secret',
            }
    }
    globalThis.runtime = {
        exec: positionals[0],
        main: positionals[1],
    }
    globalThis.logger = logger
}