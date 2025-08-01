import re
import json

import xmltodict
import yaml
from typing import Optional


def detect_format(content: str) -> str:
    """
    检测字符串可能是哪种格式

    Args:
        content: 要检测的字符串内容

    Returns:
        格式名称或空字符串
    """
    if not content or not isinstance(content, str):
        return ''

    content = content.strip()
    if not content:
        return ''

    # 1. 检测XML
    if is_xml(content):
        return 'XML'

    # 2. 检测JSON
    if is_json(content):
        return 'JSON'

    # 3. 检测YAML
    if is_yaml(content):
        return 'YAML'

    # 4. 检测HTML
    if is_html(content):
        return 'HTML'

    # 5. 检测Properties files
    if is_properties(content):
        return 'Properties files'

    # 6. 检测SQL
    if is_sql(content):
        return 'SQL'

    # 7. 检测JavaScript
    if is_javascript(content):
        return 'JavaScript'

    # 8. 检测TypeScript
    if is_typescript(content):
        return 'TypeScript'

    # 9. 检测Go
    if is_go(content):
        return 'Go'

    # 10. 检测Java
    if is_java(content):
        return 'Java'

    # 11. 检测Python
    if is_python(content):
        return 'Python'

    # 12. 检测Rust
    if is_rust(content):
        return 'Rust'

    return ''


def is_xml(content: str) -> bool:
    """检测是否是XML格式"""
    try:
        xmltodict.parse(content)
        return True
    except Exception:
        return False


def is_json(content: str) -> bool:
    """检测是否是JSON格式"""
    try:
        json.loads(content)
        return True
    except (json.JSONDecodeError, ValueError):
        return False


def is_yaml(content: str) -> bool:
    """检测是否是YAML格式"""
    try:
        yaml.safe_load(content)
        return True
    except (yaml.YAMLError, ValueError):
        return False


def is_html(content: str) -> bool:
    """检测是否是HTML格式"""
    html_patterns = [
        r'<!DOCTYPE\s+html',  # DOCTYPE声明
        r'<html[^>]*>',  # html标签
        r'<head[^>]*>',  # head标签
        r'<body[^>]*>',  # body标签
        r'<div[^>]*>',  # div标签
        r'<p[^>]*>',  # p标签
        r'<a[^>]*>',  # a标签
        r'<img[^>]*>',  # img标签
        r'<script[^>]*>',  # script标签
        r'<style[^>]*>',  # style标签
    ]

    for pattern in html_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            return True

    return False


def is_properties(content: str) -> bool:
    """检测是否是Properties文件格式"""
    lines = content.split('\n')
    property_count = 0
    total_lines = 0

    for line in lines:
        line = line.strip()
        if line and not line.startswith('#') and not line.startswith('!'):
            total_lines += 1
            # 检查键值对格式
            if re.match(r'^[^=:]+[=:]\s*.*$', line):
                property_count += 1

    # 如果大部分行都是键值对格式，认为是properties文件
    if total_lines > 0 and property_count / total_lines > 0.7:
        return True

    return False


def is_sql(content: str) -> bool:
    """检测是否是SQL格式"""
    sql_keywords = [
        r'\bSELECT\b', r'\bFROM\b', r'\bWHERE\b', r'\bINSERT\b', r'\bUPDATE\b',
        r'\bDELETE\b', r'\bCREATE\b', r'\bDROP\b', r'\bALTER\b', r'\bTABLE\b',
        r'\bDATABASE\b', r'\bINDEX\b', r'\bVIEW\b', r'\bJOIN\b', r'\bLEFT\b',
        r'\bRIGHT\b', r'\bINNER\b', r'\bOUTER\b', r'\bGROUP\b', r'\bBY\b',
        r'\bORDER\b', r'\bHAVING\b', r'\bUNION\b', r'\bDISTINCT\b', r'\bCOUNT\b',
        r'\bSUM\b', r'\bAVG\b', r'\bMAX\b', r'\bMIN\b'
    ]

    keyword_count = 0
    for keyword in sql_keywords:
        if re.search(keyword, content, re.IGNORECASE):
            keyword_count += 1

    # 如果包含多个SQL关键字，认为是SQL
    if keyword_count >= 2:
        return True

    return False


def is_javascript(content: str) -> bool:
    """检测是否是JavaScript格式"""
    js_patterns = [
        r'\bfunction\s+\w+\s*\(',  # 函数声明
        r'\bvar\s+\w+',  # var声明
        r'\blet\s+\w+',  # let声明
        r'\bconst\s+\w+',  # const声明
        r'\bif\s*\(',  # if语句
        r'\bfor\s*\(',  # for循环
        r'\bwhile\s*\(',  # while循环
        r'\breturn\b',  # return语句
        r'console\.log',  # console.log
        r'\.addEventListener',  # 事件监听
        r'\.getElementById',  # DOM操作
        r'\.querySelector',  # DOM查询
    ]

    pattern_count = 0
    for pattern in js_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            pattern_count += 1

    if pattern_count >= 2:
        return True

    return False


