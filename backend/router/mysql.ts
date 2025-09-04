import {Context} from "hono";
import {getMySQL} from "../database/database";
import KVStoreModel from "../database/modules/KVStore";

// 通用 KV 存储操作函数
export const mysqlOp = async (c: Context) => {
    try {
        const mysql = await getMySQL();
        const requestData = await c.req.json();
        
        if (!requestData || !requestData.operation) {
            return c.json({message: '缺少操作参数', type: 'error'}, 400);
        }
        
        // 从context中获取用户信息（由JWT中间件解析）
        const user = c.get('user');
        if (!user || !user.user_id) {
            return c.json({message: '用户认证信息缺失', type: 'error'}, 401);
        }
        
        const user_id = user.user_id;
        
        const { operation, type, name, data, query } = requestData;
        
        switch (operation) {
            case 'find':
                // 查询指定类型的所有记录
                if (!type || !user_id) {
                    return c.json({message: 'find操作需要type和user_id参数', type: 'error'}, 400);
                }
                const records = await KVStoreModel.findByType(type, user_id);
                return c.json({
                    message: '查询成功', 
                    data: records, 
                    count: records.length,
                    type: 'success'
                });
                
            case 'findOne':
                // 查询单个记录
                if (!type || !name || !user_id) {
                    return c.json({message: 'findOne操作需要type、name和user_id参数', type: 'error'}, 400);
                }
                const record = await KVStoreModel.findByTypeAndName(type, name, user_id);
                return c.json({
                    message: '查询成功', 
                    data: record, 
                    type: 'success'
                });
                
            case 'insertOne':
                // 插入单个记录
                if (!type || !name || !data || !user_id) {
                    return c.json({message: 'insertOne操作需要type、name、data和user_id参数', type: 'error'}, 400);
                }
                const newRecord = await KVStoreModel.create({
                    type,
                    name,
                    user_id,
                    json_data: data
                });
                return c.json({
                    message: '插入成功', 
                    data: { insertedId: newRecord.id }, 
                    type: 'success'
                });
                
            case 'save':
                // 保存记录（upsert - 存在则更新，不存在则创建）
                if (!type || !name || !data || !user_id) {
                    return c.json({message: 'save操作需要type、name、data和user_id参数', type: 'error'}, 400);
                }
                const savedRecord = await KVStoreModel.save({
                    type,
                    name,
                    user_id,
                    json_data: data
                });
                return c.json({
                    message: '保存成功', 
                    data: savedRecord, 
                    type: 'success'
                });
                
            case 'updateOne':
                // 更新单个记录（使用save实现upsert）
                if (!type || !name || !data || !user_id) {
                    return c.json({message: 'updateOne操作需要type、name、data和user_id参数', type: 'error'}, 400);
                }
                
                const updatedRecord = await KVStoreModel.save({
                    type,
                    name,
                    user_id,
                    json_data: data
                });
                
                return c.json({
                    message: '保存成功', 
                    data: updatedRecord, 
                    type: 'success'
                });
                
            case 'deleteOne':
                // 删除单个记录
                if (!type || !name || !user_id) {
                    return c.json({message: 'deleteOne操作需要type、name和user_id参数', type: 'error'}, 400);
                }
                const deleted = await KVStoreModel.delete(type, name, user_id);
                return c.json({
                    message: '删除成功', 
                    data: { deletedCount: deleted ? 1 : 0 }, 
                    type: 'success'
                });
                
            case 'count':
                // 统计记录数量
                const count = await KVStoreModel.count(type, user_id);
                return c.json({
                    message: '统计成功', 
                    data: { count }, 
                    type: 'success'
                });
                
            case 'search':
                // 搜索记录（按name字段）
                if (!type || !query?.keyword || !user_id) {
                    return c.json({message: 'search操作需要type、keyword和user_id参数', type: 'error'}, 400);
                }
                const searchResults = await KVStoreModel.search(type, user_id, query.keyword);
                return c.json({
                    message: '搜索成功', 
                    data: searchResults, 
                    count: searchResults.length,
                    type: 'success'
                });
                
            case 'searchJson':
                // 搜索JSON数据
                if (!type || !query?.keyword || !user_id) {
                    return c.json({message: 'searchJson操作需要type、keyword和user_id参数', type: 'error'}, 400);
                }
                const searchJsonResults = await KVStoreModel.searchJson(type, user_id, query.keyword);
                return c.json({
                    message: 'JSON搜索成功', 
                    data: searchJsonResults, 
                    count: searchJsonResults.length,
                    type: 'success'
                });
                
            case 'getTypes':
                // 获取所有类型
                const types = await KVStoreModel.getTypes(user_id);
                return c.json({
                    message: '获取类型成功', 
                    data: types, 
                    count: types.length,
                    type: 'success'
                });
                
            case 'findAll':
                // 获取所有记录
                const allRecords = await KVStoreModel.findAll();
                return c.json({
                    message: '查询成功', 
                    data: allRecords, 
                    count: allRecords.length,
                    type: 'success'
                });
                
            default:
                return c.json({message: `不支持的操作: ${operation}`, type: 'error'}, 400);
        }
        
    } catch (e) {
        console.error('KV Store operation error:', e);
        return c.json({message: e.message, type: 'error'}, 500);
    }
};
