import functools

from nicegui import ui, app

from magicbook.bioinformatics.split_targets import split_molecule_targets
from magicbook.bioinformatics.tcmsp import download_herbs_mole_targets_to_zip
from magicbook.common import process_pool
from magicbook.common.download import download
from magicbook.common.process_pool import ProcessResult
from magicbook.common.util import ui_creator

@ui_creator
def split_molecule_targets_ui():
    with ui.column().classes('w-full') as ele:
        ui.upload(label="上传excel", auto_upload=True, multiple=False, on_upload=lambda v: split_molecule_targets(v))

@ui_creator
def tcmsp_download_herbs_mole_target_ui():
    if 'tcmsp_data' not in app.storage.user:
        app.storage.user['tcmsp_data'] = {
            'ob_dl_filter': True,
            'herb_names': ''
        }

    with ui.column().classes('w-full'):
        with ui.row():
            ui.checkbox(text='过滤(ob>=30;dl>=0.18)').bind_value(app.storage.user['tcmsp_data'],'ob_dl_filter')
            spin = ui.spinner(size='lg')
            spin.set_visibility(False)
            btn = ui.button(text='下载')
            btn.on_click(functools.partial(tcmsp_download,dict(app.storage.user['tcmsp_data']),spin,btn))
        ui.label('请在下方输入中药名称,每行一个或者逗号分隔:')
        ui.codemirror(theme='githubLight').bind_value(app.storage.user['tcmsp_data'],'herb_names')

def tcmsp_download(tcmsp_data,spin,btn):
    spin.set_visibility(True)
    btn.set_visibility(False)
    def cb(pr:ProcessResult):
        if pr.e is not None:
            ui.notify(f"{type(pr.e).__name__}: {str(pr.e)}", type="negative", position="top", timeout=3000)
        else:
            with pr.slot:
                resp = pr.data
                download(resp[0],filename=resp[1],media_type='application/zip')

    process_pool.run_with_callback(functools.partial(download_herbs_mole_targets_to_zip, tcmsp_data), cb=cb)
    spin.set_visibility(False)
    btn.set_visibility(True)
