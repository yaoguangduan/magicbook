export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retry3 = async (fn: () => Promise<boolean>): Promise<boolean> => {
    let i = 0
    while (i < 3) {
        try {
            const res = await fn()
            if (res) {
                return true
            } else {
                i++
            }
        } catch (e) {
            i++
        }
    }
    return false
}
export const retry3Wait = async (fn: () => Promise<boolean>,timeout: number): Promise<boolean> => {
    let i = 0
    while (i < 3) {
        try {
            const res = await fn()
            if (res) {
                return true
            } else {
                sleep(timeout)
                i++
            }
        } catch (e) {
            sleep(timeout)
            i++
        }
    }
    return false
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