import { getMySQL } from '../mysql';

// 辅助函数：过滤Bun SQL返回结果中的元数据
function filterBunSQLResult<T>(result: any[]): T[] {
    return result.filter(row => typeof row === 'object' && row.id !== undefined);
}

export interface KVRecord {
    id: number;
    type: string;
    name: string;
    user_id: number;
    json_data: any;
    created_at: Date;
    updated_at: Date;
}

export interface CreateKVData {
    type: string;
    name: string;
    user_id: number;
    json_data: any;
}

export interface UpdateKVData {
    json_data?: any;
}

// 根据类型、名称和用户ID查找记录
export const findByTypeAndName = async (type: string, name: string, user_id: number): Promise<KVRecord | null> => {
    const db = await getMySQL();
    const result = await db`
        SELECT * FROM kv_store WHERE type = ${type} AND name = ${name} AND user_id = ${user_id}
    `;
    const rows = filterBunSQLResult<KVRecord>(result);
    return rows.length > 0 ? rows[0] : null;
};

// 根据ID查找记录
export const findById = async (id: number): Promise<KVRecord | null> => {
    const db = await getMySQL();
    const result = await db`
        SELECT * FROM kv_store WHERE id = ${id}
    `;
    const rows = filterBunSQLResult<KVRecord>(result);
    return rows.length > 0 ? rows[0] : null;
};

// 根据类型和用户ID查找所有记录
export const findByType = async (type: string, user_id: number): Promise<KVRecord[]> => {
    const db = await getMySQL();
    const result = await db`
        SELECT * FROM kv_store WHERE type = ${type} AND user_id = ${user_id} ORDER BY updated_at DESC
    `;
    return filterBunSQLResult<KVRecord>(result);
};

// 创建记录
export const create = async (kvData: CreateKVData): Promise<KVRecord> => {
    const db = await getMySQL();
    await db`
        INSERT INTO kv_store (type, name, user_id, json_data) VALUES (${kvData.type}, ${kvData.name}, ${kvData.user_id}, ${JSON.stringify(kvData.json_data)})
    `;
    return findByTypeAndName(kvData.type, kvData.name, kvData.user_id);
};

// 保存记录（upsert - 存在则更新，不存在则创建）
export const save = async (kvData: CreateKVData): Promise<KVRecord> => {
    const db = await getMySQL();
    
    // 使用MySQL的INSERT ... ON DUPLICATE KEY UPDATE语法实现原子性upsert
    await db`
        INSERT INTO kv_store (type, name, user_id, json_data) 
        VALUES (${kvData.type}, ${kvData.name}, ${kvData.user_id}, ${JSON.stringify(kvData.json_data)})
        ON DUPLICATE KEY UPDATE 
        json_data = VALUES(json_data),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    return findByTypeAndName(kvData.type, kvData.name, kvData.user_id);
};

// 更新记录
export const update = async (type: string, name: string, user_id: number, updateData: any): Promise<KVRecord | null> => {
    const db = await getMySQL();
    await db`
        UPDATE kv_store SET json_data = ${JSON.stringify(updateData.json_data)} WHERE type = ${type} AND name = ${name} AND user_id = ${user_id}
    `;
    return findByTypeAndName(type, name, user_id);
};

// 根据ID更新记录
export const updateById = async (id: number, updateData: any): Promise<KVRecord | null> => {
    const db = await getMySQL();
    await db`
        UPDATE kv_store SET json_data = ${JSON.stringify(updateData.json_data)} WHERE id = ${id}
    `;
    return findById(id);
};

// 删除记录
export const deleteRecord = async (type: string, name: string, user_id: number): Promise<boolean> => {
    const db = await getMySQL();
    const result = await db`
        DELETE FROM kv_store WHERE type = ${type} AND name = ${name} AND user_id = ${user_id}
    `;
    const deleteResult = result as any;
    return deleteResult.affectedRows > 0;
};

// 根据ID删除记录
export const deleteById = async (id: number): Promise<boolean> => {
    const db = await getMySQL();
    const result = await db`
        DELETE FROM kv_store WHERE id = ${id}
    `;
    const deleteResult = result as any;
    return deleteResult.affectedRows > 0;
};

// 获取所有记录
export const findAll = async (): Promise<KVRecord[]> => {
    const db = await getMySQL();
    const result = await db`
        SELECT * FROM kv_store ORDER BY updated_at DESC
    `;
    return filterBunSQLResult<KVRecord>(result);
};

// 搜索记录（只搜索name字段）
export const search = async (type: string, user_id: number, keyword: string): Promise<KVRecord[]> => {
    const db = await getMySQL();
    const result = await db`
        SELECT * FROM kv_store 
        WHERE type = ${type} 
        AND user_id = ${user_id}
        AND name LIKE ${`%${keyword}%`}
        ORDER BY updated_at DESC
    `;
    return filterBunSQLResult<KVRecord>(result);
};

// 搜索JSON数据
export const searchJson = async (type: string, user_id: number, keyword: string): Promise<KVRecord[]> => {
    const db = await getMySQL();
    const result = await db`
        SELECT * FROM kv_store 
        WHERE type = ${type} 
        AND user_id = ${user_id}
        AND JSON_SEARCH(json_data, 'one', ${`%${keyword}%`}) IS NOT NULL
        ORDER BY updated_at DESC
    `;
    return filterBunSQLResult<KVRecord>(result);
};

// 统计记录数量
export const count = async (type?: string, user_id?: number): Promise<number> => {
    const db = await getMySQL();
    let result;
    if (type && user_id) {
        result = await db`
            SELECT COUNT(*) as count FROM kv_store WHERE type = ${type} AND user_id = ${user_id}
        `;
    } else if (type) {
        result = await db`
            SELECT COUNT(*) as count FROM kv_store WHERE type = ${type}
        `;
    } else if (user_id) {
        result = await db`
            SELECT COUNT(*) as count FROM kv_store WHERE user_id = ${user_id}
        `;
    } else {
        result = await db`
            SELECT COUNT(*) as count FROM kv_store
        `;
    }
    const rows = filterBunSQLResult<{count: number}>(result);
    return rows[0]?.count || 0;
};

// 获取所有类型
export const getTypes = async (user_id?: number): Promise<string[]> => {
    const db = await getMySQL();
    let result;
    if (user_id) {
        result = await db`
            SELECT DISTINCT type FROM kv_store WHERE user_id = ${user_id} ORDER BY type
        `;
    } else {
        result = await db`
            SELECT DISTINCT type FROM kv_store ORDER BY type
        `;
    }
    const rows = filterBunSQLResult<{type: string}>(result);
    return rows.map(row => row.type);
};

// 默认导出所有函数
export default {
    findByTypeAndName,
    findById,
    findByType,
    create,
    save,
    update,
    updateById,
    delete: deleteRecord,
    deleteById,
    findAll,
    search,
    searchJson,
    count,
    getTypes
};