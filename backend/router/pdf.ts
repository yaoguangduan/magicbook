import {doMerge, pageList} from "./pdf_common";
import {UP_DOWN_DIR} from "../common/dir";
import path from "path";
import fs from "node:fs/promises";
import {PDFDocument} from "@cantoo/pdf-lib";
import JSZip from 'jszip'
import {registerDownloadToken} from "./updown";

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import * as bun from "bun";
import {Context} from "hono";

interface EncryptOrDecrypt {
    id: string,
    password: string
    newPass: string,
    pageFrom: number,
    pageTo: number
}

export const pdfMerge = async (c: Context) => {
    const pdfs = await c.req.json() as any[]
    const ms = Date.now()
    const result = await doMerge({
        pdfs: pdfs.map(pdf => ({...pdf, pdf: path.join(UP_DOWN_DIR, pdf.id)})),
        output: path.join(UP_DOWN_DIR, `${ms}_merge.pdf`)
    })
    if (result.type === 'error') {
        return c.json(result, 500)
    } else {
        const filename = `${ms}_merge.pdf`
        const token = registerDownloadToken(filename)
        return c.json({
            type: 'success',
            message: token
        })
    }
}
export const pdfSetPass = async (c: Context) => {
    const {id, password} = await c.req.json<{ id: string, password: string }>()


    const pdf = await PDFDocument.load(await fs.readFile(path.join(UP_DOWN_DIR, id)), {
        ignoreEncryption: true,
        password: password
    })
    return c.json({
        type: 'success',
        pages: pdf.getPageCount()
    })

}
export const pdfEncrypt = async (c: Context) => {
    const pdfs = await c.req.json<EncryptOrDecrypt[]>()
    let zip: JSZip = null
    for (let {id, password, newPass, pageFrom, pageTo} of pdfs) {
        const pdf = await PDFDocument.load(await fs.readFile(path.join(UP_DOWN_DIR, id)), {
            ignoreEncryption: true,
            password: password
        })
        const newDoc = await PDFDocument.create()
        const pages = await newDoc.copyPages(pdf, pageList(pageFrom, pageTo, pdf.getPageCount()))
        for (let page of pages) {
            newDoc.addPage(page)
        }
        newDoc.encrypt({
            userPassword: newPass,
            ownerPassword: newPass,
            permissions: {
                printing: false,
                copying: false,
                modifying: false,
                fillingForms: false,
                annotating: false,
                contentAccessibility: false,
            }
        })
        if (pdfs.length === 1) {
            const data = await newDoc.save()
            if (id.indexOf("_") != -1) {
                id = id.split("_")[1]
            }
            const fileName = `${Date.now()}_${id.replaceAll(".pdf", "")}_encrypted.pdf`
            await fs.writeFile(path.join(UP_DOWN_DIR, fileName), data)
            const token = registerDownloadToken(fileName)
            return c.json({
                type: 'success',
                message: token
            })
        } else {
            if (zip === null) {
                zip = new JSZip()
            }
            if (id.indexOf("_") != -1) {
                id = id.split("_")[1]
            }
            zip.file(`${id.replaceAll(".pdf", "")}_encrypted.pdf`, await newDoc.save())
        }
    }
    if (zip !== null) {
        const data = await zip.generateAsync({type: "uint8array"})
        const fileName = `${Date.now()}_encrypted.zip`
        await fs.writeFile(path.join(UP_DOWN_DIR, fileName), data)
        const token = registerDownloadToken(fileName)
        return c.json({
            type: 'success',
            message: token
        })
    }
    
    return c.json({
        type: 'error',
        message: 'No files to encrypt'
    })
}
export const pdfDecrypt = async (c: Context) => {
    const pdfs = await c.req.json<EncryptOrDecrypt[]>()
    let zip: JSZip = null
    for (let {id, password, pageFrom, pageTo} of pdfs) {
        const pdf = await PDFDocument.load(await fs.readFile(path.join(UP_DOWN_DIR, id)), {
            ignoreEncryption: true,
            password: password
        })
        const newDoc = await PDFDocument.create()
        const pages = await newDoc.copyPages(pdf, pageList(pageFrom, pageTo, pdf.getPageCount()))
        for (let page of pages) {
            newDoc.addPage(page)
        }
        if (pdfs.length === 1) {
            const data = await newDoc.save()
            if (id.indexOf("_") != -1) {
                id = id.split("_")[1]
            }
            const fileName = `${Date.now()}_${id.replaceAll(".pdf", "")}_decrypted.pdf`
            await fs.writeFile(path.join(UP_DOWN_DIR, fileName), data)
            const token = registerDownloadToken(fileName)
            return c.json({
                type: 'success',
                message: token
            })
        } else {
            if (zip === null) {
                zip = new JSZip()
            }

            if (id.indexOf("_") != -1) {
                id = id.split("_")[1]
            }
            zip.file(`${id.replaceAll(".pdf", "")}_decrypted.pdf`, await newDoc.save())
        }
    }
    if (zip !== null) {
        const data = await zip.generateAsync({type: "uint8array"})
        const fileName = `${Date.now()}_decrypted.zip`
        await fs.writeFile(path.join(UP_DOWN_DIR, fileName), data)
        const token = registerDownloadToken(fileName)
        return c.json({
            type: 'success',
            message: token
        })
    }
    
    return c.json({
        type: 'error',
        message: 'No files to decrypt'
    })
}

interface PdfConvert {
    id: string,
    password: string,
    pageFrom: number,
    pageTo: number
    format: "png" | "jpg" | "jpeg" | "bmp"
    dpi: number
}

export const pdfConvert = async (c: Context) => {
    const pdfs = await c.req.json<PdfConvert[]>()
    const zip = new JSZip()
    for (let pdf of pdfs) {
        const data = await bun.file(path.join(UP_DOWN_DIR, pdf.id)).bytes()
        const doc = await pdfjsLib.getDocument({
            data: data,
            password: pdf.password
        }).promise
        const pageCnt = doc.numPages
        const folder = zip.folder(pdf.id.split("_")[1].replaceAll(".pdf", ""))
        for (let idx of pageList(pdf.pageFrom, pdf.pageTo, pageCnt)) {
            const page = await doc.getPage(idx + 1)
            const vp = page.getViewport({
                scale: pdf.dpi / 72
            })
            const canvasFactory = doc.canvasFactory as any;
            const cac = canvasFactory.create(
                vp.width,
                vp.height
            );
            await page.render({
                canvasContext: cac.context,
                viewport: vp
            } as any).promise

            const buf = cac.canvas.toBuffer(`image/${pdf.format}`, {
                quality: 1
            })
            folder.file(`${idx}.${pdf.format}`, new Uint8Array(buf))
        }
    }
    const data = await zip.generateAsync({type: "uint8array"})
    const ret_name = `${Date.now()}_convert.zip`
    await bun.write(path.join(UP_DOWN_DIR, ret_name), data)
    const token = registerDownloadToken(ret_name)
    return c.json({
        type: 'success',
        message: token
    })
}