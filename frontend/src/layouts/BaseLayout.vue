<template>
    <a-layout class="layout">
        <!-- 顶部导航栏 - 全宽 -->
        <a-layout-header v-show="pageSettings.showHeader" class="layout-header">
            <div class="header-left">
                <!-- Logo区域 -->
                <div class="logo" @click="handleLogoClick">
                    <icon-book/>
                    <span class="logo-text">MagicBook</span>
                </div>


            </div>

            <div class="header-right">
                <a-input
                    v-model="searchText"
                    class="header-search"
                    placeholder="搜索功能..."
                    @focus="showSearchDialog"
                    size="small"
                >
                    <template #prefix>
                        <icon-search style="color: #c9cdd4;" />
                    </template>
                </a-input>

                <a-tooltip content="全屏">
                    <a-button class="header-btn" type="text" @click="toggleFullscreen">
                        <icon-fullscreen-exit v-if="isFullscreen"/>
                        <icon-fullscreen v-else/>
                    </a-button>
                </a-tooltip>

                <!-- 设置按钮 -->
                <a-tooltip content="页面设置">
                    <a-button type="text" class="header-btn" @click="showSettings">
                        <icon-settings />
                    </a-button>
                </a-tooltip>
                
                <a-dropdown @select="handleUserMenuSelect">
                    <div class="user-dropdown">
                        <a-avatar :size="32" :style="{ backgroundColor: userAvatarColor }">
                            {{ userInitial }}
                        </a-avatar>
                    </div>
                    <template #content>
                        <a-doption value="profile">
                            <icon-user/>
                            个人中心
                        </a-doption>
                        <a-doption value="logout">
                            <icon-export/>
                            退出登录
                        </a-doption>
                    </template>
                </a-dropdown>
            </div>
        </a-layout-header>

        <!-- 下层布局 -->
        <a-layout class="main-layout">
            <!-- 左侧边栏 -->
            <a-layout-sider
                v-show="pageSettings.showSidebar"
                :width="collapsed ? 50 : pageSettings.sidebarWidth"
                class="layout-sider"
                style="transition: width 0.2s"
            >
                 <a-menu
                     :collapsed="collapsed"
                     :default-open-keys="collapsed ? [] : ['通用工具', '生物信息']"
                     :selected-keys="selectedKeys"
                     class="menu"
                     theme="light"
                     @menu-item-click="handleMenuClick"
                     @sub-menu-click="(e) => e.stopPropagation()"
                 >
                     <a-sub-menu
                         v-for="(category, categoryKey) in menuCategories"
                         :key="categoryKey"
                     >
                         <template #icon>
                             <icon-tool v-if="categoryKey === '通用工具'" />
                             <icon-experiment v-else-if="categoryKey === '生物信息'" />
                             <icon-apps v-else />
                         </template>
                         <template #title>{{ category.title }}</template>
                         <a-menu-item
                             v-for="item in category.items"
                             :key="item.name"
                         >
                             <template #icon>
                                 <icon-file-pdf v-if="item.meta.title === 'PDF处理'" />
                                 <icon-code v-else-if="item.meta.title === 'Json操作'" />
                                 <icon-swap v-else-if="item.meta.title === 'Converter'" />
                                 <icon-link v-else-if="item.meta.title === 'HTTP客户端'" />
                                 <icon-download v-else-if="item.meta.title === 'TCMSP数据下载'" />
                                 <icon-tool v-else />
                             </template>
                             {{ item.meta.title }}
                         </a-menu-item>
                     </a-sub-menu>
                                      </a-menu>
                     
                     <!-- 自定义折叠按钮 -->
                     <div class="collapse-trigger" @click="toggleCollapse">
                         <icon-menu-fold v-if="!collapsed" />
                         <icon-menu-unfold v-if="collapsed" />
                     </div>
                     
                     <!-- 调试信息（开发时使用） -->
                     <div v-if="false" class="debug-info" style="position: absolute; bottom: 60px; left: 8px; font-size: 10px; color: #999;">
                         {{ collapsed ? '折叠' : '展开' }}
                     </div>
            </a-layout-sider>

            <!-- 右侧内容区域 -->
            <a-layout-content class="layout-main">
                <router-view v-slot="{ Component, route }">
                    <transition mode="out-in" name="fade">
                        <keep-alive :include="cacheList">
                            <component :is="Component" :key="route.fullPath"/>
                        </keep-alive>
                    </transition>
                </router-view>
            </a-layout-content>
        </a-layout>

        <!-- 搜索对话框 -->
        <SearchDialog
            v-model:visible="searchVisible"
            @navigate="handleNavigate"
        />
        
        <!-- 页面设置抽屉 -->
        <a-drawer
            v-model:visible="settingsVisible"
            title="页面配置"
            placement="right"
            :width="320"
            :footer="false"
            :mask="true"
            :mask-closable="true"
        >
            <div class="settings-content">
                <div class="setting-section">
                    <h4>内容区域</h4>
                    
                    <div class="setting-item">
                        <span>导航栏</span>
                        <a-switch v-model="pageSettings.showHeader" />
                    </div>
                    
                    <div class="setting-item">
                        <span>菜单栏</span>
                        <a-switch v-model="pageSettings.showSidebar" />
                    </div>
                    
                    <div class="setting-item">
                        <span>菜单宽度 (px)</span>
                        <a-input-number 
                            v-model="pageSettings.sidebarWidth" 
                            :min="200" 
                            :max="550" 
                            :step="10"
                            style="width: 80px;"
                        />
                    </div>
                </div>
                
                <div class="setting-section">
                    <h4>其他设置</h4>
                    
                    <div class="setting-item">
                        <span>自动保存设置</span>
                        <a-switch v-model="pageSettings.autoSave" />
                    </div>
                </div>
            </div>
        </a-drawer>
    </a-layout>
