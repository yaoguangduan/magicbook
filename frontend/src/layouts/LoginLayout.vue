<template>
    <div class="login-layout">
        <div class="login-container">
            <!-- 左侧Banner区域 -->
            <div class="login-banner">
                <div class="banner-content">
                    <div class="banner-header">
                        <div class="logo-section">
                            <icon-book class="logo-icon"/>
                            <span class="logo-text">MagicBook</span>
                        </div>
                    </div>


                    <!-- 3D插画区域 -->
                    <div class="banner-illustration">
                        <div class="illustration-3d">
                            <div class="card-3d">
                                <div class="card-inner">
                                    <div class="card-line"></div>
                                    <div class="card-line"></div>
                                    <div class="card-line"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧登录表单区域 -->
            <div class="login-form-container">
                <router-view/>
            </div>
        </div>
    </div>
</template>

<script setup>
import {IconBook} from '@arco-design/web-vue/es/icon'
</script>

<style scoped>
.login-layout {
    min-height: 100vh;
    display: flex;
    background: #f7f8fa;
}

.login-container {
    width: 100%;
    display: flex;
    min-height: 100vh;
}

/* 左侧Banner区域 */
.login-banner {
    width: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px;
    position: relative;
    overflow: hidden;
}

.banner-content {
    max-width: 480px;
    width: 100%;
    color: white;
    z-index: 2;
    position: relative;
}

.banner-header {
    margin-bottom: 0;
}

.logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}

.logo-icon {
    font-size: 32px;
    color: #ffffff;
}

.logo-text {
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
}


/* 3D插画区域 */
.banner-illustration {
    display: flex;
    justify-content: center;
}

.illustration-3d {
    perspective: 1000px;
    transform-style: preserve-3d;
}

.card-3d {
    width: 200px;
    height: 140px;
    background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    transform: rotateX(15deg) rotateY(-15deg);
    animation: float 6s ease-in-out infinite;
    position: relative;
}

.card-inner {
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
}

.card-line {
    height: 3px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
}

.card-line:nth-child(1) {
    width: 80%;
}

.card-line:nth-child(2) {
    width: 60%;
}

.card-line:nth-child(3) {
    width: 40%;
}

@keyframes float {
    0%, 100% {
        transform: rotateX(15deg) rotateY(-15deg) translateY(0px);
    }
    50% {
        transform: rotateX(15deg) rotateY(-15deg) translateY(-10px);
    }
}

/* 右侧登录表单区域 */
.login-form-container {
    width: 50%;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px;
    position: relative;
}

/* 响应式设计 */
@media (max-width: 1024px) {
    .login-container {
        flex-direction: column;
    }

    .login-banner {
        min-height: 300px;
        padding: 40px 20px;
    }

    .banner-content {
        text-align: center;
    }


    .login-form-container {
        width: 100%;
        padding: 40px 20px;
    }
}

@media (max-width: 768px) {
    .login-banner {
        min-height: 250px;
        padding: 30px 20px;
    }


    .card-3d {
        width: 150px;
        height: 105px;
    }

    .login-form-container {
        padding: 30px 20px;
    }
}
</style>
