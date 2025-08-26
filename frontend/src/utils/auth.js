// 认证相关工具函数

/**
 * 从 JWT token 中解析用户信息
 * @param {string} token JWT token
 * @returns {object|null} 解析后的用户信息，如果解析失败返回 null
 */
export function parseJwtToken(token) {
    try {
        if (!token) return null

        // JWT 格式: header.payload.signature
        const parts = token.split('.')
        if (parts.length !== 3) return null

        // 解码 payload (Base64)
        const payload = parts[1]
        const decoded = atob(payload)
        const parsed = JSON.parse(decoded)

        // 检查 token 是否过期
        const now = Math.floor(Date.now() / 1000)
        if (parsed.exp && now > parsed.exp) {
            console.log('Token 已过期')
            return null
        }

        return parsed
    } catch (error) {
        console.error('解析 JWT token 失败:', error)
        return null
    }
}

/**
 * 从 localStorage 中获取当前用户名
 * @returns {string} 用户名，如果没有则返回空字符串
 */
export function getCurrentUsername() {
    try {
        const token = localStorage.getItem('token')
        if (!token) return ''

        const userInfo = parseJwtToken(token)
        return userInfo?.username || ''
    } catch (error) {
        console.error('获取当前用户名失败:', error)
        return ''
    }
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export function isLoggedIn() {
    const token = localStorage.getItem('token')
    if (!token) return false

    const userInfo = parseJwtToken(token)
    return !!userInfo
}

/**
 * 清除认证信息
 */
export function clearAuth() {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
}

export default {
    parseJwtToken,
    getCurrentUsername,
    isLoggedIn,
    clearAuth
}
