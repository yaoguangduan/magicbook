#!/usr/bin/env bun

import mongoose from 'mongoose';

async function testMongoAuth() {
    console.log('🧪 测试 MongoDB 认证...');
    
    const testUrls = [
        'mongodb://dtd:dtdyq@114.55.118.115:27017/magicbook',
        'mongodb://dtd:dtdyq@114.55.118.115:27017/magicbook?authSource=admin',
        'mongodb://dtd:dtdyq@114.55.118.115:27017/magicbook?authSource=magicbook',
        'mongodb://dtd:dtdyq@114.55.118.115:27017/admin',
        'mongodb://dtd:dtdyq@114.55.118.115:27017/',
    ];
    
    for (const url of testUrls) {
        console.log(`\n🔄 测试连接: ${url}`);
        
        try {
            await mongoose.connect(url, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 5000,
            });
            
            console.log('✅ 连接成功!');
            
            // 测试基本操作
            const db = mongoose.connection.db;
            const collections = await db.listCollections().toArray();
            console.log('📋 数据库集合:', collections.map(c => c.name));
            
            await mongoose.disconnect();
            console.log('✅ 连接已关闭');
            
        } catch (error) {
            console.log('❌ 连接失败:', error.message);
        }
    }
}

testMongoAuth().then(() => {
    console.log('\n🏁 测试完成');
    process.exit(0);
}).catch((error) => {
    console.error('💥 测试失败:', error);
    process.exit(1);
});
