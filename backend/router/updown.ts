import path from "path";
import * as fs from "fs/promises";
import {UP_DOWN_DIR} from "../common/dir";
import {PDFDocument} from "@cantoo/pdf-lib";
import {Context} from 'hono'
import * as bun from "bun";

// 定义参数类型
export interface DownloadQuery {
    filename: string;
}

const getFileId = (filename: string) => {
    return `${Date.now()}_${filename}`
}

// 临时下载token存储（实际项目中应该用Redis）
const downloadTokens = new Map<string, { filename: string, expires: number }>()

// 注册下载token（给PDF处理器调用）
export const registerDownloadToken = (filename: string): string => {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expires = Date.now() + 5 * 60 * 1000 // 5分钟有效期

    downloadTokens.set(token, {filename, expires})

    // 清理过期token
    const now = Date.now()
    for (const [key, value] of downloadTokens.entries()) {
        if (value.expires < now) {
            downloadTokens.delete(key)
        }
    }

    return token
}

// 通过token下载
export const downloadByToken = async (c: Context) => {
    const {token} = c.req.query()
    if (!token) {
        return c.json({error: 'Missing token'}, 400)
    }
    const tokenData = downloadTokens.get(token)
    if (!tokenData) {
        return c.json({error: 'Invalid token'}, 401)
    }
    if (tokenData.expires < Date.now()) {
        downloadTokens.delete(token)
        return c.json({error: 'Token expired'}, 401)
    }
    downloadTokens.delete(token)

    const file = bun.file(path.join(UP_DOWN_DIR, tokenData.filename))
    const encodedFilename = encodeURIComponent(tokenData.filename);
    c.header('Content-Type', 'application/octet-stream');
    c.header('Content-Disposition', `attachment; filename="${encodedFilename}"`);
    c.header('Content-Length', file.size.toString());
    return c.body(file.stream())
}
export const download = async (c: Context) => {
    const {filename} = c.req.query()
    const file = bun.file(path.join(UP_DOWN_DIR, filename))
    const encodedFilename = encodeURIComponent(filename);
    c.header('Content-Type', 'application/octet-stream');
    c.header('Content-Disposition', `attachment; filename="${encodedFilename}"`);
    c.header('Content-Length', file.size.toString());
    return c.body(file.stream())
}
export const upload = async (c: Context) => {
    const body = await c.req.parseBody<{ file: File }>()
    const {file} = body
    if (!file) {
        throw new Error(`bad request - no file found in body`)
    }
    const uploadDir = UP_DOWN_DIR;
    try {
        await fs.access(uploadDir);
    } catch {
        await fs.mkdir(uploadDir, {recursive: true});
    }
    
    const originalName = file.name || 'unknown';
    const fileid = getFileId(originalName)
    const filePath = path.join(uploadDir, fileid);

    await bun.write(filePath, file)
    if (originalName.endsWith(".pdf")) {
        const doc = await PDFDocument.load(await fs.readFile(filePath), {
            ignoreEncryption: true,
        })
        return c.json({
            success: true,
            filename: originalName,
            fileid: fileid,
            needPass: doc.isEncrypted,
            pages: doc.isEncrypted ? 0 : doc.getPageCount()
        });
    } else {
        return c.json({
            success: true,
            filename: originalName,
            fileid: fileid,
            needPass: false,
            pages: 0
        });
    }
}
