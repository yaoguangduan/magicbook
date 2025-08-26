# Node.js与Bun兼容性迁移指南

## 概述

本指南将帮助你将现有的Node.js代码迁移为同时兼容Node.js和Bun的代码。

## 常见兼容性问题和解决方案

### 1. 环境变量访问

**原始代码（仅Node.js）:**
```typescript
const port = process.env.PORT || '3000'
const dbUrl = process.env.DATABASE_URL
```

**兼容代码:**
```typescript
import { env } from './utils/runtime-compat.js'

const port = env.get('PORT', '3000')
const dbUrl = env.get('DATABASE_URL')
```

### 2. 文件操作

**原始代码（仅Node.js）:**
```typescript
import fs from 'fs/promises'

const content = await fs.readFile('./config.json', 'utf-8')
await fs.writeFile('./output.txt', data)
```

**兼容代码:**
```typescript
import { fs } from './utils/runtime-compat.js'

const content = await fs.readTextFile('./config.json')
await fs.writeFile('./output.txt', data)
```

### 3. 进程信息

**原始代码（仅Node.js）:**
```typescript
console.log('PID:', process.pid)
console.log('CWD:', process.cwd())
console.log('Args:', process.argv)
```

**兼容代码:**
```typescript
import { proc } from './utils/runtime-compat.js'

console.log('PID:', proc.pid)
console.log('CWD:', proc.cwd())
console.log('Args:', proc.argv())
```

### 4. HTTP请求

**原始代码（需要polyfill）:**
```typescript
// Node.js 18+ 或需要node-fetch
const response = await fetch(url)
```

**兼容代码:**
```typescript
import { http } from './utils/runtime-compat.js'

const response = await http.fetch(url)
```

### 5. 加密操作

**原始代码（仅Node.js）:**
```typescript
import crypto from 'crypto'

const hash = crypto.createHash('sha256').update(data).digest('hex')
const randomBytes = crypto.randomBytes(16)
```

**兼容代码:**
```typescript
import { crypto } from './utils/runtime-compat.js'

const hash = await crypto.hash('sha256', data)
const randomBytes = await crypto.randomBytes(16)
```

### 6. 性能测量

**原始代码（仅Node.js）:**
```typescript
const start = process.hrtime()
// ... 一些操作
const [seconds, nanoseconds] = process.hrtime(start)
const milliseconds = seconds * 1000 + nanoseconds / 1000000
```

**兼容代码:**
```typescript
import { perf } from './utils/runtime-compat.js'

const start = perf.now()
// ... 一些操作
const elapsed = perf.now() - start
```

## 运行时检测模式

### 基础检测

```typescript
import { runtime } from './utils/runtime-compat.js'

if (runtime.isBun) {
    // Bun特有优化
    console.log('Using Bun optimizations')
} else if (runtime.isNode) {
    // Node.js兼容模式
    console.log('Using Node.js compatibility')
}
```

### 详细信息

```typescript
import { runtime } from './utils/runtime-compat.js'

console.log(`Runtime: ${runtime.name} ${runtime.version}`)
```

## 实际迁移案例

### 案例1: 文件上传处理

**原始代码:**
```typescript
// upload.ts (仅Node.js)
import fs from 'fs/promises'
import path from 'path'

export async function saveUploadedFile(file: File, uploadDir: string) {
    const filePath = path.join(uploadDir, file.name)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)
    return filePath
}
```

**兼容代码:**
```typescript
// upload.ts (Node.js + Bun)
import { fs, runtime } from './utils/runtime-compat.js'
import path from 'path'

export async function saveUploadedFile(file: File, uploadDir: string) {
    const filePath = path.join(uploadDir, file.name)
    
    if (runtime.isBun) {
        // Bun的优化写法
        await Bun.write(filePath, file)
    } else {
        // 通用兼容写法
        const data = await file.arrayBuffer()
        await fs.writeFile(filePath, data)
    }
    
    return filePath
}
```

### 案例2: 配置管理

**原始代码:**
```typescript
// config.ts (仅Node.js)
class Config {
    constructor() {
        this.port = process.env.PORT || 3000
        this.dbUrl = process.env.DATABASE_URL
        this.isDev = process.env.NODE_ENV === 'development'
    }
}
```

