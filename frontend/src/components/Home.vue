<template>
    <div class="welcome-container">
        <div class="welcome-content">
        </div>
    </div>
</template>

<script setup>
// 不需要任何逻辑
</script>

<style scoped>
.welcome-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    min-height: 400px;
}

.welcome-content {
    text-align: center;
}

.welcome-title {
    font-size: 36px;
    font-weight: 600;
    color: #1d2129;
    margin: 0 0 16px 0;
}

.welcome-subtitle {
    font-size: 18px;
    color: #4e5969;
    margin: 0;
}
</style>
