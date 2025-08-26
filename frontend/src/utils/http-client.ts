// HTTP 客户端工具
import {appState} from '../states.js'
import router from '../router/index.js'

/**
 * 带认证的 fetch 封装
 */
export async function httpClient(url:string, options:{
    method?: string,
    headers?: Record<string, string>,
    body?: any
}) {
    const token = localStorage.getItem('token')

    // 确保 headers 存在
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    }

    // 添加认证头
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const config = {
        ...options,
        headers
    }

    console.log('🚀 HTTP Client Request:', {url, config})

    try {
        const response = await fetch(url, config)

        console.log('📡 HTTP Client Response:', response.status)

        if (response.status === 401) {
            console.log('🚫 Unauthorized - clearing auth and redirecting')
            localStorage.removeItem('token')
            appState.username = ''

            if (router.currentRoute.value.path !== '/login') {
                await router.push('/login')
            }

            throw new Error('未授权访问')
        }

        return response
    } catch (error) {
        console.error('❌ HTTP Client Error:', error)
        throw error
    }
}

export default httpClient
