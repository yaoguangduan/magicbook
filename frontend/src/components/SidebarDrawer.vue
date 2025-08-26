<template>
    <a-drawer
        :closable="false"
        :header="false"
        :visible="visible"
        :width="320"
        class="sidebar-drawer"
        placement="left"
        @update:visible="$emit('update:visible', $event)"
        @after-enter="onDrawerOpen"
    >
        <!-- 搜索框 -->
        <div class="search-container">
            <a-input-search
                ref="searchInputRef"
                v-model="searchText"
                allow-clear
                placeholder="搜索功能、关键词..."
                @input="onSearchInput"
                @search="onSearch"
            />
        </div>

        <!-- 简化的菜单列表 -->
        <div class="menu-container">
            <div
                v-for="category in filteredMenuData"
                :key="category.path"
                class="menu-category"
            >
                <div class="category-header">
                    <icon-folder class="folder-icon"/>
                    <span class="category-title">{{ category.name }}</span>
                </div>
                <div class="menu-items">
                    <div
                        v-for="item in category.children"
                        :key="item.path"
                        class="menu-item"
                        @click="navigateTo(item.path)"
                    >
                        <icon-file class="file-icon"/>
                        <div class="item-content">
                            <span class="item-title">{{ item.name }}</span>
                            <span v-if="item.desc" class="item-desc">{{ item.desc }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a-drawer>
</template>

<script setup>
import {ref, computed, watch, nextTick} from 'vue'
import {useRouter} from 'vue-router'
import {IconFolder, IconFile} from '@arco-design/web-vue/es/icon'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:visible', 'navigate'])

const router = useRouter()
const searchText = ref('')
const searchInputRef = ref(null)

// 监听 visible 变化，自动聚焦搜索框
watch(() => props.visible, (newVal) => {
    if (newVal) {
        nextTick(() => {
            if (searchInputRef.value) {
                searchInputRef.value.focus()
            }
        })
    }
})

// 搜索功能
const onSearch = (value) => {
    console.log('搜索:', value)
}

// 实时搜索输入
const onSearchInput = (value) => {
    console.log('搜索输入:', value)
}

// drawer 打开后自动聚焦搜索框
const onDrawerOpen = () => {
    nextTick(() => {
        if (searchInputRef.value) {
            searchInputRef.value.focus()
        }
    })
}

// 从路由生成菜单数据
const menuData = computed(() => {
    const routes = router.getRoutes()
    const categoryMap = new Map()

    routes.forEach(route => {
        if (!route.name) return

        if (route.meta?.category) {
            const category = route.meta.category
            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    name: category,
                    path: `category-${category}`,
                    children: []
                })
            }
            categoryMap.get(category).children.push({
                name: route.name,
                path: route.path,
                desc: route.meta.desc || '',
                searchKeys: route.meta.searchKeys || []
            })
        }
    })

    return Array.from(categoryMap.values())
})

// 过滤后的菜单数据（用于搜索）
const filteredMenuData = computed(() => {
    if (!searchText.value.trim()) {
        return menuData.value
    }

    const searchTerm = searchText.value.toLowerCase()

    return menuData.value.map(category => {
        const filteredChildren = category.children.filter(item => {
            // 检查名称、描述和搜索关键词
            const nameMatch = item.name.toLowerCase().includes(searchTerm)
            const descMatch = item.desc.toLowerCase().includes(searchTerm)
            const searchKeysMatch = item.searchKeys.some(key =>
                key.toLowerCase().includes(searchTerm)
            )

            return nameMatch || descMatch || searchKeysMatch
        })

        if (filteredChildren.length > 0) {
            return {
                ...category,
                children: filteredChildren
            }
        }
        return null
    }).filter(Boolean)
})

// 导航到指定路由
const navigateTo = (path) => {
    emit('navigate', path)
    emit('update:visible', false)
}
</script>

<style scoped>
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

/* 确保 drawer 内容正确显示 */
:deep(.arco-drawer-body) {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
}

:deep(.arco-drawer-content) {
    height: 100%;
}

/* 搜索框样式 */
:deep(.arco-input-search) {
    width: 100%;
}

:deep(.arco-input) {
    border-radius: 6px;
}

:deep(.arco-input:focus) {
    border-color: #165dff;
    box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
}

/* 滚动条样式 */
.menu-container::-webkit-scrollbar {
    width: 4px;
}

.menu-container::-webkit-scrollbar-track {
    background: transparent;
}

.menu-container::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 2px;
}

.menu-container::-webkit-scrollbar-thumb:hover {
    background: #bfbfbf;
}
</style>
