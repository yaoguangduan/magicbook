from nicegui import app, ui
from nicegui.events import ValueChangeEventArguments

from common.txt_type_detect import detect_format
from common.util import ui_creator
from toolbox import do_convert

def detect_lang(src: ValueChangeEventArguments):
    fmt = detect_format(src.value)
    src.sender.set_language(fmt)



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
