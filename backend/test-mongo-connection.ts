#!/usr/bin/env bun

import {init} from './env';
import {getMongoDB} from './database/database';
import {HttpRequest, User} from './database/modules';

async function testMongoConnection() {
    console.log('🧪 开始测试 MongoDB 连接...');

    // 初始化配置
    init();

    console.log('📋 当前配置:');
    console.log('  MongoDB URL:', config.mongo.url);
    console.log('  环境:', config.env);

    try {
        console.log('\n🔄 尝试连接 MongoDB...');
        const mongo = await getMongoDB();
        console.log('✅ MongoDB 连接成功!');

        // 测试用户查询
        console.log('\n🧪 测试用户查询...');
        const users = await User.find().exec();
        console.log('✅ 用户查询成功，用户数量:', users.length);

        // 测试创建 HTTP 请求记录
        console.log('\n🧪 测试创建 HTTP 请求记录...');
        const testRequest = await HttpRequest.create({
            name: 'test:http:request',
            description: '测试请求',
            data: {
                method: 'GET',
                url: 'https://example.com',
                headers: [],
                queryParams: [],
                bodyType: 'none',
                body: null,
                settings: {}
            },
            username: 'test'
        });
        console.log('✅ 创建 HTTP 请求记录成功:', testRequest._id);

        // 测试查询
        const foundRequest = await HttpRequest.findOne({name: 'test:http:request'}).exec();
        console.log('✅ 查询 HTTP 请求记录成功:', foundRequest?.name);

        // 清理测试数据
        await HttpRequest.deleteOne({_id: testRequest._id});
        console.log('✅ 清理测试数据完成');

    } catch (error) {
        console.error('❌ MongoDB 连接失败:');
        console.error('  错误类型:', error.constructor.name);
        console.error('  错误信息:', error.message);
        console.error('  完整错误:', error);

        // 提供解决建议
        console.log('\n💡 可能的解决方案:');
        console.log('  1. 检查 MongoDB 服务是否运行');
        console.log('  2. 检查网络连接');
        console.log('  3. 验证 MongoDB URL 格式');
        console.log('  4. 检查认证信息');
        console.log('  5. 尝试使用本地 MongoDB: mongodb://localhost:27017/magicbook');
    }
}

// 运行测试
testMongoConnection().then(() => {
    console.log('\n🏁 测试完成');
    process.exit(0);
}).catch((error) => {
    console.error('💥 测试过程中发生错误:', error);
    process.exit(1);
});
