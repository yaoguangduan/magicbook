import chalk from "chalk";

export const CMD_BEGIN = "begin"
export const CMD_EXIT = "exit"
export const CMD_COMPLETE = "complete"

export interface WorkerMessage {
    type: string;
    data: any;
}

export const msgPrint = (msg: WorkerMessage, worker: Worker) => {
    switch (msg.type) {
        case 'error':
            console.log(chalk.red(JSON.stringify(msg.data)));
            break;
        case 'info':
            console.log(chalk.cyan(JSON.stringify(msg.data)));
            break;
        case 'warning':
            console.log(chalk.yellow(JSON.stringify(msg.data)));
            break;
        case 'success':
            console.log(chalk.green(JSON.stringify(msg.data)));
            break;
        default:
            console.log(JSON.stringify(msg.data));
            break;
    }
}

function extractError(message: string) {
    for (let s of message.split("\n")) {
        if (s === null || s === undefined) {
            continue;
        }
        if (s.indexOf("error:") !== -1) {
            return s.split("error:")[1].trim();
        }
    }
    return message
}

export const runWorker = (file: string, data: any, msgProc: (msg: WorkerMessage, worker: Worker) => void = msgPrint): Promise<any | Error> => {
    return new Promise((resolve, reject): any => {
        const worker = new Worker(file)
        worker.postMessage({
            type: CMD_BEGIN,
            data: data
        })
        worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
            if (event.data.type === CMD_EXIT || event.data.type === CMD_COMPLETE) {
                worker.terminate()
                resolve(event.data)
            } else {
                msgProc(event.data, worker)
            }
        }
        worker.onerror = (event) => {
            worker.terminate()
            resolve({
                type: CMD_EXIT,
                data: extractError(event.message)
            })
        }
    })
}

const data = await runWorker("./worker/test_worker.ts", "worker")
console.log(data)