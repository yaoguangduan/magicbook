<template>
  <div class="main-layout">
    <!-- 顶部导航栏 -->
    <a-layout-header class="header">
      <div class="header-content">
        <div class="logo">
          <icon-book class="logo-icon"/>
          <span class="logo-text">MagicBook</span>
        </div>
        <div class="header-right">
          <a-button type="text" @click="toggleDrawer">
            <template #icon>
              <icon-menu/>
            </template>
          </a-button>
        </div>
      </div>
    </a-layout-header>

    <!-- 主要内容区域 -->
    <a-layout class="main-content">
      <!-- 左侧抽屉 -->
      <a-drawer
          v-model:visible="drawerVisible"
          :closable="false"
          :width="280"
          class="sidebar-drawer"
          placement="left"
      >
        <div class="sidebar-header">
          <h3>功能导航</h3>
        </div>

        <!-- 搜索框 -->
        <div class="search-container">
          <a-input-search
              v-model="searchText"
              allow-clear
              placeholder="搜索功能..."
              @search="onSearch"
          />
        </div>

        <!-- 树形菜单 -->
        <div class="tree-container">
          <a-tree
              :data="treeData"
              :default-expand-all="true"
              :field-names="fieldNames"
              class="navigation-tree"
              @select="onTreeSelect"
          >
            <template #title="{ node, data }">
              <div class="tree-node">
                <icon-folder v-if="data.children" class="folder-icon"/>
                <icon-file v-else class="file-icon"/>
                <span class="node-title">{{ data.title }}</span>
                <span v-if="data.desc" class="node-desc">{{ data.desc }}</span>
              </div>
            </template>
          </a-tree>
        </div>
      </a-drawer>

      <!-- 右侧内容区域 -->
      <a-layout-content class="content-area">
        <div class="content-wrapper">
          <router-view/>
        </div>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {IconBook, IconFile, IconFolder, IconMenu} from '@arco-design/web-vue/es/icon'

const router = useRouter()
const route = useRoute()

// 响应式数据
const drawerVisible = ref(false)
const searchText = ref('')

// 抽屉开关
const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
}

// 搜索功能
const onSearch = (value) => {
  console.log('搜索:', value)
  // 这里可以实现搜索逻辑
}

// 树形数据字段映射
const fieldNames = {
  key: 'path',
  title: 'name',
  children: 'children'
}

// 从路由生成树形数据
const treeData = computed(() => {
  const routes = router.getRoutes()
  const categoryMap = new Map()

  routes.forEach(route => {
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
        desc: route.meta.desc
      })
    } else if (route.path === '/') {
      // 主页单独处理
      categoryMap.set('主页', {
        name: '主页',
        path: 'home',
        children: [{
          name: route.name,
          path: route.path,
          desc: route.meta.desc
        }]
      })
    }
  })

  return Array.from(categoryMap.values())
})

// 树节点选择
const onTreeSelect = (selectedKeys, node) => {
  const selectedPath = selectedKeys[0]
  if (selectedPath && selectedPath !== route.path) {
    router.push(selectedPath)
    // 在移动端可以自动关闭抽屉
    if (window.innerWidth < 768) {
      drawerVisible.value = false
    }
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
  height: 60px;
  line-height: 60px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 100%;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
  color: #165dff;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
}

.header-right {
  display: flex;
  align-items: center;
}

.main-content {
  flex: 1;
  display: flex;
}

.sidebar-drawer {
  background: #f7f8fa;
}

.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e6eb;
}

.sidebar-header h3 {
  margin: 0;
  color: #1d2129;
  font-size: 16px;
  font-weight: 600;
}

.search-container {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e6eb;
}

.tree-container {
  padding: 16px 0;
  flex: 1;
  overflow-y: auto;
}

.navigation-tree {
  background: transparent;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.folder-icon {
  color: #ff7d00;
  font-size: 16px;
}

.file-icon {
  color: #00b42a;
  font-size: 16px;
}

.node-title {
  font-weight: 500;
  color: #1d2129;
}

.node-desc {
  font-size: 12px;
  color: #86909c;
  margin-left: auto;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .logo-text {
    font-size: 18px;
  }

  .content-wrapper {
    padding: 16px;
  }
}
</style>
