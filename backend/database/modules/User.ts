import {getMySQL} from '../mysql';

// 辅助函数：过滤Bun SQL返回结果中的元数据
function filterBunSQLResult<T>(result: any[]): T[] {
    return result.filter(row => typeof row === 'object' && row.id !== undefined);
}

export interface User {
    id: number;
    username: string;
    password: string;
    created_at: Date;
    updated_at: Date;
}

export interface CreateUserData {
    username: string;
    password: string;
}

// 根据用户名查找用户
export const findByUsername = async (username: string): Promise<User | null> => {
    const db = await getMySQL();
    const result = await db`
        SELECT * FROM users WHERE username = ${username}
    `;
    const rows = filterBunSQLResult<User>(result);
    return rows.length > 0 ? rows[0] : null;
};

// 根据ID查找用户
export const findById = async (id: number): Promise<User | null> => {
    const db = await getMySQL();
    const result = await db`
        SELECT * FROM users WHERE id = ${id}
    `;
    const rows = filterBunSQLResult<User>(result);
    return rows.length > 0 ? rows[0] : null;
};

// 创建用户
export const create = async (userData: CreateUserData): Promise<User> => {
    const db = await getMySQL();
    await db`
        INSERT INTO users (username, password) VALUES (${userData.username}, ${userData.password})
    `;
    return findByUsername(userData.username);
};

// 更新用户密码
export const updatePassword = async (username: string, newPassword: string): Promise<User | null> => {
    const db = await getMySQL();
    await db`
        UPDATE users SET password = ${newPassword} WHERE username = ${username}
    `;
    return findByUsername(username);
};

// 删除用户
export const deleteUser = async (username: string): Promise<boolean> => {
    const db = await getMySQL();
    const result = await db`
        DELETE FROM users WHERE username = ${username}
    `;
    const deleteResult = result as any;
    return deleteResult.affectedRows > 0;
};

// 获取所有用户
export const findAll = async (): Promise<User[]> => {
    const db = await getMySQL();
    const result = await db`
        SELECT * FROM users ORDER BY created_at DESC
    `;
    return filterBunSQLResult<User>(result);
};

// 验证用户密码
export const verifyPassword = async (username: string, password: string): Promise<boolean> => {
    const user = await findByUsername(username);
    return user ? user.password === password : false;
};

// 根据用户名获取用户ID
export const getUserIdByUsername = async (username: string): Promise<number | null> => {
    const user = await findByUsername(username);
    return user ? user.id : null;
};

// 默认导出所有函数
export default {
    findByUsername,
    findById,
    create,
    updatePassword,
    delete: deleteUser,
    findAll,
    verifyPassword,
    getUserIdByUsername
};
