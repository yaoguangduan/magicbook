<template>
    <div class="main-layout">
        <!-- 顶部导航栏 -->
        <a-layout-header class="header">
            <div class="header-content">
                <!-- 左侧：图标和 MagicBook -->
                <div class="header-left">
                    <!-- Logo 和标题 -->
                    <div class="logo" style="cursor: pointer;" @click="navigateTo('/')">
                        <icon-book class="logo-icon"/>
                        <span class="logo-text">MagicBook</span>
                    </div>

                    <a-button class="menu-button" type="text" @click="toggleDrawer">
                        <template #icon>
                            <icon-menu class="menu-icon"/>
                        </template>
                    </a-button>

                    <a-button class="search-button" type="text" @click="showSearchDialog">
                        <template #icon>
                            <icon-search class="search-icon"/>
                        </template>
                    </a-button>

                </div>

                <!-- 右侧：登录状态 -->
                <div class="header-right">
                    <div class="user-section" @click="handleUserClick">
                        <!-- 未登录状态：显示登录图标 -->
                        <div v-if="!isLoggedIn" class="login-button">
                            <a-button class="login-button" type="text">
                                <template #icon>
                                    <icon-user class="login-icon"/>
                                </template>
                            </a-button>
                        </div>
                        <!-- 已登录状态：显示随机颜色圆形头像 -->
                        <div v-else :style="{ backgroundColor: userAvatarColor }" class="user-avatar">
                            <span class="avatar-text">{{ userInitial }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </a-layout-header>

        <!-- 主要内容区域 -->
        <a-layout class="main-content">
            <!-- 左侧抽屉 -->
            <SidebarDrawer
                v-model:visible="drawerVisible"
                @navigate="navigateTo"
            />

            <!-- 右侧内容区域 -->
            <a-layout-content class="content-area">
                <div class="content-wrapper">

                    <router-view v-slot="{ Component }">
                        <keep-alive>
                            <component :is="Component"/>
                        </keep-alive>
                    </router-view>
                </div>
            </a-layout-content>
        </a-layout>

        <!-- 搜索对话框 -->
        <SearchDialog
            v-model:visible="searchDialogVisible"
            @navigate="navigateTo"
        />
    </div>
</template>

<script setup>
import {ref, onMounted, watch, computed} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {IconBook, IconMenu, IconUser, IconSearch} from '@arco-design/web-vue/es/icon'
import SearchDialog from './SearchDialog.vue'
import SidebarDrawer from './SidebarDrawer.vue'
import {appState} from "../states.js";

const router = useRouter()
const route = useRoute()

// 响应式数据
const drawerVisible = ref(false)
const searchDialogVisible = ref(false)

// 用户登录状态（这里可以根据你的实际登录逻辑修改）
const isLoggedIn = computed(() => {
    return appState.username !== ''
})

// 计算用户头像颜色和首字母
const userAvatarColor = computed(() => {
    const colors = [
        '#f53f3f', '#ff7d00', '#ff9a2e', '#ffb400',
        '#00b42a', '#00d4aa', '#0fc6c2', '#165dff',
        '#722ed1', '#f53f3f', '#ff7d00', '#ff9a2e'
    ]
    // 基于用户名生成固定的颜色，这样每次刷新都是同一个颜色
    const index = appState.username.charCodeAt(0) % colors.length
    return colors[index]
})

const userInitial = computed(() => {
    return appState.username.charAt(0).toUpperCase()
})

// 监听路由变化，自动隐藏 drawer
watch(() => route.path, () => {
    drawerVisible.value = false
})

// 导航到指定路由
const navigateTo = (path) => {
    if (path !== route.path) {
        router.push(path)
    }
}

// 抽屉开关
const toggleDrawer = () => {
    drawerVisible.value = !drawerVisible.value
}

// 显示搜索对话框
const showSearchDialog = () => {
    searchDialogVisible.value = true
}

// 处理用户点击事件
const handleUserClick = () => {
    if (isLoggedIn.value) {
        // 已登录：显示用户菜单或跳转到用户页面
        console.log('用户已登录，显示用户菜单')
        // 这里可以添加用户菜单逻辑
    } else {
        // 未登录：跳转到登录页面
        router.push('/login')
    }
}

// 监听路由变化，自动关闭抽屉（移动端）
onMounted(() => {
    if (window.innerWidth < 768) {
        drawerVisible.value = false
    }
})
</script>

<style scoped>
.main-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.header {
    background: #fff;
    border-bottom: 1px solid #e5e6eb;
    padding: 0;
    height: 48px;
    line-height: 48px;
}

.header-content {
    display: flex;
    align-items: center;
    justify-content: space-between; /* 改为两端对齐 */
    padding: 0 32px;
    height: 100%;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.header-right {
    display: flex;
    align-items: center;
}

.user-section {
    cursor: pointer;
    transition: all 0.2s ease;
}

.user-section:hover {
    opacity: 0.8;
}

.login-button {
    padding-top: 10px;
}

.login-icon {
    font-size: 20px;
    color: #165dff;
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-avatar:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-text {
    color: #fff;
    font-weight: 600;
    font-size: 14px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.menu-button,
.search-button {
    padding: 10px;
}

.menu-icon {
    font-size: 20px;
    color: #165dff;
}

.search-icon {
    font-size: 20px;
    color: #165dff;
}

.logo {
    display: flex;
    align-items: center;
    gap: 8px;
}

.logo-icon {
    font-size: 20px;
    color: #165dff;
}

.logo-text {
    font-size: 18px;
    font-weight: 600;
    color: #1d2129;
}

.main-content {
    flex: 1;
    display: flex;
}

.sidebar-drawer {
    background: #f7f8fa;
}

.search-container {
    padding: 16px 20px 12px 20px;
    border-bottom: 1px solid #e5e6eb;
}

.menu-container {
    padding: 12px 0;
    flex: 1;
    overflow-y: auto;
}

.menu-category {
    margin-bottom: 16px;
}

.category-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    background: #f2f3f5;
    border-radius: 4px;
    margin-bottom: 6px;
}

.category-title {
    font-weight: 600;
    color: #1d2129;
    font-size: 13px;
}

.menu-items {
    padding: 0 16px;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 2px;
}

.menu-item:hover {
    background: #f2f3f5;
}

.item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.item-title {
    font-weight: 500;
    color: #1d2129;
    font-size: 13px;
}

.item-desc {
    font-size: 11px;
    color: #86909c;
    line-height: 1.3;
}

.folder-icon {
    color: #ff7d00;
    font-size: 14px;
}

.file-icon {
    color: #00b42a;
    font-size: 14px;
}

.content-area {
    flex: 1;
    background: #fff;
    overflow: hidden;
}

.content-wrapper {
    padding: 20px;
    height: 100%;
    overflow-y: auto;
}

/* 搜索对话框样式 */
.search-dialog-content {
    padding: 0;
}

.search-input-container {
    margin-bottom: 20px;
}

.search-results,
.all-features {
    max-height: 400px;
    overflow-y: auto;
}

.results-header,
.all-features-header {
    padding: 12px 0;
    border-bottom: 1px solid #e5e6eb;
    margin-bottom: 16px;
    font-weight: 600;
    color: #1d2129;
}

.results-count {
    font-size: 14px;
    color: #86909c;
}

.results-list,
.all-features-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.result-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    border: 1px solid #e5e6eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.result-item:hover {
    border-color: #165dff;
    box-shadow: 0 2px 8px rgba(22, 93, 255, 0.1);
    transform: translateY(-1px);
}

.result-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    background: #f2f3f5;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.result-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.result-title {
    font-weight: 600;
    color: #1d2129;
    font-size: 16px;
}

.result-category {
    font-size: 12px;
    color: #ff7d00;
    font-weight: 500;
    text-transform: uppercase;
}

.result-desc {
    font-size: 14px;
    color: #4e5969;
    line-height: 1.4;
}

.result-tags {
    display: flex;
    gap: 6px;
    margin-top: 4px;
}

.no-results {
    text-align: center;
    padding: 40px 20px;
    color: #86909c;
}

.no-results-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
}

.no-results-tip {
    font-size: 14px;
    margin-top: 8px;
    opacity: 0.7;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .header-content {
        padding: 0 16px;
    }

    .logo-text {
        font-size: 16px; /* 移动端稍微缩小字体 */
    }

    .user-avatar {
        width: 28px;
        height: 28px;
    }

    .avatar-text {
        font-size: 12px;
    }

    .content-wrapper {
        padding: 16px;
    }

    .search-dialog {
        width: 90vw !important;
    }
}
</style>