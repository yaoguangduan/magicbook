<template>
  <div class="home-container">
    <div class="hero-section">
      <div class="logo-container">
        <!-- MagicBook SVG 图标 -->
        <svg class="magicbook-logo" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <!-- 书本主体 -->
          <rect fill="#4f46e5" height="60" rx="4" stroke="#3730a3" stroke-width="2" width="80" x="20" y="30"/>

          <!-- 书页 -->
          <rect fill="#ffffff" height="50" rx="2" width="70" x="25" y="35"/>

          <!-- 书脊装饰 -->
          <rect fill="#3730a3" height="60" width="5" x="20" y="30"/>

          <!-- 魔法星星 -->
          <g class="magic-stars">
            <path d="M35 45 L37 47 L39 45 L37 43 Z" fill="#fbbf24" opacity="0.8"/>
            <path d="M85 50 L87 52 L89 50 L87 48 Z" fill="#fbbf24" opacity="0.6"/>
            <path d="M45 70 L47 72 L49 70 L47 68 Z" fill="#fbbf24" opacity="0.7"/>
            <path d="M75 65 L77 67 L79 65 L77 63 Z" fill="#fbbf24" opacity="0.9"/>
          </g>

          <!-- 书页内容线条 -->
          <g class="book-lines" opacity="0.6" stroke="#e5e7eb" stroke-width="1">
            <line x1="30" x2="90" y1="42" y2="42"/>
            <line x1="30" x2="85" y1="48" y2="48"/>
            <line x1="30" x2="90" y1="54" y2="54"/>
            <line x1="30" x2="80" y1="60" y2="60"/>
            <line x1="30" x2="88" y1="66" y2="66"/>
            <line x1="30" x2="75" y1="72" y2="72"/>
          </g>

          <!-- 魔法光芒效果 -->
          <g class="magic-rays" opacity="0.3">
            <path d="M60 20 L65 25 L60 30 L55 25 Z" fill="#a855f7"/>
            <path d="M60 90 L65 95 L60 100 L55 95 Z" fill="#a855f7"/>
            <path d="M20 60 L25 65 L30 60 L25 55 Z" fill="#a855f7"/>
            <path d="M90 60 L95 65 L100 60 L95 55 Z" fill="#a855f7"/>
          </g>

          <!-- 魔法粒子 -->
          <g class="magic-particles">
            <circle cx="40" cy="25" fill="#ec4899" opacity="0.7" r="2"/>
            <circle cx="80" cy="35" fill="#8b5cf6" opacity="0.6" r="1.5"/>
            <circle cx="35" cy="80" fill="#06b6d4" opacity="0.8" r="1"/>
            <circle cx="85" cy="85" fill="#10b981" opacity="0.5" r="2.5"/>
          </g>

          <!-- 装饰性边框 -->
          <g class="decorative-border" fill="none" opacity="0.4" stroke="#a855f7" stroke-width="1">
            <path d="M15 25 Q15 15 25 15 L95 15 Q105 15 105 25"/>
            <path d="M15 95 Q15 105 25 105 L95 105 Q105 105 105 95"/>
          </g>
        </svg>
      </div>

      <h1 class="app-title">MagicBook</h1>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 不需要任何逻辑
</script>

<style scoped>
.home-container {
  min-height: calc(100vh - 90px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-section {
  text-align: center;
  transform: translateY(-10px);
}

.logo-container {
  margin-bottom: 15px;
}

.magicbook-logo {
  width: 300px;
  height: 200px;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-3px);
  }
}

.magic-stars {
  animation: twinkle 2s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.3;
  }
}

.magic-rays {
  animation: glow 4s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

.magic-particles {
  animation: float 5s ease-in-out infinite;
}

.app-title {
  font-size: 2rem;
  font-weight: 800;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .magicbook-logo {
    width: 80px;
    height: 80px;
  }

  .app-title {
    font-size: 1.8rem;
  }

  .hero-section {
    transform: translateY(-5px);
  }
}
</style>
