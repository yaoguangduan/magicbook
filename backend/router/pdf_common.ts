import * as fs from "node:fs/promises";
import {PDFDocument} from '@cantoo/pdf-lib'

export interface PdfDesc {
    pdf: string,
    password: string
    pageFrom: number,
    pageTo: number,
    format: string,
    dpi: number
}

export interface PdfMergeRequest {
    pdfs: PdfDesc[],
    output: string
}

export const pageList = (from: number, to: number, total: number) => {
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

export const doMerge = async (pdfMerge: PdfMergeRequest): Promise<any> => {
    if (pdfMerge.pdfs.length === 0) {
        return {
            type: 'error',
            message: '请至少选择一个PDF'
        }
    }
    const result = await PDFDocument.create()
    for (const pdf of pdfMerge.pdfs) {
        const pdfDoc = await PDFDocument.load(await fs.readFile(pdf.pdf), {
            ignoreEncryption: true,
            password: pdf.password
        })
        const pages = pdfDoc.getPages()
        const page = await result.copyPages(pdfDoc, pageList(pdf.pageFrom, pdf.pageTo, pages.length))
        for (let i = 0; i < page.length; i++) {
            result.addPage(page[i])
        }
    }
    const pdfBytes = await result.save()
    await fs.writeFile(pdfMerge.output, pdfBytes)
    return {
        type: 'complete',
        message: `已保存到:${pdfMerge.output}`,
    }
}