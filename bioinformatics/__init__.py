import functools

from nicegui import ui, run

from bioinformatics.split_targets import split_molecule_targets
from bioinformatics.tcmsp import download_herbs_mole_targets_to_zip
from common.download import download
from common.util import ui_creator
from log import QueuedLog, LeveledLog

tcmsp_data = {
    'ob_dl_filter': True,
    'herb_names': ''
}

@ui_creator
def split_molecule_targets_ui():
    with ui.column().classes('w-full') as ele:
        log = QueuedLog(max_lines=1000).classes('h-full w-full')
        ui.upload(label="上传excel", auto_upload=True, multiple=False, on_upload=lambda v: split_molecule_targets(v, log))
        log.move(ele)

@ui_creator
def tcmsp_download_herbs_mole_target_ui():
    log = LeveledLog(max_lines=1000).classes('h-full w-full')
    with ui.column().classes('w-full') as elem:
        with ui.row():
            spin = ui.spinner(size='lg')
            spin.set_visibility(False)
            ui.checkbox(text='过滤(ob>=30;dl>=0.18)',on_change=lambda v:tcmsp_data.update({'ob_dl_filter':v.value}))
            ui.button(text='下载', on_click=functools.partial(tcmsp_download,spin,log))
        ui.codemirror(value='输入中药名称,每行一个或者逗号分隔',theme='githubLight',on_change=lambda v :tcmsp_data.update({'herb_names':v.value}))
        log.move(elem)


async def tcmsp_download(spin,log):
    log.clear()
    spin.set_visibility(True)
    resp = await run.io_bound(download_herbs_mole_targets_to_zip, tcmsp_data, log)
    download(resp[0],filename=resp[1],media_type='application/zip')
    spin.set_visibility(False)
