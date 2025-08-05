from nicegui import ui

from magicbook.common.util import ui_creator, copy_to_clipboard
from magicbook.toolbox import TimeModel, convert_timestamp_to_formatted, convert_time_str_to_stamp


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

