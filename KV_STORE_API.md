# 通用KV存储API说明

## 概述

项目已重构为使用通用的KV存储方式，使用MySQL作为后端存储，通过一个统一的表结构来管理所有类型的数据。

## 数据库表结构

### kv_store 表
```sql
CREATE TABLE kv_store (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,           -- 数据类型，如 'user', 'httprequest'
    name VARCHAR(255) NOT NULL,          -- 数据名称，客户端自定义
    json_data JSON NOT NULL,             -- 实际数据，JSON格式
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_type_name (type, name),
    INDEX idx_type (type),
    INDEX idx_name (name)
);
```

## API接口

### 基础URL
```
POST /api/mysql
```

### 请求格式
```json
{
    "operation": "操作类型",
    "type": "数据类型",
    "name": "数据名称",
    "data": "数据内容",
    "query": "查询参数"
}
```

## 支持的操作

### 1. find - 查询指定类型的所有记录
```json
{
    "operation": "find",
    "type": "httprequest"
}
```

**响应:**
```json
{
    "message": "查询成功",
    "data": [
        {
            "id": 1,
            "type": "httprequest",
            "name": "测试请求",
            "json_data": {
                "description": "这是一个测试请求",
                "data": {"method": "GET", "url": "https://api.example.com"},
                "username": "root"
            },
            "created_at": "2024-01-01T00:00:00.000Z",
            "updated_at": "2024-01-01T00:00:00.000Z"
        }
    ],
    "count": 1,
    "type": "success"
}
```

### 2. findOne - 查询单个记录
```json
{
    "operation": "findOne",
    "type": "httprequest",
    "name": "测试请求"
}
```

### 3. insertOne - 插入新记录
```json
{
    "operation": "insertOne",
    "type": "httprequest",
    "name": "新请求",
    "data": {
        "description": "新请求描述",
        "data": {"method": "POST", "url": "https://api.example.com"},
        "username": "root"
    }
}
```

### 4. updateOne - 更新记录
```json
{
    "operation": "updateOne",
    "type": "httprequest",
    "name": "测试请求",
    "data": {
        "description": "更新后的描述",
        "data": {"method": "PUT", "url": "https://api.example.com"},
        "username": "root"
    }
}
```

### 5. deleteOne - 删除记录
```json
{
    "operation": "deleteOne",
    "type": "httprequest",
    "name": "测试请求"
}
```

### 6. count - 统计记录数量
```json
{
    "operation": "count",
    "type": "httprequest"
}
```

### 7. search - 搜索记录
```json
{
    "operation": "search",
    "type": "httprequest",
    "query": {
        "keyword": "测试"
    }
}
```

### 8. getTypes - 获取所有数据类型
```json
{
    "operation": "getTypes"
}
```

### 9. findAll - 获取所有记录
```json
{
    "operation": "findAll"
}
```

## 数据类型示例

### 用户数据 (type: 'user')
```json
{
    "type": "user",
    "name": "root",
    "json_data": {
        "username": "root",
        "password": "root"
    }
}
```

### HTTP请求数据 (type: 'httprequest')
```json
{
    "type": "httprequest",
    "name": "用户登录请求",
    "json_data": {
        "description": "用户登录API请求",
        "data": {
            "method": "POST",
            "url": "https://api.example.com/login",
            "headers": [{"key": "Content-Type", "value": "application/json"}],
            "body": {"username": "test", "password": "test"}
        },
        "response": {
            "status": 200,
            "data": {"token": "abc123"}
        },
        "username": "root"
    }
}
```

### 自定义数据类型
您可以定义任何类型的数据，例如：

```json
{
    "type": "config",
    "name": "app_settings",
    "json_data": {
        "theme": "dark",
        "language": "zh-CN",
        "notifications": true
    }
}
```

## 环境配置

### 默认配置
```bash
MYSQL_HOST=114.55.118.115
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=dtdyq
MYSQL_DATABASE=magicbook
```

### Docker配置
```yaml
environment:
  - MYSQL_HOST=114.55.118.115
  - MYSQL_PORT=3306
  - MYSQL_USER=root
  - MYSQL_PASSWORD=dtdyq
  - MYSQL_DATABASE=magicbook
```

## 优势

1. **通用性**: 一个表结构支持所有类型的数据
2. **灵活性**: 可以存储任意JSON结构的数据
3. **扩展性**: 新增数据类型无需修改表结构
4. **性能**: 通过索引优化查询性能
5. **一致性**: 统一的数据操作接口

## 使用示例

### 前端JavaScript调用
```javascript
// 保存HTTP请求
const response = await fetch('/api/mysql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        operation: 'insertOne',
        type: 'httprequest',
        name: '测试请求',
        data: {
            description: '这是一个测试请求',
            data: { method: 'GET', url: 'https://api.example.com' },
            username: 'root'
        }
    })
});

// 查询HTTP请求
const response = await fetch('/api/mysql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        operation: 'find',
        type: 'httprequest'
    })
});
```

## 测试

运行测试脚本验证功能：
```bash
bun run backend/test-mysql-connection.ts
```
