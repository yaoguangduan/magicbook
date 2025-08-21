import chalk from "chalk";

const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const isWorker = typeof self !== 'undefined' && typeof importScripts !== 'undefined';

export interface Message {
    type: string;
    message: any;
}

export const messageConsume = (msg: Message) => {
    if (isNode) {
        switch (msg.type) {
            case 'success':
            case 'complete':
                console.log(chalk.green(msg.message));
                break;
            case 'error':
                console.error(chalk.red(msg.message));
                break;
            case 'warn':
                console.warn(chalk.yellow(msg.message));
                break;
            case 'info':
            case 'progress':
                console.info(chalk.cyan(msg.message));
                break;
            default:
                console.log(msg.message);
                break;
        }
    } else {
        self.postMessage(msg)
    }
}

export const runWorker = async (url: string, data: any, onMsg: (msg: Message) => void) => {

    return new Promise((resolve, reject) => {
        const worker = new Worker(url);

        worker.onmessage = (e) => {
            const msg = e.data as Message
            if (msg.type === 'complete') {
                resolve(msg);
                worker.terminate();
            } else if (msg.type === 'error') {
                reject(msg.message);
                worker.terminate();
            } else {
                onMsg(msg)
            }
        };

        worker.onerror = (error) => {
            reject({
                type: 'error',
                message: error.message,
            });
            worker.terminate();
        };

        worker.postMessage(data);
    });
}