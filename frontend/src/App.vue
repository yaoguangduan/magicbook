<template>
    <router-view v-slot="{ Component, route }">
        <component :is="Component" :key="route.path"/>
    </router-view>
    <DebugAuth v-if="isDev"/>
</template>

<script setup>
import {computed} from 'vue'
import DebugAuth from './components/DebugAuth.vue'

// 只在开发环境显示调试组件
const isDev = computed(() => {
    return import.meta.env.DEV
})
</script>

<style>
/* 全局样式重置 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
    height: 100vh;
}

/* Arco Design 主题自定义 */
:root {
    --primary-color: #165dff;
}

/* 滚动条样式 */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: var(--color-fill-2);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: var(--color-fill-4);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--color-fill-3);
}
</style>
