import {Context} from "hono";

interface HttpRequestSettings {
    timeout?: number;          // 超时时间（毫秒）
    sslVerify?: boolean;       // SSL 证书验证
    followRedirects?: boolean; // 跟随重定向
    maxRedirects?: number;     // 最大重定向次数
    retries?: number;          // 重试次数
    userAgent?: string;        // User-Agent
}

interface HttpRequestBody {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
    settings?: HttpRequestSettings;
}

interface HttpResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    time: number;
    isBinary?: boolean;
    contentType?: string;
}

export const doReq = async (c: Context) => {
    try {
        // 解析请求体
        const requestData: HttpRequestBody = await c.req.json();

        console.log(`[HTTP] 请求体:`, requestData);
        if (!requestData.method || !requestData.url) {
            return c.json({
                success: false,
                message: '缺少必要参数: method 和 url'
            }, 400);
        }

        // 记录开始时间
        const startTime = Date.now();

        // 获取设置选项，使用默认值
        const settings = {
            timeout: 30000,
            sslVerify: true,
            followRedirects: true,
            maxRedirects: 5,
            retries: 0,
            userAgent: 'MagicBook/1.0',
            ...requestData.settings
        };

        // 构建 fetch 选项
        const fetchOptions: RequestInit = {
            method: requestData.method.toUpperCase(),
            headers: {
                'User-Agent': settings.userAgent,
                ...requestData.headers
            },
            // 使用设置中的超时时间
            signal: AbortSignal.timeout(settings.timeout),
            // 重定向处理
            redirect: settings.followRedirects ? 'follow' : 'manual'
        };

        // 处理请求体
        if (requestData.body && !['HEAD'].includes(requestData.method.toUpperCase())) {
            if (typeof requestData.body === 'object' && requestData.body !== null) {
                // 检查 Content-Type 来判断数据格式
                const contentType = requestData.headers?.['Content-Type'] || requestData.headers?.['content-type'] || fetchOptions.headers['Content-Type'];
                
                if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
                    // Form Data 格式 - 转换为 URLSearchParams
                    const formData = new URLSearchParams();
                    for (const [key, value] of Object.entries(requestData.body)) {
                        formData.append(key, String(value));
                    }
                    fetchOptions.body = formData.toString();
                    console.log(`[HTTP] Form data:`, requestData.body);
                } else {
                    // 其他对象类型，前端已经序列化好了，直接传递
                    fetchOptions.body = requestData.body;
                    console.log(`[HTTP] Object data:`, requestData.body);
                }
            } else {
                // 字符串或其他类型，直接传递
                fetchOptions.body = requestData.body;
                console.log(`[HTTP] Raw data:`, requestData.body);
            }
        }

        console.log(`[HTTP] 发送请求: ${requestData.method} ${requestData.url}`);
        console.log(`[HTTP] 请求头:`, fetchOptions.headers);
        console.log(`[HTTP] 请求设置:`, settings);

        // 带重试的请求发送
        let response: Response;
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt <= settings.retries; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`[HTTP] 重试第 ${attempt} 次...`);
                }
                
                response = await fetch(requestData.url, fetchOptions);
                
                // 如果成功，跳出重试循环
                break;
            } catch (error) {
                lastError = error as Error;
                
                // 如果是最后一次尝试，抛出错误
                if (attempt === settings.retries) {
                    throw error;
                }
                
                // 等待一段时间后重试
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // 获取响应头
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        // 获取响应数据
        let responseData: any;
        let isBinary = false;
        const contentType = response.headers.get('content-type') || '';

        try {
            if (contentType.includes('application/json')) {
                responseData = await response.json();
            } else if (contentType.includes('text/') || contentType.includes('application/xml') || contentType.includes('application/javascript')) {
                responseData = await response.text();
            } else {
                // 对于二进制数据，直接返回 ArrayBuffer
                responseData = await response.arrayBuffer();
                isBinary = true;
            }
        } catch (error) {
            // 如果解析失败，尝试获取原始文本
            console.warn('[HTTP] 响应解析失败，获取原始文本:', error);
            responseData = await response.text();
        }

        // 构建响应对象
        const httpResponse: HttpResponse = {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            data: responseData,
            time: responseTime,
            isBinary: isBinary,
            contentType: contentType
        };

        console.log(`[HTTP] 响应完成: ${response.status} ${response.statusText} (${responseTime}ms)`);

        // 返回成功响应
        if (isBinary) {
            // 对于二进制数据，我们需要以不同的方式处理
            // 设置正确的响应头
            c.header('Content-Type', contentType);
            c.header('X-Response-Status', response.status.toString());
            c.header('X-Response-StatusText', response.statusText);
            c.header('X-Response-Time', responseTime.toString());
            c.header('X-Is-Binary', 'true');
            
            // 设置其他响应头
            Object.entries(responseHeaders).forEach(([key, value]) => {
                c.header(`X-Original-${key}`, value);
            });
            
            // 直接返回二进制数据
            return c.body(responseData);
        } else {
            return c.json({
                success: true,
                ...httpResponse
            });
        }

    } catch (error) {
        console.error('[HTTP] 请求失败:', error);
        
        let errorMessage = '请求失败';
        let status = 500;
        
        if (error.name === 'AbortError') {
            errorMessage = '请求超时';
            status = 408;
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = '网络连接失败';
            status = 503;
        } else if (error.message) {
            errorMessage = error.message;
        }

        c.status(500)
        return c.json({
            success: false,
            message: errorMessage,
            error: error.message,
            status: null,
            statusText: '',
            headers: {},
            data: `请求失败: ${errorMessage}`,
            time: 0
        });
    }
}