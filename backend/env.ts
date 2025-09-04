
import logger from './log/logger'
import {parseArgs} from "util";

process.env.CANVAS_SILENT = 'true';
process.env.CANVAS_VERBOSE = 'false';
process.env.CANVAS_DEBUG = 'false';
export const init = () =>{

    const {values, positionals} = parseArgs({
        args: Bun.argv,
        options: {
        },
        strict: true,
        allowPositionals: true,
    });
    globalThis.config = {
            env: process.env.ENV || 'dev',
            mysql: {
                url: process.env.MYSQL_URL || 'mysql://root:dtdyq@114.55.118.115:3306/magicbook',
            },
            web: {
                jwtSecret: process.env.JWT_SECRET || 'secret',
            }
    }
    globalThis.runtime = {
        exec: positionals[0],
        main: positionals[1],
        port: parseInt(process.env.APP_PORT || '3000')
    }
    globalThis.logger = logger
}