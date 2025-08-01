import time
from nicegui import run, ui

def compute_sum(a: float, b: float) -> float:
    time.sleep(1)  # simulate a long-running computation
    return a + b

async def handle_click():
    result = await run.cpu_bound(compute_sum, 1, 2)
    ui.notify(f'Sum is {result}')
logger.info("helo")
ui.button('Compute', on_click=handle_click)

ui.run()