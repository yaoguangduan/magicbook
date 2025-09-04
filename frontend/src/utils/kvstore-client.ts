import {httpClient} from './http-client';

// KVStore 记录接口（前端简化版）
export interface KVRecord {
    id: number;
    type: string;
    name: string;
    data: any;
    created_at: string;
    updated_at: string;
}

// 创建数据接口
export interface CreateKVData {
    type: string;
    name: string;
    data: any;
}

// 更新数据接口
export interface UpdateKVData {
    type: string;
    name: string;
    data: any;
}

// 查询参数接口
export interface QueryParams {
    keyword?: string;
}

// API响应接口
export interface KVStoreResponse<T = any> {
    message: string;
    data: T;
    count?: number;
    type: 'success' | 'error';
}

/**
 * KVStore 客户端类
 * 封装所有KV存储相关的API调用
 */
export class KVStoreClient {
    /**
     * 查找指定类型的所有记录
     */
    static async findByType(type: string): Promise<KVRecord[]> {
        const response = await httpClient('/api/mysql', {
            method: 'POST',
            body: JSON.stringify({
                operation: 'find',
                type: type
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '查询失败');
        }

        const result: KVStoreResponse<any[]> = await response.json();
        // 将后端的json_data转换为前端的data
        return result.data.map(record => ({
            id: record.id,
            type: record.type,
            name: record.name,
            data: record.json_data,
            created_at: record.created_at,
            updated_at: record.updated_at
        }));
    }

    /**
     * 查找单个记录
     */
    static async findOne(type: string, name: string): Promise<KVRecord | null> {
        const response = await httpClient('/api/mysql', {
            method: 'POST',
            body: JSON.stringify({
                operation: 'findOne',
                type: type,
                name: name
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '查询失败');
        }

        const result: KVStoreResponse<any> = await response.json();
        if (!result.data) return null;

        // 将后端的json_data转换为前端的data
        return {
            id: result.data.id,
            type: result.data.type,
            name: result.data.name,
            data: result.data.json_data,
            created_at: result.data.created_at,
            updated_at: result.data.updated_at
        };
    }

    /**
     * 保存记录（upsert - 存在则更新，不存在则创建）
     */
    static async save(type: string, name: string, data: any): Promise<KVRecord> {
        const response = await httpClient('/api/mysql', {
            method: 'POST',
            body: JSON.stringify({
                operation: 'save',
                type: type,
                name: name,
                data: data
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '保存失败');
        }

        const result: KVStoreResponse<any> = await response.json();

        // 将后端的json_data转换为前端的data
        return {
            id: result.data.id,
            type: result.data.type,
            name: result.data.name,
            data: result.data.json_data,
            created_at: result.data.created_at,
            updated_at: result.data.updated_at
        };
    }


    /**
     * 删除记录
     */
    static async delete(type: string, name: string): Promise<boolean> {
        const response = await httpClient('/api/mysql', {
            method: 'POST',
            body: JSON.stringify({
                operation: 'deleteOne',
                type: type,
                name: name
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '删除失败');
        }

        const result: KVStoreResponse<{ deletedCount: number }> = await response.json();
        return result.data.deletedCount > 0;
    }

    /**
     * 搜索记录（按name字段）
     */
    static async search(type: string, keyword: string): Promise<KVRecord[]> {
        const response = await httpClient('/api/mysql', {
            method: 'POST',
            body: JSON.stringify({
                operation: 'search',
                type: type,
                query: {keyword}
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '搜索失败');
        }

        const result: KVStoreResponse<any[]> = await response.json();
        // 将后端的json_data转换为前端的data
        return result.data.map(record => ({
            id: record.id,
            type: record.type,
            name: record.name,
            data: record.json_data,
            created_at: record.created_at,
            updated_at: record.updated_at
        }));
    }

    /**
     * 搜索JSON数据
     */
    static async searchJson(type: string, keyword: string): Promise<KVRecord[]> {
        const response = await httpClient('/api/mysql', {
            method: 'POST',
            body: JSON.stringify({
                operation: 'searchJson',
                type: type,
                query: {keyword}
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'JSON搜索失败');
        }

        const result: KVStoreResponse<any[]> = await response.json();
        // 将后端的json_data转换为前端的data
        return result.data.map(record => ({
            id: record.id,
            type: record.type,
            name: record.name,
            data: record.json_data,
            created_at: record.created_at,
            updated_at: record.updated_at
        }));
    }

    /**
     * 统计记录数量
     */
    static async count(type?: string): Promise<number> {
        const response = await httpClient('/api/mysql', {
            method: 'POST',
            body: JSON.stringify({
                operation: 'count',
                type: type
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '统计失败');
        }

        const result: KVStoreResponse<{ count: number }> = await response.json();
        return result.data.count;
    }

    /**
     * 获取所有类型
     */
    static async getTypes(): Promise<string[]> {
        const response = await httpClient('/api/mysql', {
            method: 'POST',
            body: JSON.stringify({
                operation: 'getTypes'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '获取类型失败');
        }

        const result: KVStoreResponse<string[]> = await response.json();
        return result.data;
    }
}

// 导出默认实例
export default KVStoreClient;
