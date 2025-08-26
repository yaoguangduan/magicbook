<template>
    <div v-if="showDebug" class="debug-auth">
        <div class="debug-card">
            <h4>🔍 认证状态调试</h4>
            <div class="debug-item">
                <strong>当前用户名:</strong> {{ appState.username || '(空)' }}
            </div>
            <div class="debug-item">
                <strong>Token 存在:</strong> {{ hasToken ? '✅' : '❌' }}
            </div>
            <div class="debug-item">
                <strong>Token 中的用户名:</strong> {{ tokenUsername || '(空)' }}
            </div>
            <div class="debug-item">
                <strong>Token 是否有效:</strong> {{ isTokenValid ? '✅' : '❌' }}
            </div>
            <div class="debug-actions">
                <a-button size="small" @click="syncUsername">同步用户名</a-button>
                <a-button size="small" type="outline" @click="clearAuthData">清除认证</a-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {appState, syncUsernameFromToken} from '../states.js'
import {getCurrentUsername, parseJwtToken, clearAuth} from '../utils/auth.js'
import {useRouter} from 'vue-router'

const router = useRouter()
const showDebug = ref(false)

// 计算属性
const hasToken = computed(() => !!localStorage.getItem('token'))
const tokenUsername = computed(() => getCurrentUsername())
const isTokenValid = computed(() => {
    const token = localStorage.getItem('token')
    return token ? !!parseJwtToken(token) : false
})

// 方法
const syncUsername = () => {
    const username = syncUsernameFromToken()
    console.log('🔄 手动同步用户名:', username)
}

const clearAuthData = async () => {
    clearAuth()
    appState.username = ''
    await router.push('/login')
}

// 监听键盘快捷键 Ctrl+Shift+D 显示/隐藏调试面板
onMounted(() => {
    const handleKeydown = (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            showDebug.value = !showDebug.value
            console.log('🐛 调试面板:', showDebug.value ? '显示' : '隐藏')
        }
    }
    window.addEventListener('keydown', handleKeydown)

    // 清理事件监听器
    const cleanup = () => window.removeEventListener('keydown', handleKeydown)
    return cleanup
})
</script>

<style scoped>
.debug-auth {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
}

.debug-card {
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 16px;
    border-radius: 8px;
    min-width: 300px;
    font-size: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.debug-card h4 {
    margin: 0 0 12px 0;
    color: #00d4aa;
}

.debug-item {
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
}

.debug-actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
}
</style>
