from nicegui import app, ui
from nicegui.events import ValueChangeEventArguments

from common.txt_type_detect import detect_format
from common.util import ui_creator
from toolbox import do_request


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
    logger.info(model)
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
            logger.info(text)
            self.classes(replace='text-green-700')
        elif text.startswith('4'):
            self.classes(replace='text-orange')
        elif text.startswith('5'):
            self.classes(replace='text-red')
        else:
            self.classes(replace='text-neutral')
