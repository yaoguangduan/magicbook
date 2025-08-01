import functools
import random
import time
import uuid

from nicegui import ui
from nicegui.events import ValueChangeEventArguments

from common import process_pool
from common.log import logger
from common.txt_type_detect import detect_format
from toolbox import base64_func
from toolbox.base64_func import Base64Utils, encode_content, decode_content, encode_file_content, \
    decode_file_content, download_content
from toolbox.convert_func import do_convert
from toolbox.http_func import do_request
from toolbox.jwt_func import jwt_decode, jwt_encode, algos, jwt_verify
from toolbox.pdf_func import after_uploaded, merge_checked_with_page_no, merge_all, encrypt_pdf, decrypt_pdf, compress_pdf, convert_checked_to_png, add_watermark
from toolbox.time_func import TimeModel, convert_timestamp_to_formatted, convert_time_str_to_stamp
from toolbox.url_func import decode_url, encode_url
from .json_ui import json_ui
from .time_view import time_ui
from .endecode_view import encode_decode_ui
from .convert_view import converter_ui
from .pdf_view import pdf_ui
from .http_view import http_ui
