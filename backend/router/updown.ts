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
        });
    }

}
