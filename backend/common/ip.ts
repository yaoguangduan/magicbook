export const getExternalIP = (): string | null => {
    const os = require('os');
    const interfaces = os.networkInterfaces();

    // 遍历所有网络接口，找到第一个非内部的IPv4地址
    for (const name in interfaces) {
        const networkInterface = interfaces[name];
        if (networkInterface) {
            for (const addr of networkInterface) {
                // 查找非内部、非回环的IPv4地址
                if (addr.family === 'IPv4' && !addr.internal) {
                    return addr.address;
                }
            }
        }
    }
    return null;
}
