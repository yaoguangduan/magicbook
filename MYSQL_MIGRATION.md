# MySQL 迁移说明

## 概述

项目已从 MongoDB 迁移到 MySQL，使用 Bun 的 SQL 支持 API。

## 主要变更

### 1. 数据库连接
- **之前**: MongoDB 连接
- **现在**: MySQL 连接池

### 2. 数据模型
- **之前**: Mongoose Schema
- **现在**: TypeScript 类 + MySQL 查询

### 3. API 端点
- **之前**: `/api/mongo`
- **现在**: `/api/mysql`

### 4. 数据结构
- **之前**: MongoDB 文档
- **现在**: MySQL 表 + JSON 字段

## 环境配置

### 环境变量
```bash
# MySQL 配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=magicbook
MYSQL_PASSWORD=magicbook
MYSQL_DATABASE=magicbook
MYSQL_CONNECTION_LIMIT=10
```

### Docker 部署
```bash
# 启动 MySQL 和应用
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 数据库表结构

### users 表
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### http_requests 表
```sql
CREATE TABLE http_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data JSON NOT NULL,
    response JSON,
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API 使用示例

### 保存 HTTP 请求
```javascript
const response = await fetch('/api/mysql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        operation: 'insertOne',
        collection: 'http_requests',
        data: {
            name: '测试请求',
            description: '这是一个测试请求',
            data: { method: 'GET', url: 'https://api.example.com' },
            username: 'root'
        }
    })
});
```

### 查询 HTTP 请求
```javascript
const response = await fetch('/api/mysql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        operation: 'find',
        collection: 'http_requests',
        query: { username: 'root' }
    })
});
```

## 测试

### 运行测试脚本
```bash
# 测试 MySQL 连接
bun run backend/test-mysql-connection.ts
```

### 手动测试
1. 启动应用: `bun run dev:backend`
2. 访问: `http://localhost:3000`
3. 使用默认账号登录: `root/root`
4. 测试 HTTP 工具功能

## 性能优势

1. **更好的事务支持**: MySQL 提供完整的 ACID 特性
2. **更低的资源消耗**: 相比 MongoDB 更节省内存和存储
3. **更成熟的生态系统**: 丰富的工具和社区支持
4. **更好的查询性能**: 复杂查询性能更优
5. **数据一致性**: 强一致性保证

## 注意事项

1. 确保 MySQL 服务正在运行
2. 检查环境变量配置
3. 数据库表会自动创建
4. 默认用户 `root/root` 会自动创建
5. JSON 字段支持 MySQL 5.7+ 或 8.0+

## 故障排除

### 连接失败
```bash
# 检查 MySQL 服务状态
docker-compose ps

# 查看 MySQL 日志
docker-compose logs mysql

# 测试连接
mysql -h localhost -u magicbook -p magicbook
```

### 权限问题
```bash
# 确保用户有足够权限
GRANT ALL PRIVILEGES ON magicbook.* TO 'magicbook'@'%';
FLUSH PRIVILEGES;
```
