import base64

from nicegui import ui

from common.download import download
from common.util import binary_to_bytes_display, bytes_display_to_binary, short_uuid


class Base64Utils:
    @staticmethod
    def encode_string(text: str,url_safe=False) -> str:
        """字符串编码"""

        return Base64Utils.encode_bytes(text.encode('utf-8'),url_safe).decode('utf-8')

    @staticmethod
    def decode_string(encoded_text: str,url_safe=False) -> str:
        """字符串解码"""
        if url_safe:
            return base64.urlsafe_b64decode(encoded_text).decode('utf-8')
        return base64.b64decode(encoded_text).decode('utf-8')

    @staticmethod
    def encode_bytes(data: bytes,url_safe=False) -> bytes:
        """字节编码"""
        if url_safe:
            return base64.urlsafe_b64encode(data)
        return base64.b64encode(data)

    @staticmethod
    def decode_bytes(encoded_data: bytes,url_safe=False) -> bytes:
        """字节解码"""
        if url_safe:
            return base64.urlsafe_b64decode(encoded_data)
        return base64.b64decode(encoded_data)


utils = Base64Utils()


def encode_content(base64_model):
    base64_model['warn'] = ''
    try:
        base64_model['output'] = utils.encode_string(base64_model['input'],base64_model['url_safe'])
    except Exception as e:
        base64_model['warn'] = f"{type(e).__name__}: {str(e)}"


def decode_content(base64_model):
    base64_model['warn'] = ''
    bytes_decoded = None
    try:
        bytes_decoded = utils.decode_bytes(base64_model['input'].encode('utf-8'), base64_model['url_safe'])
        base64_model['output'] = bytes_decoded.decode('utf-8')
    except UnicodeDecodeError as e:
        base64_model['output'] = binary_to_bytes_display(bytes_decoded)
        base64_model['warn'] = '解码后的数据为二进制，建议直接下载'
    except Exception as e:
        base64_model['warn'] = f"{type(e).__name__}: {str(e)}"


def encode_file_content(f,base64_model):
    base64_model['warn'] = ''
    try:
        base64_model['f_output'] = utils.encode_bytes(f.content.read(),base64_model['url_safe']).decode('utf-8')
    except Exception as e:
        base64_model['warn'] = f"{type(e).__name__}: {str(e)}"

def decode_file_content(f,base64_model):
    base64_model['warn'] = ''
    bytes_decoded = None
    try:
        bytes_decoded = utils.decode_bytes(f.content.read(), base64_model['url_safe'])
        base64_model['f_output'] = bytes_decoded.decode('utf-8')
    except UnicodeDecodeError as e:
        base64_model['f_output'] = binary_to_bytes_display(bytes_decoded)
        base64_model['warn'] = '解码后的数据为二进制，建议直接下载'
    except Exception as e:
        base64_model['warn'] = f"{type(e).__name__}: {str(e)}"

def download_content(content,base64_model):
    warn = base64_model['warn']
    if warn == '解码后的数据为二进制，建议直接下载':
        bys = bytes_display_to_binary(content)
        download(bys, filename=f'binary-{short_uuid()}.bin', media_type='application/octet-stream')
    else:
        download(content, filename=f'content-{short_uuid()}.txt', media_type='text/plain')