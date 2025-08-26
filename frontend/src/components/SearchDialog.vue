<template>
    <a-modal
        :closable="true"
        :footer="false"
        :visible="visible"
        :width="600"
        class="search-dialog"
        title="搜索功能"
        @update:visible="$emit('update:visible', $event)"
    >
        <div class="search-dialog-content">
            <!-- 搜索输入框 -->
            <div class="search-input-container">
                <a-input-search
                    ref="searchInputRef"
                    v-model="searchText"
                    allow-clear
                    placeholder="输入关键词搜索功能..."
                    size="large"
                    @input="onSearchInput"
                    @keydown="handleKeydown"
                    @search="onSearch"
                >
                </a-input-search>
            </div>

            <!-- 搜索结果列表 -->
            <div v-if="searchText.trim()" class="search-results">
                <div class="results-list">
                    <div
                        v-for="(result, index) in filteredResults"
                        :key="result.path"
                        :class="{ 'result-item-active': index === activeIndex }"
                        class="result-item"
                        @click="navigateToResult(result.path)"
                    >
                        <div class="result-icon">
                            <icon-file class="file-icon"/>
                        </div>
                        <div class="result-content">
                            <div class="result-title">{{ result.name }}</div>
                            <div class="result-category">{{ result.category }}</div>
                            <div class="result-desc">{{ result.desc }}</div>
                            <div v-if="result.searchKeys && result.searchKeys.length" class="result-tags">
                                <a-tag
                                    v-for="tag in result.searchKeys.slice(0, 3)"
                                    :key="tag"
                                    color="blue"
                                    size="small"
                                >
                                    {{ tag }}
                                </a-tag>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 默认显示所有功能 -->
            <div v-else class="all-features">
                <div class="all-features-list">
                    <div
                        v-for="(result, index) in allFeatures"
                        :key="result.path"
                        :class="{ 'result-item-active': index === activeIndex }"
                        class="result-item"
                        @click="navigateToResult(result.path)"
                    >
                        <div class="result-icon">
                            <icon-file class="file-icon"/>
                        </div>
                        <div class="result-content">
                            <div class="result-title">{{ result.name }}</div>
                            <div class="result-category">{{ result.category }}</div>
                            <div class="result-desc">{{ result.desc }}</div>
                            <div v-if="result.searchKeys && result.searchKeys.length" class="result-tags">
                                <a-tag
                                    v-for="tag in result.searchKeys.slice(0, 3)"
                                    :key="tag"
                                    color="blue"
                                    size="small"
                                >
                                    {{ tag }}
                                </a-tag>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 键盘操作提示 -->
            <div class="keyboard-hints">
                <div class="hint-item">
                    <svg class="hint-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <polyline points="18,15 12,9 6,15"></polyline>
                    </svg>
                    <span>上翻</span>
                </div>
                <div class="hint-item">
                    <svg class="hint-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                    <span>下翻</span>
                </div>
                <div class="hint-item">
                    <svg aria-hidden="true" class="hint-icon" fill="#4e5969" height="16" stroke="none" viewBox="0 0 24 24" width="16">
                        <path d="M19 7v4a4 4 0 0 1-4 4H7.83l1.58 1.59L8 18l-4-4 4-4 1.41 1.41L7.83 13H15a2 2 0 0 0 2-2V7h2z"/>
                    </svg>
                    <span>回车进入</span>
                </div>
            </div>
        </div>
    </a-modal>
</template>

<script setup>
import {ref, computed, watch, nextTick} from 'vue'
import {useRouter} from 'vue-router'
import {IconFile, IconSearch} from '@arco-design/web-vue/es/icon'

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
const activeIndex = ref(0)

// 监听 visible 变化，自动聚焦搜索框
watch(() => props.visible, (newVal) => {
    if (newVal) {
        nextTick(() => {
            setTimeout(() => {
                if (searchInputRef.value) {
                    searchInputRef.value.focus()
                }
            }, 100)
        })
    }
})

// 搜索功能
const onSearch = (value) => {
    console.log('搜索:', value)
}

// 搜索输入
const onSearchInput = (value) => {
    activeIndex.value = 0 // 重置活跃索引
}

// 键盘导航处理
const handleKeydown = (event) => {
    const currentList = searchText.value.trim() ? filteredResults.value : allFeatures.value

    if (currentList.length === 0) return

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault()
            activeIndex.value = (activeIndex.value + 1) % currentList.length
            break
        case 'ArrowUp':
            event.preventDefault()
            activeIndex.value = activeIndex.value === 0 ? currentList.length - 1 : activeIndex.value - 1
            break
        case 'Enter':
            event.preventDefault()
            if (activeIndex.value >= 0 && activeIndex.value < currentList.length) {
                const selectedItem = currentList[activeIndex.value]
                navigateToResult(selectedItem.path)
            }
            break
    }
}

