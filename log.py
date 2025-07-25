import queue
from queue import Queue

from nicegui import ui, Client

log_list = []
def log_pull_timer():
    for log in log_list:
        log.timer_proc()

def init():
    ui.timer(0.05, log_pull_timer)

class LeveledLog(ui.log):
    def __init__(self, max_lines=None):
        super().__init__(max_lines)
    def info(self,txt):
        self.push(txt)
    def success(self,txt):
        self.push(txt,classes='text-green')
    def warn(self,txt):
        self.push(txt,classes='text-orange')
    def error(self,txt):
        self.push(txt,classes='text-red')

class QueuedLog(ui.log):
    def __init__(self, max_lines=None):
        super().__init__(max_lines)
        self.queue = Queue()
        log_list.append(self)
        self.logs = []
    def timer_proc(self):
        try:
            message = self.queue.get(block=False)
            if message is not None and message['msg'] != '':
                self.push(message['msg'],classes=message['classes'])
        except queue.Empty:
            pass
    def info(self,txt):
        self.queue.put({'msg':txt,'classes':''})
    def success(self,txt):
        self.queue.put({'msg':txt,'classes':'text-green'})
    def warn(self,txt):
        self.queue.put({'msg':txt,'classes':'text-orange'})
    def error(self,txt):
        self.queue.put({'msg':txt,'classes':'text-red'})
    def clear(self):
        super().clear()
        self.logs = []

class PrintLog(ui.log):
    def info(self,txt):
        print(txt)
    def success(self,txt):
        print(txt)
    def warn(self,txt):
        print(txt)
    def error(self,txt):
        print(txt)


global_logs = {}


def on_connect(c: Client,log):
    global_logs[c.id] = log


def on_disconnect(c: Client):
    global global_logs
    del global_logs[c.id]


def info(txt):
    for global_log in global_logs.values():
        global_log.info(txt)


def success(txt):
    for global_log in global_logs.values():
        global_log.success(txt)


def warn(txt):
    for global_log in global_logs.values():
        global_log.warn(txt)


def error(txt):
    for global_log in global_logs.values():
        global_log.error(txt)
