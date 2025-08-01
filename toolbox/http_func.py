from datetime import datetime

import httpx
import logging
import httpx
import nicegui.elements.log
from nicegui import ui


class ListHandler(logging.Handler):
    def __init__(self,log):
        super().__init__()
        self.log = log
    def emit(self, record):
        log_entry = self.format(record)
        self.log.push(log_entry)


async def do_request(model,log:nicegui.elements.log.Log):
    try:
        log.clear()

        list_handler = ListHandler(log)
        formatter = logging.Formatter(
            "%(levelname)s [%(asctime)s] %(name)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        list_handler.setFormatter(formatter)

        logging.basicConfig(
            format="%(levelname)s [%(asctime)s] %(name)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
            level=logging.DEBUG,
            handlers=[list_handler]
        )
        model['ui_visible'] = True
        model['error'] = ''
        model['status'] = '-'
        model['invoke_cost'] = '- ms'
        model['invoke_time'] = '-'
        model['response'] = ''
        model['resp_header'] = ''
        model['resp_size'] = '- KB'
        settings = properties_to_json(model['settings'])
        params = properties_to_json(model['param'])
        ssl = 'ssl_verification' in settings and (settings['ssl_verification'] == 'true' or settings['ssl_verification'] == 'True')
        follow_redirects = 'follow_redirects' in settings and (settings['follow_redirects'] == 'true' or settings['follow_redirects'] == 'True')
        client = httpx.AsyncClient(verify=ssl)
        rsp = await client.request(model['method'],model['url'],
                                    content=model['body'],
                                   params=params,headers=properties_to_json(model['header']),
                                   timeout=float(settings['timeout'] if 'timeout' in settings else 5.0),
                                   follow_redirects=follow_redirects)
        model['response'] = rsp.text
        model['status'] = f'{rsp.status_code} {rsp.reason_phrase}'
        model['resp_header'] = json_to_properties(rsp.headers)
        model['invoke_cost'] = f'{(rsp.elapsed.total_seconds() * 1000):.3f}  ms'
        model['invoke_time'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        model['resp_size'] = f'{(len(rsp.content)/1000):.3f} KB'
    except Exception as e:
        logger.info(e)
        model['error'] = f"{type(e).__name__}: {str(e)}"
    finally:
        model['invoke_time'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        model['ui_visible'] = False



def properties_to_json(props: str):
    ret = {}
    for line in props.split("\n"):
        if line.strip() == "" or line.startswith("#") or ':' not in line:
            continue
        split = line.strip().split(":", 1)
        if len(split) != 2 or split[1].strip() == "":
            continue
        ret[split[0].strip()] = split[1].strip()
    return ret
def json_to_properties(props: dict[str, str]):
    lines = []
    for k, v in props.items():
        lines.append(f"{k}: {v}")
    return "\n".join(lines)

