<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <icon-book class="login-logo"/>
                <h1 class="login-title">MagicBook</h1>
                <!--        <p class="login-subtitle">欢迎回来，请登录您的账户</p>-->
            </div>

            <a-form
                ref="formRef"
                :model="loginForm"
                :rules="loginRules"
                class="login-form"
                @submit="handleLogin"
            >
                <a-form-item field="username" label="用户名">
                    <a-input
                        v-model="loginForm.username"
                        placeholder="请输入用户名"
                        size="large"
                    >
                        <template #prefix>
                            <icon-user/>
                        </template>
                    </a-input>
                </a-form-item>

                <a-form-item field="password" label="密码">
                    <a-input-password
                        v-model="loginForm.password"
                        placeholder="请输入密码"
                        size="large"
                    >
                        <template #prefix>
                            <icon-lock/>
                        </template>
                    </a-input-password>
                </a-form-item>

                <a-form-item>
                    <a-checkbox v-model="loginForm.remember">记住我</a-checkbox>
                    <!--          <a-link class="forgot-password" href="#">忘记密码？</a-link>-->
                </a-form-item>

                <a-form-item>
                    <a-button
                        :loading="loading"
                        class="login-button"
                        html-type="submit"
                        long
                        size="large"
                        type="primary"
                    >
                        {{ loading ? '登录中...' : '登录' }}
                    </a-button>
                </a-form-item>
            </a-form>

            <!--      <div class="login-footer">-->
            <!--        <p>还没有账户？ <a-link href="#" @click="goToRegister">立即注册</a-link></p>-->
            <!--      </div>-->
        </div>
    </div>
</template>

<script setup>
import {ref, reactive} from 'vue'
import {useRouter} from 'vue-router'
import {Message} from '@arco-design/web-vue'
import {IconBook, IconUser, IconLock} from '@arco-design/web-vue/es/icon'
import {appState} from "../states.js";
import httpClient from "../utils/http-client";

const router = useRouter()
const formRef = ref()

// 响应式数据
const loading = ref(false)
const loginForm = reactive({
    username: '',
    password: '',
    remember: false
})

// 表单验证规则
const loginRules = {
    username: [
        {required: true, message: '请输入用户名', trigger: 'blur'},
        {minLength: 3, message: '用户名至少3个字符', trigger: 'blur'}
    ],
    password: [
        {required: true, message: '请输入密码', trigger: 'blur'},
        {minLength: 3, message: '密码至少6个字符', trigger: 'blur'}
    ]
}

// 图标
const iconUser = IconUser
const iconLock = IconLock

// 处理登录
const handleLogin = async ({values, errors}) => {
    try {
        if (errors !== undefined) {
            return
        }
        loading.value = true
        const resp = await httpClient('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(values)
        })
        const data = await resp.json()
        if (!resp.ok) {
            throw new Error(data.message)
        }
        Message.success('登录成功')
        appState.username = values.username
        localStorage.setItem("token", data.token)
        const fail = await router.push(appState.route)
        if (fail) {
            await router.push('/')
        }
    } catch (error) {
        Message.error('登录失败：' + error.message)
    } finally {
        loading.value = false
    }
}

</script>

<style scoped>
.login-container {
    height: calc(100vh - 300px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.login-card {
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
    padding: 48px;
    width: 100%;
    max-width: 400px;
}

.login-header {
    text-align: center;
    margin-bottom: 32px;
}

.login-logo {
    font-size: 48px;
    color: #165dff;
    margin-bottom: 16px;
}

.login-title {
    font-size: 28px;
    font-weight: 700;
    color: #1d2129;
    margin: 0 0 8px 0;
}

.login-subtitle {
    font-size: 14px;
    color: #86909c;
    margin: 0;
}

.login-form {
    margin-bottom: 24px;
}

.login-button {
    height: 44px;
    font-size: 16px;
    font-weight: 600;
}

.forgot-password {
    float: right;
    font-size: 14px;
}

.login-footer {
    text-align: center;
    padding-top: 24px;
    border-top: 1px solid #e5e6eb;
}

.login-footer p {
    margin: 0;
    font-size: 14px;
    color: #86909c;
}

.login-footer a {
    color: #165dff;
    text-decoration: none;
}

.login-footer a:hover {
    text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 480px) {
    .login-card {
        padding: 32px 24px;
        margin: 16px;
    }

    .login-title {
        font-size: 24px;
    }

    .login-logo {
        font-size: 40px;
    }
}
</style>