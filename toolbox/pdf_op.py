import asyncio
import io
import traceback
import zipfile

import pymupdf

from nicegui import ui


def after_uploaded(uploads,pdf_list,updater):
    for content,name in zip(uploads.contents,uploads.names):
        bys = content.read()
        doc = pymupdf.open(stream=io.BytesIO(bys))
        pdf_list.append({
            'check':True,
            'name': name,
            'pages':doc.page_count,
            'page_from':1,
            'page_to':doc.page_count,
            'size':len(bys) / (1024*1024),
            'bytes':bys
        })
        content.close()
        doc.close()

    uploads.sender.clear()
    updater()

def merge_checked_with_page_no(pdf_list,model):
    try:
        doc = pymupdf.open()
        for page in pdf_list:
            if page['check']:
                tmp = pymupdf.open(stream=io.BytesIO(page['bytes']))
                doc.insert_pdf(tmp,from_page=int(page['page_from']-1),to_page=int(page['page_to']-1))
        pdf_bytes = doc.write(garbage=4, deflate=True, clean=True)
        doc.close()
        return pdf_bytes, 'merged.pdf', 'application/pdf'
    except Exception as e:
        print(e)
        return f"{type(e).__name__}: {str(e)}"

def merge_all(pdf_list,model):
    try:
        doc = pymupdf.open()
        for page in pdf_list:
            tmp = pymupdf.open(stream=io.BytesIO(page['bytes']))
            doc.insert_pdf(tmp)
        pdf_bytes = doc.write(garbage=4, deflate=True, clean=True)
        doc.close()
        return pdf_bytes, 'merged.pdf', 'application/pdf'
    except Exception as e:
        print(e)
        return f"{type(e).__name__}: {str(e)}"

def encrypt_pdf(pdf_list,model):
    try:
        zip_io = io.BytesIO()
        zipf = zipfile.ZipFile(zip_io, 'w')
        for page in pdf_list:
            if not page['check']:
                continue
            doc = pymupdf.open()
            tmp = pymupdf.open(stream=io.BytesIO(page['bytes']))
            doc.insert_pdf(tmp)
            pdf_stream = io.BytesIO()
            encrypt_meth = pymupdf.mupdf.PDF_ENCRYPT_AES_256
            doc.save(
                pdf_stream,
                encryption=encrypt_meth,
                user_pw=model['encry_pwd'],
                owner_pw=model['encry_pwd'],
                permissions=0
            )
            pdf_bytes = pdf_stream.getvalue()

            pdf_stream.close()
            doc.close()
            zipf.writestr(f'{page["name"].rstrip(".pdf")}-protected.pdf',pdf_bytes)
        zipf.close()

        return zip_io.getvalue(), "protected.zip", 'application/zip'
    except Exception as e:
        traceback.print_exc()
        print(e)
        return f"{type(e).__name__}: {str(e)}"

def decrypt_pdf(pdf_list,model):
    try:
        zip_io = io.BytesIO()
        zipf = zipfile.ZipFile(zip_io, 'w')
        for page in pdf_list:
            if not page['check']:
                continue
            doc = pymupdf.open()
            another = pymupdf.open(stream=io.BytesIO(page['bytes']))
            if another.needs_pass:
                another.authenticate(model['encry_pwd'])
            doc.insert_pdf(another)
            pdf_bytes = doc.write(garbage=4, deflate=True, clean=True)
            doc.close()
            zipf.writestr(f'{page["name"].rstrip(".pdf")}-unprotected.pdf',pdf_bytes)
        zipf.close()
        return zip_io.getvalue(), "unprotected.zip", 'application/zip'
    except Exception as e:
        traceback.print_exc()
        return f"{type(e).__name__}: {str(e)}"

def convert_checked_to_png(pdf_list, dpi):
    try:
        print(dpi)
        zip_io = io.BytesIO()
        zipf = zipfile.ZipFile(zip_io, 'w')
        for page in pdf_list:
            if not page['check']:
                continue
            doc = pymupdf.open(stream=io.BytesIO(page['bytes']))
            name = page['name'].rstrip(".pdf")
            zipf.mkdir(name)
            pagen_from = int(page['page_from'])
            pagen_to = int(page['page_to'])
            for page_num in range(pagen_from-1, pagen_to):
                page = doc.load_page(page_num)
                mat = pymupdf.Matrix(dpi / 72, dpi / 72)
                pix = page.get_pixmap(matrix=mat)
                zipf.writestr(f'{name}/{page_num+1}.png',pix.tobytes())
        zipf.close()
        return zip_io.getvalue(), "pdfs_to_pngs.zip", 'application/zip'
    except Exception as e:
        print(e)
        return f"{type(e).__name__}: {str(e)}"
def compress_pdf(pdf_list, model,idx) :
    try:

        doc = pymupdf.open()
        another = pdf_list[idx]['doc']
        doc.insert_pdf(another)

        compress_params = {
            "garbage": 4,  # 清理垃圾对象
            "deflate": True,  # 使用deflate压缩
            "clean": True,  # 清理冗余数据
        }

        pdf_bytes = doc.write(**compress_params)
        doc.close()
        ui.download.content(content=pdf_bytes,filename=f'{str(pdf_list[idx]["name"]).rstrip(".pdf")}-compressed.pdf',media_type='application/pdf')
    except Exception as e:
        traceback.print_exc()
        print(e)
        model['error'] = f"{type(e).__name__}: {str(e)}"
def hex_to_rgb_normalized(hex_color):
    """转换为0-1范围的RGB"""
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return r, g, b

def add_watermark(pdf_list, model):
    try:
        print(model)
        zip_io = io.BytesIO()
        zipf = zipfile.ZipFile(zip_io, 'w')
        for pdf in pdf_list:
            if not pdf['check']:
                continue
            doc = pymupdf.open(stream=io.BytesIO(pdf['bytes']))
            pagen_from = int(pdf['page_from'])
            pagen_to = int(pdf['page_to'])
            for page_num in range(pagen_from-1, pagen_to):
                page = doc.load_page(page_num)
                rect = page.rect

                cells = pymupdf.make_table(rect, cols=4, rows=4)

                shape = page.new_shape()
                for i in range(len(cells)):
                    for j in range(len(cells[0])):
                        shape.insert_textbox(
                            cells[i][j], model['wm_text'],fontsize=model['wm_text_size'],
                            color=hex_to_rgb_normalized(model['wm_color']), rotate=model['wm_rotate'],align='center',fill_opacity=model['wm_opacity'])
                shape.finish()
                shape.commit()
            output_bytes = doc.write()
            doc.close()
            zipf.writestr(f'{pdf["name"].rstrip(".pdf")}-wm.pdf',output_bytes)
        zipf.close()
        return zip_io.getvalue(), "watermarked.zip", 'application/zip'
    except Exception as e:
        return f"{type(e).__name__}: {str(e)}"