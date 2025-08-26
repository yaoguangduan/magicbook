export const URL_WORKER_REGISTER = '/api/worker/register'
export const AUTH_WRITE_LIST = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/health',
    '/api/redis',
    URL_WORKER_REGISTER
]
export const MAIN_PROC_LIST = [
    ...AUTH_WRITE_LIST, URL_WORKER_REGISTER
]

export const MODE_MASTER = 'master'
export const MODE_WORKER = 'worker'