import urllib.parse


def encode_url(model):
    try:
        model['encoded'] = urllib.parse.quote(model['decoded'], safe=':/?=&')
    except Exception as e:
        logger.info(f"URL编码失败: {e}")
        model['error'] = f"{type(e).__name__}: {str(e)}"


def decode_url(model):
    try:
        model['decoded'] = urllib.parse.unquote(model['encoded'])
    except Exception as e:
        logger.info(f"URL解码失败: {e}")
        model['error'] = f"{type(e).__name__}: {str(e)}"