**兼容代码:**
```typescript
// config.ts (Node.js + Bun)
import { env } from './utils/runtime-compat.js'

class Config {
    constructor() {
        this.port = parseInt(env.get('PORT', '3000'))
        this.dbUrl = env.get('DATABASE_URL')
        this.isDev = env.get('NODE_ENV') === 'development'
    }
}
```

### 案例3: 日志系统

**原始代码:**
```typescript
// logger.ts (仅Node.js)
import chalk from 'chalk'

export const logger = {
    info: (msg: string) => console.log(chalk.blue('[INFO]'), msg),
    error: (msg: string) => console.error(chalk.red('[ERROR]'), msg)
}
```

**兼容代码:**
```typescript
// logger.ts (Node.js + Bun)
import { logger } from './utils/runtime-compat.js'

// 直接使用兼容的logger
export { logger }

// 或者扩展自定义功能
export const customLogger = {
    ...logger,
    request: (method: string, url: string) => {
        logger.info(`${method} ${url}`)
    }
}
```

## 最佳实践

### 1. 渐进式迁移

- 从新功能开始使用兼容模式
- 逐步迁移现有关键模块
- 保持向后兼容性

### 2. 性能优化

```typescript
import { runtime, fs } from './utils/runtime-compat.js'

// 利用运行时特性进行优化
async function optimizedFileRead(path: string) {
    if (runtime.isBun) {
        // Bun的优化读取
        return await Bun.file(path).text()
    } else {
        // 标准兼容读取
        return await fs.readTextFile(path)
    }
}
```

### 3. 错误处理

```typescript
import { runtime, logger } from './utils/runtime-compat.js'

try {
    // 尝试使用运行时特有功能
    if (runtime.isBun) {
        // Bun特有逻辑
    } else {
        // Node.js逻辑
    }
} catch (error) {
    logger.error('Runtime-specific operation failed:', error)
    // 降级到基础实现
}
```

### 4. 类型安全

```typescript
// types/runtime.d.ts
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT?: string
            DATABASE_URL?: string
            NODE_ENV?: 'development' | 'production' | 'test'
        }
    }
}

// Bun类型扩展
declare module 'bun' {
    interface Env {
        PORT?: string
        DATABASE_URL?: string
        NODE_ENV?: 'development' | 'production' | 'test'
    }
}
```

## 测试策略

### 1. 多运行时测试

```json
// package.json
{
  "scripts": {
    "test:node": "node --test",
    "test:bun": "bun test",
    "test:all": "npm run test:node && npm run test:bun"
  }
}
```

### 2. 运行时特定测试

```typescript
// test/runtime.test.ts
import { runtime } from '../utils/runtime-compat.js'

describe('Runtime compatibility', () => {
    it('should detect correct runtime', () => {
        expect(runtime.name).toMatch(/^(node|bun)$/)
    })
    
    if (runtime.isBun) {
        it('should use Bun optimizations', () => {
            // Bun特有测试
        })
    }
    
    if (runtime.isNode) {
        it('should use Node.js compatibility', () => {
            // Node.js特有测试
        })
    }
})
```

## 部署注意事项

### 1. Docker配置

```dockerfile
# Dockerfile
FROM node:20-alpine

# 安装Bun（可选）
RUN npm install -g bun

# 设置环境变量来选择运行时
ENV RUNTIME=node
# 或 ENV RUNTIME=bun

# 启动脚本
CMD ["sh", "-c", "if [ \"$RUNTIME\" = \"bun\" ]; then bun start; else npm start; fi"]
```

### 2. CI/CD配置

```yaml
# .github/workflows/test.yml
name: Test Multiple Runtimes
on: [push, pull_request]

jobs:
  test-node:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm test

  test-bun:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun test
```

## 总结

通过使用`runtime-compat`工具模块，你可以：

1. ✅ 编写同时兼容Node.js和Bun的代码
2. ✅ 利用各运行时的性能优势
3. ✅ 保持代码的可维护性和可读性
4. ✅ 渐进式迁移现有项目
5. ✅ 提供统一的开发体验

记住：兼容性代码的目标是让你的应用在不同运行时环境下都能正常工作，同时在可能的情况下利用特定运行时的优势。
