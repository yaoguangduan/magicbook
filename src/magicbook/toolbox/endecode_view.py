from nicegui import app, ui

from magicbook.common.util import ui_creator, copy_to_clipboard
from magicbook.toolbox import encode_content, decode_content, download_content, encode_file_content, decode_file_content, decode_url, encode_url, algos, jwt_decode, jwt_encode, jwt_verify


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
