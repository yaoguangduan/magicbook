import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import './style.css'
import {appState} from "./states.js";
import {clearAuth} from "./utils/auth.js";

const app = createApp(App)

app.use(ArcoVue)
app.use(router)

const originalFetch = window.fetch
window.fetch = async function (...args) {
    try {
        const url = args[0]
        if (!args[1]) {
            args[1] = {}
        }

        if (!args[1].headers) {
            args[1].headers = {}
        }

        const token = localStorage.getItem("token")
        if (token && !args[1].headers['Authorization'] && !args[1].headers['authorization']) {
            args[1].headers['Authorization'] = `Bearer ${token}`
        }
        console.log(`📡 Fetch request to: ${url}`, {
            method: args[1].method || 'GET',
            headers: args[1].headers,
            hasToken: !!token
        })

        const response = await originalFetch.apply(this, args)

        console.log(`📡 Response from ${url}: ${response.status}`)

        if (response.status === 401) {
            console.log('🚫 401 Unauthorized - redirecting to login')
            clearAuth() // 清除所有认证信息
            appState.username = ''
            if (router.currentRoute.value.path !== '/login') {
                await router.push('/login')
            }
            throw new Error('未登录')
        }

        return response
    } catch (error) {
        console.error(`❌ Fetch error for ${args[0]}:`, error)
        throw error
    }
}

app.mount('#app')
