// 模式常量
export const MODE_MASTER = 'master'
export const MODE_WORKER = 'worker'

// API路径常量
export const API_WORKER_REGISTER = '/api/worker/register'
export const API_WORKER_STATE = '/api/worker/state'
export const API_HEALTH_CHECK = '/api/health'
export const API_NODE_OFFLINE = '/api/offline'

// Master专用API
export const MASTER_ONLY_APIS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    API_WORKER_REGISTER,
    API_WORKER_STATE
]

export const SHARED_APIS = [
    API_HEALTH_CHECK,
    API_NODE_OFFLINE
]

// 不需要认证的API
export const AUTH_FREE_APIS = [
    ...MASTER_ONLY_APIS,
    ...SHARED_APIS,
    '/api/download/token'
]

// Master主进程处理的API（不代理给Worker）
export const MAIN_PROC_LIST = [
    ...MASTER_ONLY_APIS,
    ...SHARED_APIS
]