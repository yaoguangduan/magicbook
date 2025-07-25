import json
from xml.dom.minidom import parseString

import yaml
import xmltodict
import dicttoxml2
from typing import Union, Dict, Any


class FormatConverter:
    @staticmethod
    def json_to_xml(data: Union[str, Dict], root_name: str = 'root') -> str:
        """JSON转XML"""
        if isinstance(data, str):
            data = json.loads(data)
        xml = dicttoxml2.dicttoxml(data, custom_root=root_name, attr_type=False,fold_list=False)
        d_xml =  xml.decode('utf-8')
        dom = parseString(d_xml)
        pretty_xml = dom.toprettyxml(indent='  ')
        return pretty_xml

    @staticmethod
    def xml_to_json(data: str) -> str:
        """XML转JSON"""
        data_dict = xmltodict.parse(data)
        return json.dumps(data_dict, indent=2, ensure_ascii=False)

    @staticmethod
    def json_to_yaml(data: Union[str, Dict]) -> str:
        """JSON转YAML"""
        if isinstance(data, str):
            data = json.loads(data)
        return yaml.dump(data, default_flow_style=False, allow_unicode=True)

    @staticmethod
    def yaml_to_json(data: Union[str, Dict]) -> str:
        """YAML转JSON"""
        if isinstance(data, str):
            data = yaml.safe_load(data)
        return json.dumps(data, indent=2, ensure_ascii=False)

    @staticmethod
    def xml_to_yaml(data: str) -> str:
        """XML转YAML"""
        json_data = FormatConverter.xml_to_json(data)
        return FormatConverter.json_to_yaml(json_data)

    @staticmethod
    def yaml_to_xml(data: Union[str, Dict], root_name: str = 'root') -> str:
        """YAML转XML"""
        json_data = FormatConverter.yaml_to_json(data)
        return FormatConverter.json_to_xml(json_data, root_name)


# 使用示例
converter = FormatConverter()

def do_convert(convert_model):
    val = convert_model['select']
    convert_model['error'] = ''
    frm = val.split(' -> ')[0]
    to = val.split(' -> ')[1]
    try:
        result = getattr(FormatConverter,f'{frm.lower()}_to_{to.lower()}')(convert_model['input'])
        convert_model['output'] = result
    except Exception as e:
        convert_model['error'] = f"{type(e).__name__}: {str(e)}"
