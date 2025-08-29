import {createRouter, createWebHashHistory} from 'vue-router'
import {appState, setTargetRoute, clearTargetRoute} from "../states.js"
import {clearAuth, parseJwtToken} from "../utils/auth.js"

// 布局组件
const BaseLayout = () => import('../layouts/BaseLayout.vue')
const LoginLayout = () => import('../layouts/LoginLayout.vue')

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: LoginLayout,
        children: [
            {
                path: '',
                name: 'LoginPage',
                component: () => import('../components/Login.vue'),
                meta: {
                    title: '登录',
                    requiresAuth: false
                }
            }
        ],
        meta: {
            requiresAuth: false
        }
    },
    {
        path: '/',
        component: BaseLayout,
        redirect: '/dashboard',
        children: [
            {
                path: 'dashboard',
                name: 'Home',
                component: () => import('../components/Home.vue'),
                meta: {
                    title: '首页',
                    icon: 'icon-home',
                    requiresAuth: true
                }
            },
            {
                path: 'pdf',
                name: 'PDF处理',
                component: () => import('../components/feature/toolbox/Pdf.vue'),
                meta: {
                    title: 'PDF处理',
                    category: '通用工具',
                    icon: 'icon-file-pdf',
                    searchKeys: ['pdf', '合并', '加密', '解密', '转换'],
                    desc: 'PDF合并、转换、加解密等常用操作',
                    requiresAuth: true
                }
            },
            {
                path: 'json',
                name: 'Json操作',
                component: () => import('../components/feature/toolbox/Json.vue'),
                meta: {
                    title: 'JSON操作',
                    category: '通用工具',
                    icon: 'icon-code',
                    searchKeys: ['json', '校验', '格式化', '压缩', '编辑'],
                    desc: 'JSON校验、格式化、压缩、编辑等',
                    requiresAuth: true
                }
            },
            {
                path: 'convert',
                name: 'Converter',
                component: () => import('../components/feature/toolbox/Converter.vue'),
                meta: {
                    title: '格式转换',
                    category: '通用工具',
                    icon: 'icon-swap',
                    searchKeys: ['json', 'xml', 'yaml', 'properties', '格式转换'],
                    desc: 'XML、YAML等格式文件转换',
                    requiresAuth: true
                }
            },
            {
                path: 'http',
                name: 'HTTP客户端',
                component: () => import('../components/feature/toolbox/Http.vue'),
                meta: {
                    title: 'HTTP客户端',
                    category: '通用工具',
                    icon: 'icon-link',
                    searchKeys: ['http', 'api', '接口', '请求', 'postman'],
                    desc: 'HTTP接口测试工具，支持各种请求方法和参数配置',
                    requiresAuth: true
                }
            },
            {
                path: 'tcmsp',
                name: 'TCMSP数据下载',
                component: () => import('../components/feature/toolbox/Json.vue'),
                meta: {
                    title: 'TCMSP数据',
                    category: '生物信息',
                    icon: 'icon-download',
                    searchKeys: ['tcmsp', 'herb', 'targets', 'ingredients'],
                    desc: 'TCMSP 药物/靶点数据下载',
                    requiresAuth: true
                }
            }
        ]
    }
]
const router = createRouter({
    history: createWebHashHistory(),
    routes
})
router.beforeEach(async (to, from, next) => {
    console.log('路由守卫 - 目标路径:', to.path)
    appState.route = to.path

    // 检查路由是否需要认证 - 只有明确设置为true的才需要认证
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth === true)

    console.log('是否需要认证:', requiresAuth)

    // 检查token状态
    const token = localStorage.getItem('token')
    let isLoggedIn = false

    if (token) {
        try {
            const userInfo = parseJwtToken(token)
            if (userInfo) {
                isLoggedIn = true
                // 同步用户名到状态中
                if (userInfo.username && userInfo.username !== appState.username) {
                    appState.username = userInfo.username
                    console.log('🔄 路由守卫同步用户名:', userInfo.username)
                }
            } else {
                // Token无效，清除
                clearAuth()
                appState.username = ''
            }
        } catch (error) {
            console.error('Token 验证失败:', error)
            clearAuth()
            appState.username = ''
        }
    }

    // 如果需要认证但未登录，跳转到登录页
    if (requiresAuth && !isLoggedIn) {
        console.log('需要认证但未登录，跳转到登录页')
        // 保存当前要访问的路由，登录成功后跳转回来
        setTargetRoute(to.fullPath)
        next('/login')
        return
    }

    // 如果已登录但访问登录页，重定向到首页
    if (isLoggedIn && to.path === '/login') {
        console.log('已登录用户访问登录页，重定向到首页')
        // 清除可能保存的目标路由
        clearTargetRoute()
        next('/dashboard')
        return
    }
    next()
})

// 旧的 isTokenExpired 函数已被 parseJwtToken 替代

export default router
