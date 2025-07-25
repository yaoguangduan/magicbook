import bioinformatics
import toolbox

CATEGORIES = [
{
    'path':'/toolbox',
    'name':'工具箱',
    'desc':'excel、pdf、时间处理等',
    'categories':[
        {
            'path':'/json',
            'name':'JSON',
            'desc':'json格式化、压缩、编辑、校验和他她武器去维权',
            'creator':toolbox.json_ui
        },
        {
            'path':'/time',
            'name':'时间处理',
            'desc':'时间转换、处理、格式化',
            'creator':toolbox.time_ui
        },
        {
            'path':'/endecode',
            'name':'编解码',
            'desc':'base64/url/jwt编码/解码',
            'creator':toolbox.encode_decode_ui
        },
        {
            'path':'/convert',
            'name':'格式转换',
            'desc':'json/yaml/xml转换',
            'creator':toolbox.converter_ui
        },
        {
            'path': '/http_req',
            'name': 'HTTP请求',
            'desc': 'http请求模拟',
            'creator': toolbox.http_ui
        },
        {
            'path': '/pdf_proc',
            'name': 'PDF操作',
            'desc': '合并、拆分、转换',
            'creator': toolbox.pdf_ui
        }
    ]
},{
    'path': '/bioinformatics',
    'name': '生物信息',
    'desc': 'tcmsp等',
    'categories':[
        {
            'path':'/tcmsp_herbs_download',
            'name':'TCMSP下载药物成分靶点',
            'desc':'输入药物名称，下载药物对应的成分和靶点，带过滤',
            'creator':bioinformatics.tcmsp_download_herbs_mole_target_ui
        },{
            'path':'/molecule_targets_split',
            'name':'分割成分的targets',
            'desc':'上传excel，将1:n的成分靶点列表转换成1:1的excel',
            'creator':bioinformatics.split_molecule_targets_ui
        }
    ]
}]


