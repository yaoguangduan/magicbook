from nicegui import ui

from common.util import ui_creator


@ui_creator
def json_ui():
    editor = ui.json_editor(properties={'mode': 'text'}).classes('w-full').style('height:90vh')
