import mongoose from 'mongoose';
import { userSchema } from '../database/modules';

let mongoConnection: mongoose.Connection | null = null;

async function initMongoDB(mongoUrl: string) {
    if (mongoConnection) {
        return;
    }
    
    try {
        console.log('🔄 正在连接 MongoDB:', mongoUrl);
        
        // 连接 MongoDB
        await mongoose.connect(mongoUrl, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 8000,
            socketTimeoutMS: 8000,
        });
        
        mongoConnection = mongoose.connection;
        
        // 监听连接事件
        mongoConnection.on('connected', () => {
            console.log('✅ MongoDB 连接成功');
        });
        
        mongoConnection.on('error', (error) => {
            console.error('❌ MongoDB 连接错误:', error);
        });
        
        mongoConnection.on('disconnected', () => {
            console.log('⚠️ MongoDB 连接断开');
        });
        
        // 初始化默认用户
        await initDefaultUser();
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        mongoConnection = null;
        throw error;
    }
}

async function initDefaultUser() {
    try {
        const User = mongoose.model('User', userSchema);
        const existingUser = await User.findOne({ username: 'root' });
        
        if (!existingUser) {
            await User.create({
                username: 'root',
                password: 'root',
                createdAt: new Date()
            });
            console.log('✅ 初始化默认用户成功');
        }
    } catch (error) {
        console.error('❌ 初始化默认用户失败:', error);
    }
}

// 获取 MongoDB 连接
export const getMongoDB = async (): Promise<mongoose.Connection> => {
    if (!mongoConnection) {
        try {
            await initMongoDB(config.mongo.url);
        } catch (error) {
            console.error('❌ 无法初始化 MongoDB 连接:', error);
            throw new Error(`MongoDB 连接失败: ${error.message}`);
        }
    }
    
    if (!mongoConnection) {
        throw new Error('MongoDB 连接未初始化');
    }
    
    return mongoConnection;
}

// 获取 Mongoose 实例
export const getMongoose = (): typeof mongoose => {
    return mongoose;
}

// 关闭连接
export const closeMongoDB = async () => {
    if (mongoConnection) {
        await mongoose.disconnect();
        mongoConnection = null;
        console.log('✅ MongoDB 连接已关闭');
    }
}
}
