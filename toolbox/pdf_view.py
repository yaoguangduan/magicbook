import functools

from nicegui import ui, run

from common import process_pool
from common.download import download

from common.util import ui_creator
from toolbox import after_uploaded, encrypt_pdf, decrypt_pdf, add_watermark, merge_checked_with_page_no, merge_all, convert_checked_to_png


def up_index(pdf_list, idx):
    if idx <= 0:
        return
    item = pdf_list.pop(idx)
    pdf_list.insert(idx-1,item)


def down_index(pdf_list,idx):
    if idx >= len(pdf_list):
        return
    item = pdf_list.pop(idx)
    pdf_list.insert(idx+1,item)


def copy_index(pdf_list, idx):
    if idx >= len(pdf_list) or idx < 0:
        return
    item = pdf_list[idx]
    dup = {}
    for k,v in item.items():
        dup[k] = v
    pdf_list.insert(idx,dup)
    ui.update()


def del_index(pdf_list, idx):
    if idx >= len(pdf_list) or idx < 0:
        return
    item = pdf_list.pop(idx)


@ui_creator
def pdf_ui():
    model = {
        'error':'',
        'active':-1,
        'encry_pwd':'',
        'op_name':'加密',
        'png_dpi':150,
        'check':True,
        'wm_color':'#000000',
        "wm_opacity":0.5,
        'wm_text':'magic watermark',
        'wm_rotate':0,
        'wm_text_size':16,
    }
    pdf_list = []
    @ui.refreshable
    def upload_ui():
        with ui.row().classes('w-full items-center'):
            ui.upload(multiple=True,auto_upload=True,on_multi_upload=lambda v:after_uploaded(v,pdf_list,lambda :(pdf_list_view.refresh(),upload_ui.refresh()))).props('dense').props('accept=.pdf')
    upload_ui()
    async def do_encrypt_decrypt():
        call = encrypt_pdf if model['op_name'] == '加密' else decrypt_pdf
        dialog.close()
        await dialog_call(model, call, pdf_list, model)

    dialog = ui.dialog()
    with dialog:
        with ui.card().classes('items-center'):
            with ui.row().classes('w-full items-center'):
                ui.label("输入密码:")
                ui.input().props('dense').bind_value(model, 'encry_pwd').props('autofocus')
            with ui.row().classes('w-full items-center'):
                ui.space()
                ui.button('',on_click=do_encrypt_decrypt).props('dense').bind_text_from(model, 'op_name')

    color_dia = ui.dialog().props('persistent')
    async def add_wm():
        color_dia.close()
        await dialog_call(model, add_watermark, pdf_list, model)
    with color_dia:
        with ui.card():
            with ui.grid(columns=2).classes('w-full items-center'):
                ui.label('文本颜色:')
                with ui.button(icon='palette').props('flat') as button:
                    ui.color_picker(on_pick=lambda e: (button.classes(f'!bg-[{e.color}]'),model.update(wm_color=e.color)))
                ui.label('文本透明度:')
                ui.slider(min=0, max=1, step=0.1,value=1).props('label-always').bind_value(model, 'wm_opacity')
                ui.label('文本值:')
                ui.input().props('dense flat').bind_value(model, 'wm_text')
                ui.label('字体大小:')
                ui.number(min=1,max=100,step=2).props('dense flat').bind_value(model, 'wm_text_size')
                ui.label('旋转:')
                ui.select(options=[0,90,180,270]).props('dense outlined').bind_value(model, 'wm_rotate')
                ui.label()
                with ui.row().classes('w-full items-center'):
                    ui.button('取消',on_click=color_dia.close)
                    ui.button('添加',on_click=add_wm)
    def flip_check(v):
        model['check'] = not model['check']
        for p in pdf_list:
            p.update(check=v.value)

    elem = ui.list().classes('w-full').props('separator bordered')
    @ui.refreshable
    def pdf_list_view():
        elem.clear()
        with elem:
            with ui.row().classes('w-full items-center'):
                ui.item_label('PDF列表').props('header').classes('text-bold')
            ui.separator()
            for idx, pdf in enumerate(pdf_list):
                with ui.item():
                    with ui.item_section().props('avatar'):
                        with ui.row():
                            ui.checkbox().bind_value(pdf, 'check')
                    with ui.item_section():
                        with ui.row().classes('items-center'):
                            ui.item_label(pdf['name']).classes('text-bold')
                            ui.item_label(f'页数: {pdf["pages"]};大小: {pdf["size"]:.3f}M').props('caption').style('margin-right:50px')
                            ui.number(precision=0,label='起始页:',min=1,max=pdf['page_to']).props('dense').style('width:10em;').bind_value(pdf, 'page_from')
                            ui.label(' - ')
                            ui.number(precision=0,label='结束页:',min=1,max=pdf['page_to']).props('dense').style('width:10em').bind_value(pdf, 'page_to')
                    with ui.item_section().props('side'):
                        with ui.row().classes('items-center'):
                            ui.button(icon='arrow_upward', on_click=lambda i=idx: (up_index(pdf_list, i),pdf_list_view.refresh())).props('dense flat').tooltip('上移')
                            ui.button(icon='arrow_downward', on_click=lambda i=idx: (down_index(pdf_list, i),pdf_list_view.refresh())).props('dense flat').tooltip('下移')
                            ui.button(icon='content_copy',on_click=lambda i=idx: (copy_index(pdf_list, i),pdf_list_view.refresh())).props('dense flat').tooltip('复制')
                            ui.button(icon='close',on_click=lambda i=idx: (del_index(pdf_list, i),pdf_list_view.refresh())).props('dense flat').tooltip('删除')

            ui.separator()
            with ui.row().classes('w-full items-center'):
                ui.space()
                ui.checkbox(text="选择/去勾选所有", value=model['check'], on_change=lambda v: (flip_check(v), pdf_list_view.refresh()))
                ui.button("删除所有文档", icon='close', on_click=lambda: (pdf_list.clear(), pdf_list_view.refresh())).props('color=red dense')
    pdf_list_view()

    with ui.row().classes('w-full items-center'):
        ui.button("顺序合并选中PDF的对应起止页",icon='merge_type',on_click=functools.partial(dialog_call,model,merge_checked_with_page_no,pdf_list,model))
        ui.button("顺序合并所有",icon='merge',on_click=functools.partial(dialog_call,model,merge_all,pdf_list,model))
        ui.button("加密选中的文档",icon='lock',on_click=lambda :(model.update(op_name='加密'),dialog.open()))
        ui.button("解密选中的文档",icon='lock_open',on_click=lambda :(model.update(op_name='解密'),dialog.open()))
        with ui.dropdown_button('选中的文档对应起止页转PNG',icon='image'):
            ui.item("低清晰度",on_click=functools.partial(dialog_call,model,convert_checked_to_png,pdf_list,150))
            ui.item("中清晰度", on_click=functools.partial(dialog_call,  model,convert_checked_to_png, pdf_list, 300))
            ui.item("高清晰度", on_click=functools.partial(dialog_call, model, convert_checked_to_png, pdf_list, 600))
        ui.button('选中的pdf起止页面添加水印',on_click=lambda :(color_dia.open()))
    ui.label().bind_text_from(model, 'error').classes('text-bold text-red')


async def dialog_call(model, call, *args):
    model['error'] = ''
    try:
        ret = await process_pool.run_async(functools.partial(call, *args))
        if isinstance(ret, str):
            model['error'] = ret
        else:
            download(ret[0], filename=ret[1], media_type=ret[2])
    except Exception as e:
        model['error'] = f"{type(e).__name__}: {str(e)}"
