import logging
from datetime import timezone, timedelta, datetime
from enum import IntEnum
from logging.handlers import TimedRotatingFileHandler, QueueHandler, QueueListener
import sys
import os
# from queue import Queue
from multiprocessing import Queue

import nicegui.app.app
import watchfiles

log_queue = Queue(-1)
queue_listener = ""

home_dir = os.path.expanduser('~')

logdir = "logs"
logfile = f"{logdir}/app.log"
if not os.path.exists(logdir):
    os.makedirs(logdir, exist_ok=True)

def beijing_time_converter(timestamp):
    """时间转换器：转换为北京时间"""
    beijing_tz = timezone(timedelta(hours=8))
    dt = datetime.fromtimestamp(timestamp, tz=beijing_tz)
    return dt.timetuple()

def set_formatter():
    """设置日志格式化器"""
    fmt = "%(asctime)s.%(msecs)03d | %(levelname)s | PID:%(process)d | %(filename)s:%(lineno)d | %(funcName)s | %(message)s"
    date_fmt = "%Y-%m-%d %H:%M:%S"
    fmtt =  logging.Formatter(fmt, datefmt=date_fmt)
    fmtt.converter = beijing_time_converter
    return fmtt

def set_queue_handler():
    # 不要给QueueHandler重复设置formatter, 会引起重复嵌套
    handler = QueueHandler(log_queue)
    handler.setLevel(logging.INFO)
    return handler
def set_stream_handler(formatter: logging.Formatter):
    # 输出到控制台的日志处理器
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    handler.setFormatter(formatter)
    return handler

def set_timed_rotating_file_handler(formatter: logging.Formatter):
    # 输出到文件的日志处理器, 每天生成一个新文件, 最多保留10个文件
    handler = TimedRotatingFileHandler(logfile, when="midnight", backupCount=10, encoding="utf-8")
    handler.setLevel(logging.INFO)
    handler.setFormatter(formatter)
    return handler

def close_log_queue():
    # 关闭队列监听器
    global queue_listener
    if queue_listener:
        queue_listener.stop()

def get_logger(level: int = logging.INFO):
    log = logging.getLogger()
    log.setLevel(level)

    formatter = set_formatter()

    stream_handler = set_stream_handler(formatter)
    file_handler = set_timed_rotating_file_handler(formatter)
    queue_handler = set_queue_handler()

    log.addHandler(queue_handler)

    global queue_listener
    if not queue_listener:
        queue_listener = QueueListener(log_queue, stream_handler, file_handler, respect_handler_level=True)
        queue_listener.start()

    return log


logger = get_logger()

log_items = []
def full_log():
    return log_items
log_handlers = []
def on_new_log(handler):
    log_handlers.append(handler)


def append_log(txt):
    global log_items
    if len(log_items) > 1000:
        log_items = log_items[-1000:]
    log_items.append(txt)
    for handler in log_handlers:
        handler(txt)

pos = int(0)
async def on_start():
    global pos
    async for changes in watchfiles.awatch(logfile):
        for change in changes:
            if change[0].value == 1:
                with open(logfile,encoding='utf-8') as f:
                    for line in f.readlines():
                        log_items.append(line)
            else:
                with open(logfile,encoding='utf-8') as f:
                    file_size = os.fstat(f.fileno()).st_size
                    if pos < file_size:
                        f.seek(pos)
                        new_content = f.read()
                        pos = f.tell()
                        if new_content:
                            lines = new_content.split('\n')

                            if not new_content.endswith('\n') and len(lines) > 1:
                                # 将不完整的最后一行回退
                                incomplete_line = lines[-1]
                                complete_lines = lines[:-1]
                                pos -= len(incomplete_line.encode('utf-8'))
                                for line in complete_lines:
                                    append_log(line)
                            else:
                                for line in lines:
                                    append_log(line)

nicegui.app.on_startup(on_start)

if __name__ == "__main__":
    logger.info("test")
    close_log_queue()
