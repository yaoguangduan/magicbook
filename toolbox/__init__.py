import asyncio
import copy
import functools
import multiprocessing
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures.process import ProcessPoolExecutor

from nicegui import ui, app, run, client
from nicegui.elements.codemirror import CodeMirror
from nicegui.events import ValueChangeEventArguments
from numpy.f2py.auxfuncs import isstring
from pandas.core.dtypes.inference import is_bool
from pydantic_core.core_schema import model_field

from common import mp_pool
from common.download import download
from common.txt_type_detect import detect_format
from toolbox import base64_c
from toolbox.base64_c import Base64Utils, encode_content, decode_content, encode_file_content, \
    decode_file_content, download_content
from toolbox.convert_func import do_convert
from toolbox.http_req import do_request
from toolbox.jwt_decode_encode import jwt_decode, jwt_encode, algos, jwt_verify
from toolbox.pdf_op import after_uploaded, merge_checked_with_page_no, merge_all, encrypt_pdf, decrypt_pdf, compress_pdf, convert_checked_to_png, add_watermark
from toolbox.time import TimeModel, convert_timestamp_to_formatted, convert_time_str_to_stamp
from common.util import ui_creator, copy_to_clipboard
from toolbox.url_codec import decode_url, encode_url


@ui_creator
def json_ui():
    editor = ui.json_editor(properties={'mode': 'text'}).classes('w-full h-90vh')


@ui_creator
def time_ui():
    time_model = TimeModel()
    with ui.column().classes('w-full h-full'):
        with ui.row().classes('w-full items-center'):
            ui.label("时间戳转换为时间 :  ").classes('text-[#5a99d5]')
            ui.input(on_change=lambda: convert_timestamp_to_formatted(time_model)).props('outlined dense').style('width:30%').bind_value(time_model, 'timestamp')
            ui.icon('arrow_right_alt').classes('text-2xl')
            ui.label('------').classes('text-lg').bind_text_from(time_model, 'time_formatted')
            with ui.link().on('click', handler=lambda: (copy_to_clipboard(time_model.time_formatted, notify=True))):
                ui.icon('content_copy').classes('text-1xl')

        with ui.row().classes('w-full items-center'):
            ui.label("时间转换为时间戳 :  ").classes('text-[#5a99d5]')
            ui.input(on_change=lambda: convert_time_str_to_stamp(time_model)).props('outlined dense').style('width:30%').bind_value(time_model, 'time_str')
            ui.icon('arrow_right_alt').classes('text-2xl')
            ui.label('------').classes('text-lg').bind_text_from(time_model, 'timestamp_converted')
            with ui.link().on('click', handler=lambda: (copy_to_clipboard(time_model.timestamp_converted, notify=True))):
                ui.icon('content_copy').classes('text-1xl')


def change_visible(v, sigs, pps):
    if str(v.value).startswith("HS"):
        for sig in sigs:
            sig.set_visibility(True)
        for pp in pps:
            pp.set_visibility(False)
    else:
        for sig in sigs:
            sig.set_visibility(False)
        for pp in pps:
            pp.set_visibility(True)


