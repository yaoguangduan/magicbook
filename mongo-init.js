// MongoDB 初始化脚本
db = db.getSiblingDB('magicbook');

// 创建用户集合
db.createCollection('users');
db.createCollection('httprequests');

// 创建索引
db.users.createIndex({ "username": 1 }, { unique: true });
db.httprequests.createIndex({ "username": 1, "name": 1 });

// 插入默认用户
db.users.insertOne({
    username: 'root',
    password: 'root',
    createdAt: new Date(),
    updatedAt: new Date()
});

print('✅ MongoDB 初始化完成');