</template>

<script setup>
import {ref, computed, watch, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {
    IconBook, IconMenuFold, IconMenuUnfold, IconHome, IconTool,
    IconFilePdf, IconCode, IconSwap, IconLink, IconExperiment,
    IconDownload, IconFullscreen, IconFullscreenExit,
    IconUser, IconSettings, IconExport, IconDown, IconApps,
    IconBug, IconBulb, IconHeart, IconStar, IconFire, IconSearch
} from '@arco-design/web-vue/es/icon'

import {Message} from '@arco-design/web-vue'
import {appState} from '../states'
import {clearAuth} from '../utils/auth'
import SearchDialog from '../components/SearchDialog.vue'
const router = useRouter()
const route = useRoute()

// 响应式数据
const searchVisible = ref(false)
const settingsVisible = ref(false)
const isFullscreen = ref(false)

const selectedKeys = ref([])
const searchText = ref('')
const cacheList = ref(['Home', 'PDF处理', 'Json操作'])

// 页面设置
const SETTINGS_KEY = 'magicbook_page_settings'
const pageSettings = ref({
    showHeader: true,
    showSidebar: true,
    sidebarWidth: 200,
    autoSave: true
})

// 加载页面设置
const loadPageSettings = () => {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
        try {
            const parsed = JSON.parse(saved)
            pageSettings.value = { ...pageSettings.value, ...parsed }
        } catch (e) {
            console.error('加载页面设置失败:', e)
        }
    }
}

// 保存页面设置
const savePageSettings = () => {
    if (pageSettings.value.autoSave) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(pageSettings.value))
        console.log('💾 页面设置已保存')
    }
}


// 用户信息
const username = computed(() => appState.username)
const userAvatarColor = computed(() => {
    const colors = [
        '#f53f3f', '#ff7d00', '#ff9a2e', '#ffb400',
        '#00b42a', '#00d4aa', '#0fc6c2', '#165dff',
        '#722ed1'
    ]
    const index = username.value?.charCodeAt(0) % colors.length || 0
    return colors[index]
})

const userInitial = computed(() => {
    return username.value?.charAt(0).toUpperCase() || 'U'
})

// 强制保持折叠状态
const STORAGE_KEY = 'magicbook_menu_collapsed'
const collapsed = ref(localStorage.getItem(STORAGE_KEY) === 'true')

// 初始化时打印状态
console.log('🚀 初始化折叠状态:', collapsed.value ? '已折叠' : '已展开', '来自localStorage:', localStorage.getItem(STORAGE_KEY))

const toggleCollapse = () => {
    collapsed.value = !collapsed.value
    // 保存到localStorage，确保刷新和路由切换后状态不丢失
    localStorage.setItem(STORAGE_KEY, collapsed.value.toString())
    console.log('🔧 折叠状态切换:', collapsed.value ? '已折叠' : '已展开', '已保存到localStorage:', localStorage.getItem(STORAGE_KEY))
}