@ui_creator
def encode_decode_ui():
    base64_model = {
        'input': str(),
        'output': '',
        'f_output': '',
        'url_safe': True,
        'warn': ''
    }
    if 'jwt' not in app.storage.user:
        app.storage.user['jwt'] = {
            'algo': 'HS256',
            'encoded': '',
            'header': '',
            'body': '',
            'signature': '',
            'pri': '',
            'pub': '',
            'error': ''
        }
    if 'url_c' not in app.storage.user:
        app.storage.user['url_c'] = {
            'encoded': '',
            'decoded': '',
            'error':''
        }
    with ui.column().classes('w-full h-full'):
        with ui.tabs().classes() as tabs:
            base64_input_tab = ui.tab('Base64编解码')
            base64_file_tab = ui.tab('Base64编解码文件')
            url_code_tab = ui.tab(' URL编解码')
            jwt_code_tab = ui.tab('JWT编解码')
        with ui.tab_panels(tabs, value=base64_input_tab).classes('w-full'):
            with ui.tab_panel(base64_input_tab):
                ui.codemirror(line_wrapping=True, theme='githubLight').classes('h-30vh').bind_value(base64_model, 'input').classes('border')
                with ui.row().classes('w-full h-35vh'):
                    ui.button('编码', icon='arrow_downward', on_click=lambda: encode_content(base64_model))
                    ui.button('解码', icon='arrow_downward', on_click=lambda: decode_content(base64_model))
                    ui.checkbox(text='URL安全的编解码').bind_value(base64_model, 'url_safe')
                ui.codemirror(line_wrapping=True, theme='githubLight').classes('h-30vh').bind_value(base64_model, 'output').classes('border')
                with ui.row():
                    ui.button('下载', on_click=lambda: download_content(base64_model['output']))
                    ui.label().bind_text_from(base64_model, 'warn').classes('text-orange')
            with ui.tab_panel(base64_file_tab):
                with ui.row().classes('w-full h-35vh'):
                    ui.upload(multiple=False, auto_upload=True, label='编码文件', on_upload=lambda f: encode_file_content(f, base64_model))
                    ui.upload(multiple=False, auto_upload=True, label='解码文件', on_upload=lambda f: decode_file_content(f, base64_model))
                    ui.checkbox(text='URL安全的编解码').bind_value(base64_model, 'url_safe')
                ui.codemirror(line_wrapping=True, theme='githubLight').classes('h-30vh').bind_value(base64_model, 'f_output').classes('border')
                with ui.row():
                    ui.button('下载', on_click=lambda: download_content(base64_model['f_output'], base64_model))
                    ui.label().bind_text_from(base64_model, 'warn').classes('text-orange')
            with ui.tab_panel(url_code_tab):
                with ui.column().classes('w-full'):
                    ui.input(on_change=lambda :decode_url(app.storage.user['url_c'])).props('outlined dense').style('min-width: 100%').bind_value(app.storage.user['url_c'], 'encoded')
                    with ui.row().props('outlined dense').style('min-width: 100%'):
                        ui.button('解码', icon='arrow_downward', on_click=lambda:decode_url(app.storage.user['url_c']))
                        ui.button('编码', icon='arrow_upward', on_click=lambda: encode_url(app.storage.user['url_c']))
                    ui.input(on_change=lambda :encode_url(app.storage.user['url_c'])).props('outlined dense').style('min-width: 100%').bind_value(app.storage.user['url_c'], 'decoded')
                    ui.label().bind_text_from(app.storage.user['url_c'], 'error').classes('text-red text-lg')
            with ui.tab_panel(jwt_code_tab):
                jwt_ui()


