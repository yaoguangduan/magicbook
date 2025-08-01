import uuid

from nicegui import ui


def ui_creator(func):
    return func


def copy_to_clipboard(txt,notify=False):
    try:
        logger.info(txt)
        # 使用document.execCommand，兼容所有环境
        js_code = f'''
        const text = `{txt}`;
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {{
            console.log('复制成功');
        }} else {{
            console.log('复制失败');
        }}
        '''
        ui.run_javascript(js_code)
        if notify:
            ui.notify('复制成功', position='top',type='positive')
    except Exception as e:
        if notify:
            ui.notify(f'复制失败: {str(e)}', position='top',type='negative')

def binary_to_bytes_display(binary_data):
    return ' '.join([f'{b:02x}' for b in binary_data])

def bytes_display_to_binary(display_string):
    # 去掉空格，然后转换
    hex_string = display_string.replace(' ', '')
    return bytes.fromhex(hex_string)


# 生成短UUID
def short_uuid():
    return str(uuid.uuid4()).replace('-', '')[:8]

