import {createRouter, createWebHashHistory} from 'vue-router'
import {appState} from "../states.js";
import {clearAuth, parseJwtToken} from "../utils/auth.js";

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../components/Home.vue'),
        meta: {
            desc: '主页'
        }
    },
    {
        path: '/pdf',
        name: 'PDF处理',
        component: () => import('../components/feature/toolbox/Pdf.vue'),
        meta: {
            category: '通用工具',
            searchKeys: ['pdf', '合并', '加密', '解密', '转换'],
            desc: 'pdf合并、转换、加解密等常用操作'
        }
    },
    {
        path: '/json',
        name: 'Json操作',
        component: () => import('../components/feature/toolbox/Json.vue'),
        meta: {
            category: '通用工具',
            searchKeys: ['json', '校验', '格式化', '压缩', '编辑'],
            desc: 'json校验、格式化、压缩、编辑等'
        }
    },
    {
        path: '/convert',
        name: 'Converter',
        component: () => import('../components/feature/toolbox/Converter.vue'),
        meta: {
            category: '通用工具',
            searchKeys: ['json', 'xml', 'yaml', 'properties', '格式转换'],
            desc: 'xml、yaml等格式文件转换'
        }
    },
    {
        path: '/http',
        name: 'HTTP客户端',
        component: () => import('../components/feature/toolbox/Http.vue'),
        meta: {
            category: '通用工具',
            searchKeys: ['http', 'api', '接口', '请求', 'postman'],
            desc: 'HTTP接口测试工具，支持各种请求方法和参数配置'
        }
    },
    {
        path: '/tcmsp',
        name: 'TCMSP数据下载',
        component: () => import('../components/feature/toolbox/Json.vue'),
        meta: {
            category: '生物信息',
            searchKeys: ['tcmsp', 'herb', 'targets', 'ingredients'],
            desc: 'tcmsp 药物/靶点数据下载'
        }
    },

    {
        path: '/login',
        name: 'Login',
        component: () => import('../components/Login.vue'),
    },
]
const router = createRouter({
    history: createWebHashHistory(),
    routes
})
router.beforeEach(async (to, from, next) => {
    console.log('路由守卫 - 目标路径:', to.path);
    appState.route = to.path

    if (to.path !== '/login') {
        try {
            const token = localStorage.getItem('token')

            if (!token) {
                console.log('没有 token，跳转到登录页');
                appState.username = '' // 清空用户名
                next('/login');
                return;
            }

            // 使用新的 token 解析方法
            const userInfo = parseJwtToken(token);
            if (!userInfo) {
                console.log('Token 无效或已过期，跳转到登录页');
                clearAuth(); // 清除所有认证信息
                appState.username = ''
                next('/login');
                return;
            }

            // 同步用户名到状态中
            if (userInfo.username && userInfo.username !== appState.username) {
                appState.username = userInfo.username
                console.log('🔄 路由守卫同步用户名:', userInfo.username)
            }

            next();
        } catch (error) {
            console.error('Token 验证失败:', error);
            clearAuth();
            appState.username = ''
            next('/login');
        }
    } else {
        next();
    }
})

// 旧的 isTokenExpired 函数已被 parseJwtToken 替代

export default router