def jwt_ui():
    with ui.row().classes('w-full items-center') as sig_label:
        ui.label('SIGNATURE:').classes('text-lg')
        with ui.link().on('click',handler=lambda: (copy_to_clipboard(app.storage.user['jwt']['signature'], notify=True))):ui.icon('content_copy').classes('text-1xl')
    sig_input = ui.codemirror(line_wrapping=True, theme='githubLight').style('height:9em').bind_value(
        app.storage.user['jwt'], 'signature').classes('border')
    with ui.row().classes('w-full items-center') as pri_label:
        ui.label('PRIVATE KEY:').classes('text-lg')
        with ui.link().on('click',
                          handler=lambda: (copy_to_clipboard(app.storage.user['jwt']['pri'], notify=True))):
            ui.icon('content_copy').classes('text-1xl')
    pri_input = ui.codemirror(line_wrapping=True, theme='githubLight').style('height:9em').bind_value(
        app.storage.user['jwt'], 'pri').classes('border')

    pub_input = ui.codemirror(line_wrapping=True, theme='githubLight').style('height:9em').bind_value(app.storage.user['jwt'], 'pub').classes('border')
    with ui.row().classes('w-full items-center') as pub_label:
        ui.label('PUBLIC KEY:').classes('text-lg')
        with ui.link().on('click',
                          handler=lambda: (copy_to_clipboard(app.storage.user['jwt']['pub'], notify=True))):
            ui.icon('content_copy').classes('text-1xl')
    pri_label.set_visibility(False)
    pri_input.set_visibility(False)
    pub_label.set_visibility(False)
    pub_input.set_visibility(False)
    with ui.row(wrap=False).classes('w-full gap-5'):
        with ui.column().classes('w-full'):
            with ui.row().classes('w-full items-center'):
                ui.label('ENCODED:').classes('text-lg')
                with ui.link().on('click',
                                  handler=lambda: (copy_to_clipboard(app.storage.user['jwt']['encoded'], notify=True))):
                    ui.icon('content_copy').classes('text-1xl')
            ui.codemirror(line_wrapping=True, theme='githubLight').style('height:25em').bind_value(
                app.storage.user['jwt'], 'encoded').classes('border')
            with ui.element().classes('w-full') as element:
                pub_label.move(element)
                pub_input.move(element)
        with ui.column().classes('items-center'):
            ui.label()
            ui.label()
            ui.label()
            ui.select(options=algos, on_change=lambda v: change_visible(v, [sig_label, sig_input],
                                                                        [pri_label, pri_input, pub_label,
                                                                         pub_input])).props(
                'outlined dense').bind_value(app.storage.user['jwt'], 'algo')
            ui.button('解码', icon='arrow_forward', on_click=lambda: jwt_decode(app.storage.user['jwt'])).props('dense')
            ui.button('编码', icon='arrow_back', on_click=lambda: jwt_encode(app.storage.user['jwt'])).props('dense')
            ui.button('校验', icon='check', on_click=lambda: jwt_verify(app.storage.user['jwt'])).props('dense')
        with ui.column().classes('w-full'):
            with ui.row().classes('w-full items-center'):
                ui.label('HEADER:').classes('text-lg')
                with ui.link().on('click',
                                  handler=lambda: (copy_to_clipboard(app.storage.user['jwt']['header'], notify=True))):
                    ui.icon('content_copy').classes('text-1xl')
            ui.codemirror(line_wrapping=True, theme='githubLight', language='JSON').style('height:6em').bind_value(
                app.storage.user['jwt'], 'header').classes('border')
            with ui.row().classes('w-full items-center'):
                ui.label('BODY:').classes('text-lg')
                with ui.link().on('click',
                                  handler=lambda: (copy_to_clipboard(app.storage.user['jwt']['header'], notify=True))):
                    ui.icon('content_copy').classes('text-1xl')
            ui.codemirror(line_wrapping=True, theme='githubLight', language='JSON').style('height:15em').bind_value(
                app.storage.user['jwt'], 'body').classes('border')
            with ui.element().classes('w-full') as element:
                sig_label.move(element)
                sig_input.move(element)
                pri_label.move(element)
                pri_input.move(element)
    ui.label().bind_text_from(app.storage.user['jwt'], 'error').classes('text-red text-lg')


@ui_creator
def converter_ui():
    convert_model = {
        'error': '',
        'input': '',
        'output': '',
        'select': 'JSON -> YAML'
    }
    if 'convert_model' not in app.storage.user:
        app.storage.user['convert_model'] = convert_model
    with ui.row().classes('w-full h-full items-center'):
        ui.select(options=['JSON -> YAML', 'JSON -> XML', 'XML -> JSON', 'XML -> YAML', 'YAML -> JSON', 'YAML -> XML'], on_change=lambda val: do_convert(app.storage.user['convert_model'])).props('dense outlined').bind_value(
            app.storage.user['convert_model'], 'select')
        ui.label().classes('text-red').bind_text(app.storage.user['convert_model'], 'error')
    with ui.row(wrap=False).classes('w-full h-100vh'):
        ui.codemirror(line_wrapping=True, language='JSON', theme='githubLight', on_change=lambda: do_convert(app.storage.user['convert_model'])).props('style="height: 80vh;"').bind_value(app.storage.user['convert_model'], 'input')
        ui.codemirror(line_wrapping=True, theme='githubLight', on_change=detect_lang).props('style="height: 80vh;"').bind_value(app.storage.user['convert_model'], 'output')


def detect_lang(src: ValueChangeEventArguments):
    fmt = detect_format(src.value)
    src.sender.set_language(fmt)

