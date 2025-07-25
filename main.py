import os
import random
import sys

import category
import common
import log
from common.pages import init

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
from nicegui import ui
log.init()
init()

@ui.page("/login")
def login():
    with ui.column().classes('w-full items-center'):
        ui.space()
        ui.input().props('outlined dense')
        ui.input().props('outlined dense')
        ui.space()

ui.run(host='0.0.0.0', port=8080, show=False,storage_secret='-',ssl_keyfile='./cert/key.pem',ssl_certfile='./cert/cert.pem',)
