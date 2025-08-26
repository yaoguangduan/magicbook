# Bun可执行文件构建指南

## 概述

Bun提供了多种方式将TypeScript/JavaScript代码转换为可执行文件。本指南将介绍所有可用的方法和最佳实践。

## 方法一：`bun build --compile` (推荐)

这是最简单和推荐的方法，可以创建独立的二进制可执行文件。

### 基本语法

```bash
bun build --compile <entry-file> --outfile <output-path>
```

### 实际例子

```bash
# 构建服务器为单个可执行文件
bun build --compile ./backend/server.ts --outfile ./dist/magicbook

# 构建带压缩的版本
bun build --compile --minify ./backend/server.ts --outfile ./dist/magicbook-min

# 指定目标平台
bun build --compile --target=linux-x64 ./backend/server.ts --outfile ./dist/magicbook-linux
```

### 支持的目标平台

- `linux-x64` (默认在Linux上)
- `darwin-x64` (默认在macOS上)  
- `darwin-arm64` (Apple Silicon)
- `windows-x64` (默认在Windows上)

### 优点
- ✅ 生成真正的可执行文件
- ✅ 不需要安装Bun运行时
- ✅ 包含所有依赖
- ✅ 启动速度快

### 缺点
- ❌ 文件较大 (通常10-50MB)
- ❌ 实验性功能，可能不稳定
- ❌ 部分Node.js模块可能不兼容

## 方法二：`bun build` (JavaScript包)

构建为JavaScript包，仍需要Bun运行时。

### 基本语法

```bash
bun build <entry-file> --outdir <output-dir> --target bun
```

### 实际例子

```bash
# 构建为单个JS文件
bun build ./backend/server.ts --outdir ./dist --target bun --minify

# 构建多入口点项目
bun build ./backend/server.ts ./backend/worker.ts --outdir ./dist --target bun

# 构建浏览器兼容版本
bun build ./frontend/src/main.ts --outdir ./dist --target browser
```

### 优点
- ✅ 文件小
- ✅ 构建速度快
- ✅ 兼容性好
- ✅ 支持代码分割

### 缺点
- ❌ 需要安装Bun运行时
- ❌ 部署时需要额外步骤

## 方法三：使用构建脚本

我已经为你创建了一个完整的构建脚本：

```bash
# 运行构建脚本
bun run backend/scripts/build-executable.ts --help

# 构建单文件包
bun run backend/scripts/build-executable.ts --single

# 构建可执行二进制
bun run backend/scripts/build-executable.ts --executable

# 完整构建 (包含启动脚本)
bun run backend/scripts/build-executable.ts --full
```

## 实际构建示例

### 1. 简单的HTTP服务器

```typescript
// server.ts
import { serve } from 'bun'

const server = serve({
  port: 3000,
  fetch(req) {
    return new Response('Hello from Bun executable!')
  }
})

console.log(`Server running on http://localhost:${server.port}`)
```

构建命令：
```bash
bun build --compile server.ts --outfile server-exec
```

### 2. 命令行工具

```typescript
// cli.ts
#!/usr/bin/env bun

const args = process.argv.slice(2)

if (args.includes('--help')) {
  console.log('Usage: mycli [options]')
  process.exit(0)
}

console.log('Hello from CLI tool!')
console.log('Args:', args)
```

构建命令：
```bash
bun build --compile cli.ts --outfile mycli
chmod +x mycli
```

### 3. 包含依赖的复杂应用

```typescript
// app.ts
import chalk from 'chalk'
import { readFileSync } from 'fs'

console.log(chalk.green('Starting application...'))

const config = JSON.parse(readFileSync('./config.json', 'utf-8'))
console.log('Config:', config)
```

构建命令：
```bash
# 确保依赖已安装
bun install

# 构建
bun build --compile app.ts --outfile myapp
```

## 高级配置

### 使用配置文件

创建 `build.config.ts`：

```typescript
// build.config.ts
export default {
  entrypoints: ['./src/server.ts'],
  outdir: './dist',
  target: 'bun',
  minify: true,
  sourcemap: true,
  external: ['fsevents'], // 排除特定依赖
}
```

使用配置：
```bash
bun build --config ./build.config.ts
```

### 环境变量注入

```typescript
// 在构建时注入环境变量
const server = serve({
  port: process.env.PORT || 3000,
  // 构建时这些值会被内联
})
```

构建时设置：
```bash
NODE_ENV=production PORT=8080 bun build --compile server.ts --outfile server
```

## 部署策略

### 1. Docker部署

```dockerfile
# Dockerfile.build
FROM oven/bun:alpine as builder

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install

