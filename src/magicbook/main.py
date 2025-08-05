import logging
import os
import sys

import nicegui.logging

from magicbook.common import pages, process_pool
from nicegui import ui

from magicbook.common.log import logger

def main():
    """主函数入口点"""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, project_root)
    logger.info(f"模块被导入: {__name__}")
    logging.getLogger('watchfiles.main').setLevel(logging.WARNING)
    pages.init()
    process_pool.init()
    nicegui.app.add_static_files("/logs","./logs")
    ui.run(host='0.0.0.0',
           port=8080,
           show=False,
           storage_secret='-',
           ssl_keyfile='./cert/key.pem',
           ssl_certfile='./cert/cert.pem',
           uvicorn_reload_excludes='logs,.venv,cert,.nicegui',
           reload=True)
if __name__ in {"__main__","__mp_main__"}:
    main()