@ui_creator
def http_ui():
    if 'http_req' not in app.storage.user:
        app.storage.user['http_req'] = {
            'ui_visible':False,
            'method':'GET',
            'url':'http://httpbin.org/anything',
            'header':'''# examples:
Host:
Accept:
Authorization:
Content-Type:
User-Agent:''',
            'param':'',
            'body':'{"name": "test", "value": 123}',
            'invoke_time':'',
            'status':'',
            'invoke_cost':'',
            'resp_header':'',
            'resp_size':'',
            'response':'',
            'error':'',
            'settings':'''# request timeout(ms)
timeout:5.0
# enable or disable ssl verification
ssl_verification:false
follow_redirects:true''',
        }

    log = ui.log(max_lines=1000)
    model = app.storage.user['http_req']
    print(model)
    with ui.row().classes('w-full items-center'):
        ui.select(options=['GET','POST',"PUT","PATCH","DELETE"]).props('outlined dense').classes('text-sm').bind_value(model,'method')
        ui.input().props('dense outlined').style('width:70%').bind_value(model,'url')
        ui.button('Send',icon='send',on_click=lambda :do_request(model,log)).props('outlined').bind_visibility_from(model,'ui_visible',backward=lambda x:not x)
        ui.spinner(size='lg').bind_visibility_from(model,'ui_visible')
    with ui.tabs().classes().props('dense') as tabs:
        header_tab = ui.tab('Headers').props('no-caps')
        param_tab = ui.tab('Params').props('no-caps')
        body_tab = ui.tab('Body').props('no-caps')
        settings_tab = ui.tab('Settings').props('no-caps')
    with ui.tab_panels(tabs,value=header_tab).props('dense').classes('w-full') as panels:
        with ui.tab_panel(header_tab):
            ui.codemirror(line_wrapping=False, theme='githubLight',language="Properties files").classes('border').style('height:12em').bind_value(model, 'header')
        with ui.tab_panel(param_tab):
            ui.codemirror(line_wrapping=False, theme='githubLight', language="Properties files").classes('border').style('height:12em').bind_value(model, 'param')
        with ui.tab_panel(body_tab):
            ui.codemirror(line_wrapping=False, theme='githubLight',on_change=detect_lang).classes('border').style('height:12em').bind_value(model, 'body')
        with ui.tab_panel(settings_tab).classes('w-full items-center scroll'):
            ui.codemirror(line_wrapping=False, theme='githubLight',language="Properties files").classes('border').style('height:12em').bind_value(model, 'settings')

    with ui.row().classes('w-full items-center').style('padding-right:10%'):
        with ui.tabs().classes().props('dense') as tabs:
            resp_tab = ui.tab('Response').props('no-caps')
            resp_h_tab = ui.tab('Response Header').props('no-caps')
            log_tab = ui.tab('Log Detail').props('no-caps')
        ui.space()
        ui.label().bind_text_from(model, 'invoke_time')
        StatusLabel().bind_text_from(model, 'status').classes('text-bold')
        ui.label().bind_text_from(model, 'invoke_cost')
        ui.label().bind_text_from(model, 'resp_size')
    with ui.tab_panels(tabs,value=resp_tab).props('dense').classes('w-full') as panels:
        with ui.tab_panel(resp_tab):
            ui.codemirror(line_wrapping=False, theme='githubLight',on_change=detect_lang).classes('border').bind_value(model, 'response')
        with ui.tab_panel(resp_h_tab):
            ui.codemirror(line_wrapping=False, theme='githubLight',language="Properties files").classes('border').bind_value(model, 'resp_header')
        with ui.tab_panel(log_tab) as log_panel:
            log.move(log_panel)
    ui.label().bind_text_from(model, 'error')

class StatusLabel(ui.label):
    def _handle_text_change(self, text: str) -> None:
        super()._handle_text_change(text)
        if text.startswith('2'):
            print(text)
            self.classes(replace='text-green-700')
        elif text.startswith('4'):
            self.classes(replace='text-orange')
        elif text.startswith('5'):
            self.classes(replace='text-red')
        else:
            self.classes(replace='text-neutral')