def is_typescript(content: str) -> bool:
    """检测是否是TypeScript格式"""
    # TypeScript包含JavaScript的所有特征，加上类型注解
    ts_patterns = [
        r':\s*\w+',  # 类型注解
        r'\binterface\s+\w+',  # 接口声明
        r'\btype\s+\w+',  # 类型别名
        r'\benum\s+\w+',  # 枚举声明
        r'\bnamespace\s+\w+',  # 命名空间
        r'\bimport\s+.*\bfrom\b',  # ES6导入
        r'\bexport\b',  # 导出
        r'<[^>]+>',  # 泛型
    ]

    # 先检查是否是JavaScript
    if not is_javascript(content):
        return False

    # 再检查TypeScript特有特征
    ts_count = 0
    for pattern in ts_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            ts_count += 1

    if ts_count >= 1:
        return True

    return False


def is_go(content: str) -> bool:
    """检测是否是Go格式"""
    go_patterns = [
        r'\bpackage\s+\w+',  # package声明
        r'\bimport\s*\(',  # import语句
        r'\bfunc\s+\w+',  # 函数声明
        r'\bvar\s+\w+',  # 变量声明
        r'\bconst\s+\w+',  # 常量声明
        r'\btype\s+\w+',  # 类型声明
        r'\bstruct\s+\w+',  # 结构体
        r'\binterface\s+\w+',  # 接口
        r'\bmap\[',  # map类型
        r'\bchan\s+\w+',  # channel
        r'\bgo\s+\w+',  # goroutine
        r'\bdefer\b',  # defer语句
        r'\bpanic\b',  # panic
        r'\brecover\b',  # recover
    ]

    pattern_count = 0
    for pattern in go_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            pattern_count += 1

    if pattern_count >= 2:
        return True

    return False


def is_java(content: str) -> bool:
    """检测是否是Java格式"""
    java_patterns = [
        r'\bpublic\s+class\s+\w+',  # 公共类
        r'\bprivate\s+\w+',  # 私有成员
        r'\bprotected\s+\w+',  # 保护成员
        r'\bstatic\s+\w+',  # 静态成员
        r'\bfinal\s+\w+',  # final关键字
        r'\babstract\s+\w+',  # 抽象
        r'\binterface\s+\w+',  # 接口
        r'\benum\s+\w+',  # 枚举
        r'\bthrows\s+\w+',  # 异常声明
        r'\btry\s*\{',  # try块
        r'\bcatch\s*\(',  # catch块
        r'\bfinally\s*\{',  # finally块
        r'\bnew\s+\w+',  # 对象创建
        r'\.length',  # 数组长度
        r'System\.out\.println',  # 输出
    ]

    pattern_count = 0
    for pattern in java_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            pattern_count += 1

    if pattern_count >= 2:
        return True

    return False


def is_python(content: str) -> bool:
    """检测是否是Python格式"""
    python_patterns = [
        r'\bdef\s+\w+\s*\(',  # 函数定义
        r'\bclass\s+\w+',  # 类定义
        r'\bimport\s+\w+',  # import语句
        r'\bfrom\s+\w+\s+import',  # from import
        r'\bif\s+__name__\s*==\s*[\'"]__main__[\'"]',  # main检查
        r'\bprint\s*\(',  # print函数
        r'\blen\s*\(',  # len函数
        r'\brange\s*\(',  # range函数
        r'\blist\s*\(',  # list函数
        r'\bdict\s*\(',  # dict函数
        r'\bset\s*\(',  # set函数
        r'\btuple\s*\(',  # tuple函数
        r'\bstr\s*\(',  # str函数
        r'\bint\s*\(',  # int函数
        r'\bfloat\s*\(',  # float函数
        r'\bTrue\b',  # True
        r'\bFalse\b',  # False
        r'\bNone\b',  # None
        r'\bself\b',  # self
        r'\breturn\b',  # return
        r'\bpass\b',  # pass
        r'\bbreak\b',  # break
        r'\bcontinue\b',  # continue
        r'\braise\b',  # raise
        r'\btry\b',  # try
        r'\bexcept\b',  # except
        r'\bfinally\b',  # finally
        r'\bwith\b',  # with
        r'\bas\b',  # as
        r'\blambda\b',  # lambda
        r'\byield\b',  # yield
        r'\bglobal\b',  # global
        r'\bnonlocal\b',  # nonlocal
    ]

    pattern_count = 0
    for pattern in python_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            pattern_count += 1

    if pattern_count >= 3:
        return True

    return False


