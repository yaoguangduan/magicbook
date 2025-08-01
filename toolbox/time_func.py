from datetime import datetime

from dateutil import parser
from nicegui import binding
from common import log


class TimeModel:
    timestamp = binding.BindableProperty()
    time_formatted = binding.BindableProperty()
    time_str = binding.BindableProperty()
    timestamp_converted = binding.BindableProperty()
    def __init__(self):
        self.timestamp = ''
        self.time_formatted = ''
        self.time_str = ''
        self.timestamp_converted = ''

def convert_timestamp_to_formatted(time_data):
    try:
        timestamp = float(time_data.timestamp)
        # 根据字符串长度判断
        if len(time_data.timestamp) == 10:
            # 10位数字，秒时间戳
            dt = datetime.fromtimestamp(timestamp)
        elif len(time_data.timestamp) == 13:
            # 13位数字，毫秒时间戳
            dt = datetime.fromtimestamp(timestamp / 1000)
        elif len(time_data.timestamp) == 16:
            # 16位数字，微秒时间戳
            dt = datetime.fromtimestamp(timestamp / 1000000)
        else:
            # 其他长度，尝试作为秒处理
            dt = datetime.fromtimestamp(timestamp)
        formatted = dt.strftime('%Y-%m-%d %H:%M:%S.%f')[0:-3]
        time_data.time_formatted = formatted
    except Exception as e:
        log.error(e)
        time_data.time_formatted = str(e)
def convert_time_str_to_stamp(time_data):
    try :
        time_data.timestamp_converted = str(int(parser.parse(time_data.time_str).timestamp() * 1000))
    except Exception as e :
        log.error(e)
        time_data.timestamp_converted = str(e)