// 监听路由变化，但保持折叠状态不变
watch(() => route.path, (newPath) => {
    // 路由变化时，强制保持当前的折叠状态
    const savedCollapsed = localStorage.getItem(STORAGE_KEY) === 'true'
    if (collapsed.value !== savedCollapsed) {
        collapsed.value = savedCollapsed
        console.log('🔄 路由变化，强制恢复折叠状态:', collapsed.value ? '已折叠' : '已展开')
    }
}, { immediate: true })

// 页面加载时确保状态正确
onMounted(() => {
    // 再次检查localStorage状态
    const savedCollapsed = localStorage.getItem(STORAGE_KEY) === 'true'
    if (collapsed.value !== savedCollapsed) {
        collapsed.value = savedCollapsed
        console.log('📱 页面加载，恢复折叠状态:', collapsed.value ? '已折叠' : '已展开')
    }
    
    // 如果没有保存过状态，设置默认值
    if (localStorage.getItem(STORAGE_KEY) === null) {
        localStorage.setItem(STORAGE_KEY, 'false')
        console.log('📝 首次使用，设置默认折叠状态: 展开')
    }
    
    // 加载页面设置
    loadPageSettings()
})

// 监听页面设置变化，自动保存
watch(pageSettings, () => {
    savePageSettings()
}, { deep: true })

// 从路由动态生成菜单
const menuCategories = computed(() => {
    const categories = {}

    // 获取主路由的子路由（排除首页）
    const mainRoute = router.getRoutes().find(route => route.path === '/')
    const childRoutes = mainRoute?.children?.filter(child =>
        child.meta?.category && child.meta?.requiresAuth
    ) || []

    // 按category分组
    childRoutes.forEach(route => {
        const category = route.meta.category
        if (!categories[category]) {
            categories[category] = {
                title: category,
                items: []
            }
        }
        categories[category].items.push(route)
    })

    return categories
})

// 随机图标池
const iconPool = [
    'IconFilePdf', 'IconCode', 'IconSwap', 'IconLink', 'IconDownload',
    'IconTool', 'IconExperiment', 'IconHome', 'IconUser', 'IconSettings',
    'IconApps', 'IconBug', 'IconBulb', 'IconHeart', 'IconStar', 'IconFire'
]

// 图标映射
const iconMap = {
    'icon-file-pdf': 'IconFilePdf',
    'icon-code': 'IconCode',
    'icon-swap': 'IconSwap',
    'icon-link': 'IconLink',
    'icon-download': 'IconDownload',
    'icon-tool': 'IconTool',
    'icon-experiment': 'IconExperiment'
}

const getRandomIcon = (seed) => {
    const index = Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % iconPool.length
    return iconPool[index]
}

const getMenuIcon = (iconName, fallbackSeed = '') => {
    return iconMap[iconName] || getRandomIcon(fallbackSeed)
}

const getCategoryIcon = (categoryKey) => {
    if (categoryKey === '通用工具') return 'IconTool'
    if (categoryKey === '生物信息') return 'IconExperiment'
    return getRandomIcon(categoryKey)
}

// 路由映射（保持向后兼容）
const routeMap = {
    'PDF处理': '/pdf',
    'Json操作': '/json',
    'Converter': '/convert',
    'HTTP客户端': '/http',
    'TCMSP数据下载': '/tcmsp'
}

// 面包屑导航
const breadcrumbList = computed(() => {
    const breadcrumbs = [{title: '首页'}]

    if (route.path !== '/dashboard') {
        const routeTitle = Object.keys(routeMap).find(key => routeMap[key] === route.path)
        if (routeTitle) {
            if (['PDF处理', 'Json操作', 'Converter', 'HTTP客户端'].includes(routeTitle)) {
                breadcrumbs.push({title: '通用工具'})
            } else if (routeTitle === 'TCMSP数据下载') {
                breadcrumbs.push({title: '生物信息'})
            }
            breadcrumbs.push({title: routeTitle})
        }
    }

    return breadcrumbs
})

// 事件处理
const handleLogoClick = () => {
    router.push('/dashboard')
}

const handleMenuClick = (key, event) => {
    console.log('clpd',collapsed.value)
    if (event && event.stopPropagation) {
        event.stopPropagation()
    }

    // 先尝试从动态菜单中找路由
    for (const category of Object.values(menuCategories.value)) {
        const route = category.items.find(item => item.name === key)
        if (route) {
            router.push(route.path).then(() => {
                console.log('clpddd',collapsed.value)
            })
            return
        }
    }

    // 向后兼容，从routeMap查找
    const path = routeMap[key]
    if (path) {
        router.push(path).then(() => {
            console.log('clpddd',collapsed.value)
        })
    }

}

