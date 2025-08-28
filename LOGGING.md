# 📝 Pino日志系统使用指南

## 🎯 特性

- ✅ **高性能**：使用Pino，比传统日志库快5-10倍
- ✅ **文件分离**：Master和Worker独立日志文件
- ✅ **文件轮转**：按大小(100MB)和日期自动轮转
- ✅ **RequestID追踪**：从Master传递到Worker，完整链路追踪
- ✅ **结构化日志**：JSON格式，便于分析和监控
- ✅ **环境自适应**：开发环境彩色输出，生产环境文件输出
- ✅ **Bun兼容**：修复了pino-http在Bun环境中的兼容性问题

## 📁 日志文件格式

### Master日志
```
logs/master-2024-08-28.log
logs/master-2024-08-28.log.1
logs/master-2024-08-29.log
```

### Worker日志
```
logs/worker-12345-2024-08-28.log
logs/worker-12346-2024-08-28.log
logs/worker-12345-2024-08-28.log.1
```

## 🚀 使用方法

### 基本日志记录

```typescript
import logger from './common/logger'

// 全局日志
logger.info('服务启动', { port: 3000 })
logger.warn('内存使用率高', { usage: '85%' })
logger.error('数据库连接失败', { error: err.message })

// Worker管理日志
logger.workerRegister('http://localhost:3001')
logger.workerDown('http://localhost:3001')
```

### 请求级别日志（带RequestID）

```typescript
app.get('/api/test', (c) => {
    // 获取请求级别的logger（自动包含requestId）
    const reqLogger = c.get('logger')
    const requestId = c.get('requestId')
    
    reqLogger.info('处理用户请求', { 
        userId: 123,
        action: 'test'
    })
    
    return c.json({ requestId })
})
```

### RequestID链路追踪

```
Master请求: POST /api/upload (requestId: abc123)
   ↓ 代理到Worker
Worker处理: POST /api/upload (requestId: abc123)  # 同一个ID
```

## 🔧 配置

### 环境变量
```bash
# 基础配置
NODE_ENV=production          # 环境模式
LOG_LEVEL=info              # 日志级别
LOG_DIR=./logs              # 日志目录

# 启动服务
NODE_ENV=production bun backend/server.ts --mode master --workers 2
```

### 开发环境
```bash
# 彩色控制台输出
bun backend/server.ts --mode master --workers 2
```

### 生产环境
```bash
# 文件输出 + 轮转
NODE_ENV=production LOG_DIR=/var/log/magicbook bun backend/server.ts
```

## 📊 日志格式

### 开发环境（彩色控制台）
```
[2025-08-28 01:43:39] INFO (magicbook): [MASTER] 🚀 Server started at http://localhost:3000
    mode: "master"
    server: {
      "host": "localhost", 
      "port": 3000,
      "url": "http://localhost:3000"
    }
```

### 生产环境（JSON文件）
```json
{
  "level": 30,
  "time": "2025-08-28T01:43:39.719Z",
  "pid": 12345,
  "mode": "master",
  "name": "magicbook",
  "req": {
    "id": "req-abc123",
    "method": "POST",
    "url": "/api/upload"
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 150,
  "msg": "POST /api/upload 200"
}
```

## 🔍 RequestID工作原理

### 1. Master生成RequestID
```typescript
// Master收到请求时自动生成
app.use(requestId())  // 生成: req-abc123
```

### 2. 代理传递RequestID
```typescript
// Master代理到Worker时传递
headers['x-request-id'] = requestIdValue
```

### 3. Worker接收RequestID
```typescript
// Worker优先使用Master传来的ID
const masterRequestId = c.req.header('x-request-id')
if (masterRequestId) {
    c.set('requestId', masterRequestId)
}
```

## 📈 监控和分析

### 查看实时日志
```bash
# 所有进程日志
tail -f logs/*.log

# 只看Master日志
tail -f logs/master-*.log

# 只看某个Worker日志
tail -f logs/worker-12345-*.log

# 根据RequestID追踪请求
grep "req-abc123" logs/*.log
```

### 日志分析
```bash
# 统计错误数量
grep '"level":50' logs/*.log | wc -l

# 统计API请求
grep '"method":"POST"' logs/*.log | wc -l

# 分析响应时间
grep '"responseTime"' logs/*.log | jq '.responseTime' | sort -n
```

### ELK集成
```bash
# 发送到Elasticsearch
filebeat -c filebeat.yml
```

## 🛠 故障排查

### 已修复的问题

**✅ pino-http兼容性问题**
```
错误: res.on is not a function
解决: 移除pino-http，改用直接的pino日志记录
影响: Bun环境中的HTTP日志记录
状态: 已修复 ✅
```

### 常见问题

**Q: 日志文件权限问题**
```bash
chmod 755 logs/
chown -R app:app logs/
```

**Q: RequestID不一致**
```bash
# 检查代理中间件是否正确传递x-request-id
curl -H "x-request-id: test123" http://localhost:3000/api/test
```

**Q: 日志轮转不工作**
```bash
# 检查pino-roll配置
NODE_ENV=production LOG_LEVEL=debug bun backend/server.ts
```

**Q: Worker注册失败**
```bash
# 如果看到"res.on is not a function"错误
# 确保使用最新版本的代码，该问题已修复
bun install  # 重新安装依赖
```

## 📚 最佳实践

1. **结构化信息**：使用对象传递上下文信息
   ```typescript
   logger.info('用户登录成功', { userId, loginTime, ip })
   ```

2. **错误记录**：包含完整错误信息
   ```typescript
   logger.error('处理失败', { error: err.message, stack: err.stack })
   ```

3. **性能监控**：记录关键操作耗时
   ```typescript
   reqLogger.info('数据库查询完成', { duration: 150, rowCount: 100 })
   ```

4. **RequestID追踪**：在关键节点记录requestId
   ```typescript
   logger.info('开始处理', { requestId, userId, action })
   ```

## 🎯 性能优势

- **异步写入**：不阻塞主线程
- **二进制序列化**：更高效的JSON处理
- **文件轮转**：避免单文件过大
- **结构化查询**：便于监控系统分析
