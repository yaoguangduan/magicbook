from functools import wraps

from nicegui import background_tasks, events, ui

from magicbook.category import CATEGORIES

bind = False


def do_search(value):
    ret = []
    def search_category(categories,result,prefix):
        for category in categories:
            if str(value).lower() in category['name'].lower():
                result.append({
                    'url':prefix.rstrip('/') + category['path'],
                    'title':category['name'],
                    'content':category['desc'],
                    'format':'md',
                    'order':0
                })
            elif value.lower() in category['desc'].lower():
                result.append({
                    'url':prefix.rstrip('/') + category['path'],
                    'title':category['name'],
                    'content':category['desc'],
                    'format':'md',
                    'order':1
                })
            if 'categories' in category:
                search_category(category['categories'],result,prefix.rstrip('/') + category['path'])

    search_category(CATEGORIES,ret,'')
    return ret


class Search:
    def __init__(self) -> None:
        with ui.dialog() as self.dialog, ui.card().tight().classes('w-[800px] h-[600px]'):
            with ui.row().classes('w-full items-center px-4'):
                ui.icon('search', size='2em')
                ui.input(placeholder='Search documentation', on_change=self.handle_input) \
                    .classes('flex-grow').props('borderless autofocus')
                ui.button('ESC', on_click=self.dialog.close) \
                    .props('padding="2px 8px" outline size=sm color=grey-5').classes('shadow')
            ui.separator()
            self.results = ui.element('q-list').classes('w-full').props('separator')
        ui.keyboard(self.handle_keypress)

    def create_button(self) -> ui.link:
        return ui.link('搜索').on('click',handler=self.dialog.open).classes('no-underline text-white hover:text-white visited:text-white active:text-white py-1 px-3 font-bold rounded-lg transition-colors').style('font-size:16px;font-weight:500') \
            .tooltip('Press Ctrl+K or / to search the documentation')

    def handle_keypress(self, e: events.KeyEventArguments) -> None:
        if not e.action.keydown:
            return
        if e.key == '/':
            self.dialog.open()
        if e.key == 'k' and (e.modifiers.ctrl or e.modifiers.meta):
            self.dialog.open()

    def handle_input(self, e: events.ValueChangeEventArguments) -> None:
        async def handle_input() -> None:
            with self.results:
                self.results.clear()
                with ui.list().props('bordered separator'):
                        result_items = do_search(e.value)
                        if not result_items:
                            return
                        for result_item in result_items:
                            with ui.item().props('clickable'):
                                with ui.item_section():
                                    with ui.link(target=result_item['url']):
                                        ui.item_label(result_item['title'])
                                        with ui.item_label().props('caption'):
                                            intro = result_item['content'].split(':param')[0]
                                            if result_item['format'] == 'md':
                                                element = ui.markdown(intro)
                                            else:
                                                element = ui.label(intro)
                                            element.classes('text-grey')
        background_tasks.create_lazy(handle_input(), name='handle_search_input')

    def open_url(self, url: str) -> None:
        ui.run_javascript(f'''
            const url = "{url}"
            if (url.startsWith("http"))
                window.open(url, "_blank");
            else
                window.location.href = url;
        ''')
        self.dialog.close()


def create_header(title=''):
    ui.page_title(title)
    with ui.header().classes('shadow-sm h-14 items-center flex'):
        with ui.row().classes('w-full') as row:
            # 左侧：返回主页的按钮/链接
            ui.link( text='主页', target='/').classes('no-underline text-white hover:text-white visited:text-white active:text-white py-1 px-3 font-bold rounded-lg transition-colors').style('font-size:16px;font-weight:500')
            ui.link(text='日志', target='/log').classes(
                'no-underline text-white hover:text-white visited:text-white active:text-white py-1 px-3 font-bold rounded-lg transition-colors').style('font-size:16px;font-weight:500')
            ui.space()
            search = Search()
            search.create_button()


class Header:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # 确保初始化代码只运行一次
        self.header_element = None
        if not Header._initialized:
            self.keyboard = None
            Header._initialized = True

    def create(self, title=''):
        if not hasattr(self, 'header_element'):
            ui.page_title(title)
            with ui.header().classes('shadow-sm h-14') as header:
                self.header_element = header
                with ui.element() as row:
                    ui.link(text='主页', target='/').classes(
                        'no-underline text-white hover:text-white visited:text-white active:text-white py-1 px-3 font-bold rounded-lg transition-colors text-lg')
                    ui.link(text='日志', target='/log').classes(
                        'no-underline text-white hover:text-white visited:text-white active:text-white py-1 px-3 font-bold rounded-lg transition-colors text-lg')

                    search = Search()
                    search.create_button()

                # 只注册一次keyboard
                if self.keyboard is None:
                    self.keyboard = ui.keyboard(on_key=self.handle_key)

        return self.header_element

    def handle_key(self, e):
        # 键盘事件处理逻辑
        pass


# 创建全局header实例
header = Header()


def with_header(title=''):
    def decrate(func):
        @wraps(func)
        def wrap(*args, **kwargs):
            create_header(title)
            func(*args, **kwargs)
        return wrap
    return decrate