def up_index(pdf_list,idx):
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
    with ui.row().classes('w-full items-center'):
        ui.upload(multiple=True,auto_upload=True,on_multi_upload=lambda v:after_uploaded(v,pdf_list,create_list)).props('dense').props('accept=.pdf')
    elem = ui.list().classes('w-full').props('separator bordered')
    def do_encrypt_decrypt():
        call = encrypt_pdf if model['op_name'] == '加密' else decrypt_pdf
        dialog.close()
        dialog_call(dia,model,call,pdf_list,model)

    dialog = ui.dialog()
    with dialog:
        with ui.card().classes('items-center'):
            with ui.row().classes('w-full items-center'):
                ui.label("输入密码:")
                ui.input().props('dense').bind_value(model, 'encry_pwd').props('autofocus')
            with ui.row().classes('w-full items-center'):
                ui.space()
                ui.button('',on_click=do_encrypt_decrypt).props('dense').bind_text_from(model, 'op_name')

    dia = ui.dialog().props('persistent')
    with dia:
        ui.spinner(size="lg",color="orange")

    color_dia = ui.dialog().props('persistent')
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
                    ui.button('添加',on_click=lambda :(color_dia.close(),dialog_call(dia,model,add_watermark,pdf_list,model)))
    def flip_check(v):
        for p in pdf_list:
            p.update(check=v.value)
    def create_list():
        with elem:
            elem.clear()
            with ui.row().classes('w-full items-center'):
                ui.item_label('PDF列表').props('header').classes('text-bold')
            ui.separator()
            with (elem):
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
                                ui.button(icon='arrow_upward', on_click=lambda i=idx: (up_index(pdf_list, i),create_list())).props('dense flat').tooltip('上移')
                                ui.button(icon='arrow_downward', on_click=lambda i=idx: (down_index(pdf_list, i),create_list())).props('dense flat').tooltip('下移')
                                ui.button(icon='content_copy',on_click=lambda i=idx: (copy_index(pdf_list, i),create_list())).props('dense flat').tooltip('复制')
                                ui.button(icon='close',on_click=lambda i=idx: (del_index(pdf_list, i),create_list())).props('dense flat').tooltip('删除')
    create_list()
    with ui.row().classes('w-full items-center'):
        ui.checkbox(text="选择/去勾选所有", value=True, on_change=lambda v: (flip_check(v), create_list())).bind_value(model, 'check')
        ui.button("顺序合并选中PDF的对应起止页",icon='merge_type',on_click=functools.partial(dialog_call,dia,model,merge_checked_with_page_no,pdf_list,model))
        ui.button("顺序合并所有",icon='merge',on_click=functools.partial(dialog_call,dia,model,merge_all,pdf_list,model))
        ui.button("加密选中的文档",icon='lock',on_click=lambda :(model.update(op_name='加密'),dialog.open()))
        ui.button("解密选中的文档",icon='lock_open',on_click=lambda :(model.update(op_name='解密'),dialog.open()))
        with ui.dropdown_button('选中的文档对应起止页转PNG',icon='image'):
            ui.item("低清晰度",on_click=functools.partial(dialog_call,dia,model,convert_checked_to_png,pdf_list,150))
            ui.item("中清晰度", on_click=functools.partial(dialog_call, dia, model,convert_checked_to_png, pdf_list, 300))
            ui.item("高清晰度", on_click=functools.partial(dialog_call, dia,model, convert_checked_to_png, pdf_list, 600))
        ui.button('选中的pdf起止页面添加水印',on_click=lambda :(color_dia.open()))
    ui.label().bind_text_from(model, 'error').classes('text-bold text-red')

def dialog_call(dia,model,call,*args):
    model['error'] = ''
    dia.open()
    def callback(tup):
        ret = tup[0]
        e = tup[1]
        if e is not None:
            model['error'] = f"{type(e).__name__}: {str(e)}"
        else:
            if isinstance(ret, str):
                model['error'] = ret
            else:
                with tup[2]:
                    download(ret[0], filename=ret[1], media_type=ret[2])
        dia.close()
    mp_pool.submit(call,callback,*args)