import {reactive} from "vue";
import {getCurrentUsername} from "./utils/auth.js";

// 创建响应式状态
export const appState = reactive({
    route: '/',
    username: '',
    targetRoute: null as string | null  // 保存登录后要跳转的目标路由
})

// 应用启动时从 token 中恢复用户名
function initializeAppState() {
    const username = getCurrentUsername()
    if (username) {
        appState.username = username
        console.log('🔄 从 token 中恢复用户名:', username)
    }
}

// 立即初始化
initializeAppState()

// 监听 storage 事件，处理多标签页同步
window.addEventListener('storage', (e) => {
    if (e.key === 'token') {
        if (e.newValue) {
            // token 更新了，重新获取用户名
            const username = getCurrentUsername()
            if (username && username !== appState.username) {
                appState.username = username
                console.log('🔄 多标签页同步用户名:', username)
            }
        } else {
            // token 被删除了，清空用户名
            appState.username = ''
            console.log('🔄 多标签页同步清空用户名')
        }
    }
})

// 导出一个方法来手动同步用户名
export function syncUsernameFromToken() {
    const username = getCurrentUsername()
    if (username !== appState.username) {
        appState.username = username
        console.log('🔄 手动同步用户名:', username)
    }
    return username
}

// 目标路由管理
export function setTargetRoute(route: string) {
    appState.targetRoute = route
    console.log('💾 设置目标路由:', route)
}

export function getTargetRoute(): string | null {
    return appState.targetRoute
}

export function clearTargetRoute() {
    appState.targetRoute = null
    console.log('🧹 清除目标路由')
}