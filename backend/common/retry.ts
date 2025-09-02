import * as bun from "bun";

export interface RetryResult {
    success: boolean;
    error?: Error | null;  // 修复：应该是小写error
}
const retry = async (fn: () => Promise<boolean>,times: number,timeout: number): Promise<RetryResult> => {
    let r:RetryResult = {success: false}
    while (times > 0) {
        try {
            const res = await fn()
            if (res) {
                r.success = true
                return r
            } else {
                times--
            }
        } catch (e) {
            times--
            r.error = e instanceof Error ? e : new Error(String(e));  // 确保类型安全
        } finally {
            if (timeout !== undefined && timeout > 0) {
                await bun.sleep(timeout)
            }
        }
    }
    return r
}
export const retry3 = async (fn: () => Promise<boolean>): Promise<RetryResult> => {
    return retry(fn, 3, 0)  // 修复：添加timeout参数
}
export const retry3Wait = async (fn: () => Promise<boolean>, timeout: number): Promise<RetryResult> => {
    return retry(fn, 3, timeout)
}
export const always3 = async (fn: () => Promise<void>) => {
    let i = 0
    while (i < 3) {
        try {
            await fn()
        } catch (e) {
        }
        i++
    }
}