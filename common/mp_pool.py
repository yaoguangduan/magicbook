from concurrent.futures import ProcessPoolExecutor, Future, CancelledError
from typing import Callable, Tuple, Any, Optional

from nicegui import ui, nicegui

executor = ProcessPoolExecutor(max_workers=4)


def submit(func,cb:Callable[[Tuple[Any,Optional[BaseException],nicegui.Slot]],None],*args,**kwargs):
    slot = None
    try:
        slot = ui.context.slot
        def callback(f:Future):
            cancelled = f.cancelled()
            if cancelled:
                cb((None, CancelledError(),slot))
            ee = f.exception()
            if ee:
                cb((None, ee,slot))
            else:
                cb((f.result(), None,slot))
        fu = executor.submit(func,*args,**kwargs)
        fu.add_done_callback(callback)
    except Exception as e:
        cb((None,e,slot))