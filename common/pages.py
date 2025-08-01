import datetime
import queue
import random
import threading

from nicegui import ui

from category import CATEGORIES
from common import log
from common.log import logger
from header import with_header


def create_page(categories, path):
    @ui.page(path)
    @with_header(title="Wall")
    def page():
        create_categories(categories, path)


def create_feature(category,path):
    @ui.page(path)
    @with_header(title=category['name'])
    def page():
        category['creator']()


def init():
    def create_pages(categories, base_path='/'):
        # 确保当前层级的页面被创建
        create_page(categories, base_path)

        for category in categories:
            new_path = base_path.rstrip('/') + category['path']
            if 'categories' in category:
                # 递归创建子页面，传入新路径作为基础路径
                logger.info(f'Adding category "{new_path}"')
                create_pages(category['categories'], new_path)
            elif 'creator' in category:
                logger.info(f'Adding creator "{new_path}"')
                create_feature(category, new_path)

    # 从根路径开始
    create_pages(CATEGORIES)


CLASSIC_COLORS = [
    'text-blue-500',      # 经典蓝
    'text-indigo-500',    # 靛蓝
    'text-purple-500',    # 紫色
    'text-pink-500',      # 粉色
    'text-rose-500',      # 玫瑰色
    'text-red-500',       # 红色
    'text-orange-500',    # 橙色
    'text-amber-500',     # 琥珀色
    'text-emerald-500',   # 翠绿
    'text-teal-500',      # 蓝绿
    'text-cyan-500',      # 青色
    'text-sky-500',       # 天蓝
]
ICONS = ['star','sync','tab','tabs','key','forest','rocket','cookie','hive','extension','api','anchor','favorite']


def create_category_card(category,path):
    with ui.link(target=path.rstrip('/') + category['path']).classes('w-64 no-underline'):
        with ui.card().classes('w-full cursor-pointer hover:shadow-lg transition-shadow flex justify-center items-center'): # 添加flex和居中类
            with ui.column().classes('w-full p-4 items-center text-center gap-2'): # 添加w-full, text-center和gap-2
                color = random.choice(CLASSIC_COLORS)
                icon = category['icon'] if 'icon' in category else random.choice(ICONS)
                ui.icon(icon, size='32px').classes(f'{color}')
                ui.label(category['name']).classes('text-lg font-bold')  # 移除mt-2因为已经用gap控制间距
                ui.label(category['desc']).classes('text-gray-500 text-sm  overflow-hidden text-ellipsis')


def create_categories(categories,path):
    with ui.row().classes('w-full justify-center p-4'):
        with ui.grid().classes('gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl'):
            for category in categories:
                create_category_card(category,path)


@ui.page('/log')
@with_header(title='log')
def log_page():
    ui.link('log','/logs/app.log')
    log_view = ui.log(max_lines=1000).style('height:90vh')
    def append(txt):
        if '| WARNING |' in txt:
            log_view.push(txt,classes='text-orange')
        elif '| ERROR |' in txt:
            log_view.push(txt,classes='text-red')
        else:
            log_view.push(txt)
    def handler(txt):
        append(txt)
    logs = log.full_log()
    for l in logs:
        append(l)
    log.on_new_log(handler)



