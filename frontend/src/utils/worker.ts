// Worker 工具函数，支持 await
export class WorkerManager {
    private worker: Worker;
    private messageId = 0;
    private pendingMessages = new Map<number, { resolve: Function; reject: Function }>();

    constructor(workerPath: string) {
        this.worker = new Worker(workerPath);
        this.worker.onmessage = this.handleMessage.bind(this);
    }

    // 发送消息并等待响应
    async postMessage(data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = ++this.messageId;

            this.pendingMessages.set(id, {resolve, reject});

            this.worker.postMessage({
                id,
                data
            });
        });
    }

    // 终止 Worker
    terminate() {
        this.worker.terminate();
    }

    private handleMessage(event: MessageEvent) {
        const {id, result, error, success} = event.data;

        if (this.pendingMessages.has(id)) {
            const {resolve, reject} = this.pendingMessages.get(id)!;
            this.pendingMessages.delete(id);

            if (success) {
                resolve(result);
            } else {
                reject(new Error(error));
            }
        }
    }
}

export function createWorker(workerPath: string) {
    return new WorkerManager(workerPath);
}