const handleNavigate = (path) => {
    router.push(path)
    searchVisible.value = false
}

const showSearchDialog = () => {
    searchVisible.value = true
    searchText.value = ''
}

const showSettings = () => {
    settingsVisible.value = true
}

const toggleFullscreen = () => {
    if (document.fullscreenElement) {
        document.exitFullscreen()
        isFullscreen.value = false
    } else {
        document.documentElement.requestFullscreen()
        isFullscreen.value = true
    }
}

const handleUserMenuSelect = (value) => {
    switch (value) {
        case 'profile':
            Message.info('个人中心功能开发中...')
            break
        case 'settings':
            Message.info('系统设置功能开发中...')
            break
        case 'logout':
            clearAuth()
            appState.username = ''
            router.push('/login')
            Message.success('已退出登录')
            break
    }
}


// 监听路由变化更新菜单选中状态
watch(() => route.path, (newPath) => {
    // 先从动态菜单中查找
    for (const category of Object.values(menuCategories.value)) {
        const route = category.items.find(item => item.path === newPath)
        if (route) {
            selectedKeys.value = [route.name]
            return
        }
    }

    // 向后兼容，从routeMap查找
    const menuKey = Object.keys(routeMap).find(key => routeMap[key] === newPath)
    if (menuKey) {
        selectedKeys.value = [menuKey]
    } else if (newPath === '/dashboard') {
        // 首页不在菜单中，清空选中状态
        selectedKeys.value = []
    }
}, {immediate: true})

// 监听全屏状态
onMounted(() => {
    document.addEventListener('fullscreenchange', () => {
        isFullscreen.value = !!document.fullscreenElement
    })
})
</script>

<style scoped>
/* 整体布局 */
.layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f5f5f5;
}

/* 顶部导航栏 */
.layout-header {
    height: 48px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-right: 8px;
}

.logo {
    display: flex;
    align-items: center;
    font-size: 20px;
    font-weight: bold;
    color: #000;
    padding: 8px;
    cursor: pointer;
}

.logo:hover {
    /* 移除悬停时的背景色变化 */
}

.logo:active {
    /* 移除点击时的背景色变化 */
}

.logo-text {
    margin-left: 12px;
    font-size: 18px;
}

.header-search {
    width: 240px;
}

.header-btn {
    font-size: 16px;
    padding: 8px;
}

.user-dropdown {
    display: flex;
    align-items: center;
    cursor: pointer;
}

/* 下层主布局 */
.main-layout {
    flex: 1;
    overflow: hidden;
}

/* 侧边栏 */
.layout-sider {
    background: #fff;
    border-right: 1px solid #f0f0f0;
}

.menu {
    background: transparent;
    border: none;
    padding: 8px 0;
    height: calc(100vh - 88px);
    overflow-y: auto;
}

/* 菜单样式 - 使用Arco Design原生样式 */
:deep(.arco-menu-item) {
    margin: 2px 8px;
}

:deep(.arco-menu-sub-menu-title) {
    margin: 2px 8px;
}

/* 折叠状态下的基本样式 */
:deep(.arco-menu-collapsed .arco-menu-item) {
    justify-content: center;
}

:deep(.arco-menu-collapsed .arco-menu-item-icon) {
    margin-right: 0;
    font-size: 18px;
}

:deep(.arco-menu-collapsed .arco-menu-sub-menu-title) {
    justify-content: center;
}

:deep(.arco-menu-collapsed .arco-menu-sub-menu .arco-menu-item) {
    display: none;
}

:deep(.arco-menu-collapsed .arco-menu-sub-menu-title .arco-menu-title) {
    display: none;
}

/* 折叠按钮 */
.collapse-trigger {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #666;
}

.collapse-trigger:hover {
    color: #165dff;
}


/* 主要内容区域 */
.layout-main {
    padding: 16px 24px 16px 16px;
    overflow-y: auto;
    height: calc(100vh - 48px);
}

/* 页面切换动画 */
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

/* 设置页面样式 */
.settings-content {
    padding: 16px 0;
}

.setting-section {
    margin-bottom: 20px;
}

.setting-section h4 {
    margin: 0 0 12px 0;
    font-size: 15px;
    font-weight: 600;
    border-bottom: 1px solid #f2f3f5;
    padding-bottom: 6px;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f7f8fa;
}

.setting-item:last-child {
    border-bottom: none;
}

.setting-item span {
    flex: 1;
    margin-right: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .header-search {
        width: 200px;
    }

    .layout-main {
        padding: 16px;
    }
}
</style>
