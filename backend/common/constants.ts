
export const API_HEALTH_CHECK = '/api/health'
export const API_NODE_OFFLINE = '/api/offline'

// 不需要认证的API
export const AUTH_FREE_APIS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    API_HEALTH_CHECK,
    '/api/download/token',
    '/api/compute'
]
