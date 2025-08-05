import asyncio
import functools
import multiprocessing
import os
import uuid
from concurrent.futures import ProcessPoolExecutor, Future, CancelledError
from queue import Empty
from typing import Callable, Any, NamedTuple, Union

from nicegui import ui, nicegui, context

from magicbook.common.log import logger

progress_queue = multiprocessing.Queue(maxsize=3000)

def init_worker(queue):
    """进程池初始化函数 - 只运行一次"""
    global progress_queue
    progress_queue = queue

executor = ProcessPoolExecutor(initializer=init_worker,initargs=(progress_queue,))

pid_msg = {}
def timer_proc():
    try:
        txt = progress_queue.get_nowait()
        logger.info(txt)
        tid = txt['id']
        if tid in procs:
            try:
                procs[tid](txt['msg'])
            except Exception as e:
                logger.error(e,exc_info=True)
    except Exception as e:
        if not isinstance(e, Empty):
            logger.error(e,exc_info=True)

procs = {}
def register_proc(tid,call):
    procs[tid] = call
def unregister_proc(tid):
    if tid in procs:
        del procs[tid]
def init():
    procs[""] = lambda txt:logger.info(txt)
    ui.timer(interval=0.1,callback=timer_proc)

def log_to_dialog(txt:str|float) -> None:
    tid = os.environ['id'] if 'id' in os.environ else ""
    logger.info(f"dialog {tid} {txt}")
    try:
        progress_queue.put_nowait({
            'id':tid,
            'msg':txt,
        })
    except Exception as e:
        logger.error(e)

def real_run_partial(ft:functools.partial,uid:str):
    os.environ['id'] = uid
    logger.info(f"set uid {uid}")
    try:
        return ft()
    except Exception as e:
        logger.error(e,exc_info=True)
        raise e

def log_exception(e):
    logger.error(f'run in process pool error:{type(e).__name__}: {str(e)}')

async def run_async(ft:functools.partial, dialog=True, on_exception=log_exception, err_notify=True, suc_notify=None, **cfg):
    dia = None
    tid = str(uuid.uuid4())
    try:
        if dialog:
            dia = ui.dialog().props('persistent').classes('elevation-2')
            with dia:
                with ui.column().classes('w-full items-center'):
                    ui.spinner(size="lg", color="#74d5ff")
                    lb = ui.label("running...").style('color: #74d5ff; font-size: 18px;').style('text-wrap: nowrap')
            dia.open()
            def msg_proc(msg):
                lb.set_text(msg)
            register_proc(tid,msg_proc)
        loop = asyncio.get_running_loop()
        ret = await loop.run_in_executor(executor, real_run_partial,ft,tid)
        if suc_notify is not None:
            ui.notify(suc_notify, position='top',type="positive",timeout=3000)
        return ret
    except Exception as e:
        if err_notify:
            ui.notify(f"{type(e).__name__}: {str(e)}", type="negative", position="top", timeout=3000)
        if on_exception is not None:
            on_exception(e)
        else:
            raise e
    finally:
        if dialog:
            dia.close()
            dia.delete()
            unregister_proc(tid)

class ProcessResult(NamedTuple):
    data:Any
    e: Union[BaseException, None]
    slot:Union[nicegui.Slot,None]
    def cancelled(self) -> bool:
        return isinstance(self.e, CancelledError)

def run_with_callback(ft:functools.partial, cb:Callable[[ProcessResult],None], dialog=True, **cfg):
    dia = None
    tid = str(uuid.uuid4())
    slot = context.slot
    try:
        if dialog:
            dia = ui.dialog().props('persistent').classes('elevation-2')
            with dia:
                with ui.column().classes('w-full items-center'):
                    ui.spinner(size="lg", color="#74d5ff")
                    lb = ui.label("running...").style('color: #74d5ff; font-size: 18px;').style('text-wrap: nowrap')
            dia.open()
            def msg_proc(msg):
                lb.set_text(msg)
            register_proc(tid,msg_proc)
        future = executor.submit(real_run_partial,ft,tid)
        def callback(f:Future):
            if dialog:
                dia.close()
                dia.delete()
                unregister_proc(tid)
            if f.cancelled():
                cb(ProcessResult(None,CancelledError(),slot))
            elif f.exception() is not None:
                cb(ProcessResult(None,f.exception(),slot))
            else:
                cb(ProcessResult(f.result(),None,slot))
        future.add_done_callback(callback)
    except Exception as e:
        cb(ProcessResult(None,e,slot))
