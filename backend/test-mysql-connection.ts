import {init} from "./env";
import {closeMySQL, getMySQL} from "./database/database";
import KVStoreModel from "./database/modules/KVStore";

init();

async function testBunSQLConnection() {
    try {
        console.log('🔄 测试Bun SQL连接...');

        // 测试连接
        const db = await getMySQL();
        console.log('✅ Bun SQL连接成功');

        // 测试原生SQL查询
        console.log('🔄 测试原生SQL查询...');
        const testResult = await db`SELECT 1 as test`;
        console.log('✅ 原生SQL查询成功:', testResult[0]);

        // 测试用户查询
        console.log('🔄 测试用户查询...');
        const users = await KVStoreModel.findByType('user');
        console.log('✅ 用户查询成功，找到用户数量:', users.length);

        // 测试创建用户
        console.log('🔄 测试创建用户...');
        const testUserName = 'test_user_' + Date.now();
        const testUser = await KVStoreModel.create({
            type: 'user',
            name: testUserName,
            json_data: {username: testUserName, password: 'test_password'}
        });
        console.log('✅ 用户创建成功，ID:', testUser.id);

        // 测试查找用户
        console.log('🔄 测试查找用户...');
        const foundUser = await KVStoreModel.findByTypeAndName('user', testUserName);
        if (foundUser) {
            console.log('✅ 用户查找成功:', foundUser.json_data.username);
        } else {
            console.log('❌ 用户查找失败');
        }

        // 测试HTTP请求存储
        console.log('🔄 测试HTTP请求存储...');
        const testRequest = await KVStoreModel.create({
            type: 'httprequest',
            name: 'test_request_' + Date.now(),
            json_data: {
                description: '测试请求',
                data: {method: 'GET', url: 'https://api.example.com'},
                username: 'test_user'
            }
        });
        console.log('✅ HTTP请求创建成功，ID:', testRequest.id);

        // 测试事务
        console.log('🔄 测试事务...');
        await db.begin(async (tx) => {
            await tx`INSERT INTO kv_store (type, name, json_data)
                     VALUES (${'test'}, ${'transaction_test'}, ${JSON.stringify({test: 'data'})})`;
            await tx`UPDATE kv_store
                     SET json_data = ${JSON.stringify({test: 'updated'})}
                     WHERE type = ${'test'}
                       AND name = ${'transaction_test'}`;
        });
        console.log('✅ 事务测试成功');

        // 清理测试数据
        console.log('🔄 清理测试数据...');
        await KVStoreModel.delete('user', testUserName);
        await KVStoreModel.delete('httprequest', testRequest.name);
        await KVStoreModel.delete('test', 'transaction_test');
        console.log('✅ 测试数据已删除');

        console.log('🎉 所有Bun SQL测试通过！');

    } catch (error) {
        console.error('❌ 测试失败:', error);
    } finally {
        await closeMySQL();
        console.log('✅ Bun SQL连接已关闭');
    }
}

testBunSQLConnection();