// 所有功能列表
const allFeatures = computed(() => {
    const routes = router.getRoutes()
    const features = []

    routes.forEach(route => {
        if (route.name && route.meta?.category) {
            features.push({
                name: route.name,
                path: route.path,
                category: route.meta.category,
                desc: route.meta.desc || '',
                searchKeys: route.meta.searchKeys || []
            })
        }
    })

    return features
})

// 搜索结果
const filteredResults = computed(() => {
    if (!searchText.value.trim()) {
        return []
    }

    const searchTerm = searchText.value.toLowerCase()

    return allFeatures.value.filter(item => {
        // 检查名称、描述、分类和搜索关键词
        const nameMatch = item.name.toLowerCase().includes(searchTerm)
        const descMatch = item.desc.toLowerCase().includes(searchTerm)
        const categoryMatch = item.category.toLowerCase().includes(searchTerm)
        const searchKeysMatch = item.searchKeys.some(key =>
            key.toLowerCase().includes(searchTerm)
        )

        return nameMatch || descMatch || categoryMatch || searchKeysMatch
    })
})

// 导航到搜索结果
const navigateToResult = (path) => {
    emit('navigate', path)
    emit('update:visible', false)
    searchText.value = ''
    activeIndex.value = 0
}
</script>

<style scoped>
.search-dialog-content {
    padding: 0;
}

.search-input-container {
    margin-bottom: 16px;
}

.search-results,
.all-features {
    max-height: 400px;
    overflow-y: auto;
    padding: 4px 0;
}

.results-list,
.all-features-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 4px;
}

.result-item {
    display: flex;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid #e5e6eb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.result-item:hover {
    border-color: #165dff;
    box-shadow: 0 2px 8px rgba(22, 93, 255, 0.1);
    transform: translateY(-1px);
}

.result-item-active {
    border-color: #165dff;
    box-shadow: 0 2px 8px rgba(22, 93, 255, 0.1);
    transform: translateY(-1px);
    background-color: #f2f3f5;
}

.result-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    background: #f2f3f5;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.result-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.result-title {
    font-weight: 600;
    color: #1d2129;
    font-size: 14px;
    line-height: 1.2;
}

.result-category {
    font-size: 11px;
    color: #ff7d00;
    font-weight: 500;
    text-transform: uppercase;
    line-height: 1.2;
}

.result-desc {
    font-size: 12px;
    color: #4e5969;
    line-height: 1.3;
}

.result-tags {
    display: flex;
    gap: 4px;
    margin-top: 2px;
}

/* 确保 modal 内容正确显示 */
:deep(.arco-modal-body) {
    padding: 20px;
}

:deep(.arco-modal-content) {
    border-radius: 8px;
}

/* 搜索框样式 */
:deep(.arco-input-search) {
    width: 100%;
    border: 1px solid #e5e6eb;
    border-radius: 6px;
    overflow: hidden;
}

:deep(.arco-input-search:focus-within) {
    border-color: #165dff;
    box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
}

:deep(.arco-input-search .arco-input-group) {
    border: none;
}

:deep(.arco-input-search .arco-input-group .arco-input) {
    border: none;
    border-radius: 0;
    box-shadow: none;
}

:deep(.arco-input-search .arco-input-group .arco-input:focus) {
    border: none;
    box-shadow: none;
}

:deep(.arco-input-search .arco-input-group-addon) {
    background: transparent;
    border: none;
    padding: 0;
}

:deep(.arco-input-search .arco-input-group-addon .arco-btn) {
    border: none;
    background: transparent;
    color: #86909c;
    padding: 8px 12px;
}

:deep(.arco-input-search .arco-input-group-addon .arco-btn:hover) {
    background: #f2f3f5;
    color: #165dff;
}

/* 标签样式 */
:deep(.arco-tag) {
    border-radius: 3px;
    font-size: 10px;
    padding: 0 6px;
    height: 20px;
    line-height: 18px;
}

/* 滚动条样式 */
.search-results::-webkit-scrollbar,
.all-features::-webkit-scrollbar {
    width: 6px;
}

.search-results::-webkit-scrollbar-track,
.all-features::-webkit-scrollbar-track {
    background: transparent;
}

.search-results::-webkit-scrollbar-thumb,
.all-features::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 3px;
}

.search-results::-webkit-scrollbar-thumb:hover,
.all-features::-webkit-scrollbar-thumb:hover {
    background: #bfbfbf;
}

/* 键盘操作提示样式 */
.keyboard-hints {
    display: flex;
    gap: 16px;
    justify-content: flex-end;
    align-items: center;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e5e6eb;
}

.hint-item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #86909c;
    font-size: 12px;
}

.hint-icon {
    width: 14px;
    height: 14px;
    color: #86909c;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .search-dialog {
        width: 90vw !important;
    }

    .result-item {
        padding: 8px 10px;
    }

    .result-title {
        font-size: 13px;
    }

    .result-desc {
        font-size: 11px;
    }

    .result-icon {
        width: 28px;
        height: 28px;
    }

    .keyboard-hints {
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
    }

    .hint-item {
        font-size: 11px;
    }

    .hint-icon {
        width: 12px;
        height: 12px;
    }
}
</style>