def is_rust(content: str) -> bool:
    """检测是否是Rust格式"""
    rust_patterns = [
        r'\bfn\s+\w+',  # 函数定义
        r'\bstruct\s+\w+',  # 结构体
        r'\benum\s+\w+',  # 枚举
        r'\btrait\s+\w+',  # trait
        r'\bimpl\s+\w+',  # impl块
        r'\buse\s+\w+',  # use语句
        r'\bmod\s+\w+',  # mod声明
        r'\bpub\s+\w+',  # pub关键字
        r'\blet\s+\w+',  # let声明
        r'\bmut\s+\w+',  # mut关键字
        r'\bref\s+\w+',  # ref关键字
        r'\bBox<',  # Box类型
        r'\bVec<',  # Vec类型
        r'\bString::',  # String方法
        r'\bprintln!',  # println宏
        r'\bvec!',  # vec宏
        r'\bvec!\[',  # vec宏
        r'\bpanic!',  # panic宏
        r'\bassert!',  # assert宏
        r'\bResult<',  # Result类型
        r'\bOption<',  # Option类型
        r'\bSome\s*\(',  # Some
        r'\bNone',  # None
        r'\bOk\s*\(',  # Ok
        r'\bErr\s*\(',  # Err
        r'\bmatch\s+\w+',  # match语句
        r'\bif\s+let',  # if let
        r'\bwhile\s+let',  # while let
        r'\bfor\s+\w+\s+in',  # for循环
        r'\bunsafe\s*\{',  # unsafe块
        r'\bextern\s+\w+',  # extern
        r'\bstatic\s+\w+',  # static
        r'\bconst\s+\w+',  # const
        r'\btype\s+\w+',  # type别名
    ]

    pattern_count = 0
    for pattern in rust_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            pattern_count += 1

    if pattern_count >= 3:
        return True

    return False


# 测试函数
def test_detect_format():
    """测试格式检测函数"""
    test_cases = [
        # XML
        ('<?xml version="1.0"?><root><item>test</item></root>', 'XML'),
        ('<html><head><title>Test</title></head><body>Hello</body></html>', 'HTML'),

        # JSON
        ('{"name": "test", "value": 123}', 'JSON'),
        ('[1, 2, 3, 4, 5]', 'JSON'),

        # YAML
        ('name: test\nvalue: 123\nitems:\n  - item1\n  - item2', 'YAML'),

        # Properties
        ('app.name=MyApp\napp.version=1.0.0\ndb.host=localhost', 'Properties files'),

        # SQL
        ('SELECT * FROM users WHERE id = 1', 'SQL'),
        ('CREATE TABLE users (id INT, name VARCHAR(50))', 'SQL'),

        # JavaScript
        ('function test() { console.log("Hello"); }', 'JavaScript'),
        ('const name = "test"; let value = 123;', 'JavaScript'),

        # TypeScript
        ('function test(name: string): void { console.log(name); }', 'TypeScript'),
        ('interface User { name: string; age: number; }', 'TypeScript'),

        # Go
        ('package main\nfunc main() { fmt.Println("Hello") }', 'Go'),
        ('type User struct { Name string; Age int }', 'Go'),

        # Java
        ('public class Test { public static void main(String[] args) { } }', 'Java'),
        ('private String name; public void setName(String name) { }', 'Java'),

        # Python
        ('def test(): logger.info("Hello")\nif __name__ == "__main__": test()', 'Python'),
        ('class Test:\n    def __init__(self):\n        self.name = "test"', 'Python'),

        # Rust
        ('fn main() { println!("Hello"); }', 'Rust'),
        ('struct User { name: String, age: u32 }', 'Rust'),

        # 空字符串
        ('', ''),
        ('   ', ''),

        # 无法识别的格式
        ('This is just plain text', ''),
    ]

    for content, expected in test_cases:
        result = detect_format(content)
        status = "✓" if result == expected else "✗"
        logger.info(f"{status} {expected:15} | {content[:50]}...")
        if result != expected:
            logger.info(f"    Expected: {expected}, Got: {result}")


if __name__ == "__main__":
    s = '''{
  "slideshow": {
    "author": "Yours Truly", 
    "date": "date of publication", 
    "slides": [
      {
        "title": "Wake up to WonderWidgets!", 
        "type": "all"
      }, 
      {
        "items": [ 
          "Why <em>WonderWidgets</em> are great", 
          "Who <em>buys</em> WonderWidgets"
        ], 
        "title": "Overview", 
        "type": "all"
      }
    ], 
    "title": "Sample Slide Show"
  }
}
'''
    logger.info(detect_format(s))