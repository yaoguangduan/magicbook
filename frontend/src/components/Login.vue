<template>
    <div class="pro-login-form">


        <a-form
            ref="formRef"
            :model="loginForm"
            :rules="loginRules"
            layout="vertical"
            @submit="handleLogin"
        >
            <a-form-item field="username" hide-label>
                <a-input
                    v-model="loginForm.username"
                    placeholder="admin"
                    size="large"
                >
                    <template #prefix>
                        <icon-user/>
                    </template>
                </a-input>
            </a-form-item>

            <a-form-item field="password" hide-label>
                <a-input-password
                    v-model="loginForm.password"
                    placeholder="密码"
                    size="large"
                    @press-enter="handleLogin"
                >
                    <template #prefix>
                        <icon-lock/>
                    </template>
                </a-input-password>
            </a-form-item>

            <a-form-item class="login-options">
                <div class="options-wrapper">
                    <a-checkbox v-model="loginForm.remember">记住密码</a-checkbox>
                    <a-link class="forgot-link" @click="handleForgotPassword">忘记密码</a-link>
                </div>
            </a-form-item>

            <a-form-item>
                <a-button
                    :loading="loading"
                    html-type="submit"
                    long
                    size="large"
                    type="primary"
                >
                    {{ loading ? '登录中...' : '登录' }}
                </a-button>
            </a-form-item>

            <!-- 注册账号 -->
            <div class="register-link">
                <a-link @click="handleRegister">注册账号</a-link>
            </div>
        </a-form>
    </div>
</template>

<script setup>
import {ref, reactive} from 'vue'
import {useRouter} from 'vue-router'
import {Message} from '@arco-design/web-vue'
import {IconUser, IconLock} from '@arco-design/web-vue/es/icon'
import {appState, getTargetRoute, clearTargetRoute} from '../states.js'
import httpClient from '../utils/http-client.ts'

const router = useRouter()

// 表单引用
const formRef = ref()

// 加载状态
const loading = ref(false)

// 表单数据
const loginForm = reactive({
    username: '',
    password: '',
    remember: false
})

// 表单验证规则
const loginRules = {
    username: [
        {required: true, message: '请输入用户名'},
        {minLength: 3, message: '用户名长度不能少于3个字符'}
    ],
    password: [
        {required: true, message: '请输入密码'},
        {minLength: 6, message: '密码长度不能少于6个字符'}
    ]
}

// 登录处理
const handleLogin = async () => {
    try {
        const valid = await formRef.value.validate()
        if (!valid) return

        loading.value = true

        const response = await httpClient('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: loginForm.username,
                password: loginForm.password
            })
        })

        if (response.ok) {
            const data = await response.json()

            // 保存token和用户信息
            localStorage.setItem('token', data.token)
            if (loginForm.remember) {
                localStorage.setItem('remember', 'true')
                localStorage.setItem('username', loginForm.username)
            } else {
                localStorage.removeItem('remember')
                localStorage.removeItem('username')
            }

            // 更新应用状态
            appState.username = loginForm.username

            Message.success('登录成功！')

            // 跳转回原来的页面，如果没有保存的路由则跳转到首页
            const targetRoute = getTargetRoute() || '/dashboard'
            console.log('🚀 登录成功，跳转回目标路由:', targetRoute)
            
            // 清除保存的目标路由
            clearTargetRoute()
            
            // 跳转
            router.push(targetRoute)
        } else {
            const errorData = await response.json()
            Message.error(errorData.message || '登录失败，请检查用户名和密码')
        }
    } catch (error) {
        console.error('登录失败:', error)
        Message.error('登录失败，请稍后重试')
    } finally {
        loading.value = false
    }
}

// 忘记密码
const handleForgotPassword = () => {
    Message.info('忘记密码功能开发中...')
}

// 注册账号
const handleRegister = () => {
    Message.info('注册账号功能开发中...')
}

// 初始化：设置默认用户名
loginForm.username = 'admin'

// 如果有记住的用户名，自动填充
if (localStorage.getItem('remember') === 'true') {
    const savedUsername = localStorage.getItem('username')
    if (savedUsername) {
        loginForm.username = savedUsername
        loginForm.remember = true
    }
}
</script>

<style scoped>
.pro-login-form {
    width: 100%;
    max-width: 320px;
}

.login-form {
    margin-top: 0;
}

.login-input {
    height: 40px;
    font-size: 14px;
    border-radius: 0;
    border: 1px solid #e5e6eb;
    transition: all 0.2s ease;
    background: #ffffff;
}

.login-input:focus-within {
    border-color: #165dff;
    box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
}

.login-options {
    margin-bottom: 24px;
}

.options-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.forgot-link {
    color: #165dff;
    text-decoration: none;
    font-size: 14px;
}

.forgot-link:hover {
    text-decoration: underline;
}

.login-button {
    height: 40px;
    font-size: 14px;
    font-weight: 400;
    border-radius: 0;
    background: #165dff;
    border: none;
    transition: all 0.2s ease;
}

.login-button:hover {
    background: #3c7eff;
}

.login-button:active {
    background: #0e42d2;
}

.register-link {
    text-align: center;
    margin-top: 24px;
}

.register-link .arco-link {
    font-size: 14px;
    color: #165dff;
}

/* 表单项间距调整 */
:deep(.arco-form-item) {
    margin-bottom: 16px;
}

:deep(.arco-form-item:last-child) {
    margin-bottom: 0;
}

/* 输入框前缀图标样式 */
:deep(.arco-input-prefix) {
    color: #86909c;
    margin-right: 8px;
}

:deep(.arco-input:focus-within .arco-input-prefix) {
    color: #165dff;
}

/* 复选框样式调整 */
:deep(.arco-checkbox) {
    font-size: 14px;
}

:deep(.arco-checkbox-label) {
    color: #4e5969;
}

/* 输入框内部间距 */
:deep(.arco-input-wrapper) {
    padding: 0 12px;
}

/* 密码输入框眼睛图标 */
:deep(.arco-input-password .arco-input-suffix) {
    color: #86909c;
}

/* 响应式设计 */
@media (max-width: 480px) {
    .pro-login-form {
        max-width: 280px;
        padding: 0 16px;
    }

    .options-wrapper {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    }
}
</style>