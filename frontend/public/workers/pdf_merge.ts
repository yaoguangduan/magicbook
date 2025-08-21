// 环境检测
import {messageConsume} from "./common";
import {PDFDocument} from "@cantoo/pdf-lib";
import fs from "node:fs/promises";

const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const isWorker = typeof self !== 'undefined' && typeof importScripts !== 'undefined';

interface PdfMerge {
    pdf: string,
    pageFrom: number,
    pageTo: number
}

interface PdfMergeRequest {
    pdfs: PdfMerge[],
    output: string
}

const pageList = (from: number, to: number, total: number) => {
    const pages = []
    if (from === to) {
        if (from === 0) {
            for (let i = 0; i < total; i++) {
                pages.push(i)
            }
            return pages
        } else {
            return [from]
        }
    } else {
        for (let i = from; i <= to; i++) {
            pages.push(i - 1)
        }
        return pages
    }
}

const doMerge = async (pdfMerge: PdfMergeRequest) => {
    if (pdfMerge.pdfs.length === 0) {
        messageConsume({
            type: 'error',
            message: '请至少选择一个PDF'
        })
        return
    }
    messageConsume({
        type: 'info',
        message: `开始合并PDF`
    })
    const result = await PDFDocument.create()
    for (const pdf of pdfMerge.pdfs) {
        const pdfDoc = await PDFDocument.load(await fs.readFile(pdf.pdf))
        const pages = pdfDoc.getPages()
        const page = await result.copyPages(pdfDoc, pageList(pdf.pageFrom, pdf.pageTo, pages.length))
        for (let i = 0; i < page.length; i++) {
            result.addPage(page[i])
            messageConsume({
                type: 'info',
                message: `合并 ${pdf.pdf} 第${i + 1 + (pdf.pageFrom === 0 ? 0 : (pdf.pageFrom - 1))}页`
            })
        }
    }
    messageConsume({
        type: 'success',
        message: '合并PDF完成'
    })
    const pdfBytes = await result.save()
    await fs.writeFile(pdfMerge.output, pdfBytes)
    messageConsume({
        type: 'complete',
        message: `已保存到:${pdfMerge.output}`,
    })
}


// 通用消息处理函数
const handleMessage = async (data: any) => {
    const {type, message, ...params} = data;

    switch (type) {
        case 'start':
            console.log('收到 Worker 消息:', message);
            return {success: true, message: 'Worker 启动成功'};

        case 'process':
            console.log('处理数据:', params);
            // 这里添加你的 PDF 处理逻辑
            return {success: true, result: '处理完成'};

        case 'merge':
            console.log('合并 PDF:', params);
            // 调用 PDF 合并函数
            if (isNode) {
                await doMerge(params);
            }
            return {success: true, result: 'PDF 合并完成'};

        default:
            return {success: false, error: '未知的消息类型'};
    }
};


if (isNode) {
    console.log('worker')
} else {
    self.importScripts('@cantoo/')
    self.onmessage = async (event) => {
        await doMerge(event.data);
    }
}