COPY . .
RUN bun build --compile ./backend/server.ts --outfile server

# 运行时镜像
FROM alpine:latest
RUN apk add --no-cache glibc
COPY --from=builder /app/server /usr/local/bin/server
EXPOSE 3000
CMD ["server"]
```

### 2. CI/CD构建

```yaml
# .github/workflows/build.yml
name: Build Executables

on: [push, release]

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        
    steps:
    - uses: actions/checkout@v3
    - uses: oven-sh/setup-bun@v1
    
    - name: Install dependencies
      run: bun install
      
    - name: Build executable
      run: |
        if [ "$RUNNER_OS" == "Windows" ]; then
          bun build --compile ./backend/server.ts --outfile ./dist/magicbook.exe
        else
          bun build --compile ./backend/server.ts --outfile ./dist/magicbook
        fi
      shell: bash
      
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: magicbook-${{ matrix.os }}
        path: dist/
```

### 3. 自动版本管理

```typescript
// version.ts
export const VERSION = '1.0.0'
export const BUILD_TIME = new Date().toISOString()
export const COMMIT_HASH = process.env.GITHUB_SHA || 'unknown'
```

构建脚本：
```bash
#!/bin/bash
VERSION=$(git describe --tags --always)
COMMIT=$(git rev-parse --short HEAD)
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

bun build --compile \
  --define="process.env.VERSION=\"$VERSION\"" \
  --define="process.env.COMMIT=\"$COMMIT\"" \
  --define="process.env.BUILD_TIME=\"$BUILD_TIME\"" \
  ./backend/server.ts \
  --outfile "./dist/magicbook-$VERSION"
```

## 性能优化

### 1. 减小文件大小

```bash
# 使用压缩
bun build --compile --minify server.ts --outfile server

# 排除不必要的依赖
bun build --compile --external=fsevents --external=@swc/core server.ts --outfile server
```

### 2. 启动时间优化

```typescript
// 延迟加载重型依赖
async function loadHeavyDeps() {
  const { default: heavyLib } = await import('./heavy-lib')
  return heavyLib
}

// 只在需要时加载
if (shouldUseFeature) {
  const lib = await loadHeavyDeps()
}
```

### 3. 内存优化

```typescript
// 使用流式处理
const response = await fetch(url)
return new Response(response.body, {
  headers: response.headers
})
```

## 故障排除

### 常见问题

**1. "Module not found" 错误**
```bash
# 确保所有依赖都已安装
bun install

# 检查import路径
bun check server.ts
```

**2. "Permission denied" 错误**
```bash
# 给可执行文件添加执行权限
chmod +x ./dist/magicbook
```

**3. 文件过大**
```bash
# 使用压缩和排除策略
bun build --compile --minify --external=@swc/core server.ts --outfile server
```

**4. 运行时错误**
```bash
# 检查目标平台是否正确
bun build --compile --target=linux-x64 server.ts --outfile server-linux
```

### 调试技巧

```typescript
// 添加构建信息
console.log('Build info:', {
  version: process.env.VERSION,
  target: process.platform,
  arch: process.arch,
  node: process.version
})
```

## 最佳实践

1. **使用TypeScript配置**：确保`tsconfig.json`正确配置
2. **依赖管理**：避免使用纯Node.js特有的模块
3. **错误处理**：添加完善的错误处理和日志
4. **版本控制**：包含版本信息和构建元数据
5. **测试**：在目标平台上测试可执行文件
6. **文档**：提供清晰的使用说明

## 总结

Bun的`--compile`选项是将TypeScript转换为可执行文件的最佳方式。它提供了：
- 🚀 快速的构建过程
- 📦 自包含的可执行文件
- ⚡ 优秀的运行时性能
- 🔧 灵活的配置选项

通过合理的配置和优化，你可以创建高效、可部署的可执行文件。
