import io
import time
import zipfile
import pandas as pd

from magicbook.common import process_pool
from magicbook.common.log import logger

ob_dl_fiter = True
def download_herbs_mole_targets_to_zip(value):
    herbs = []
    for line in value['herb_names'].strip().split('\n'):
        if line.strip() == '':
            continue
        for item in line.strip().split(','):
            if item.strip() == '':
                continue
            herbs.append(item.strip())
    if len(herbs) == 0:
        logger.error('请输入中药名称！')
    global ob_dl_fiter
    ob_dl_fiter = value['ob_dl_filter']
    return batch_query_and_save_herbs(herbs)


def queryHerbEnName(herb_name):
    """
    查询中药的英文名称

    参数:
        herb_name (str): 中药名称(中文)

    返回:
        str: 中药的英文名称(herb_en_name)，如果查询失败则返回None
    """
    if herb_name == '威灵仙':
        return 'Radix Clematidis'
    # 目标URL
    url = " https://tcmsp-gateway.91medicine.cn/gateway-search/search/tcmsp"

    # 请求头，包含鉴权信息
    headers = {
        "Authorization": "Bearer ONSH3X9szIj6W1RztYKzm1AuL_TIXP3ecQJfXDyfDzkJNnoQo_zE12Az2_RazhzycminuqmHXafeXoIYc8Yx96xHkoR3bSt3An0WB5_dbXz2CCpO-DLnDXcGVZya3N2w",
        "Content-Type": "application/json"
    }

    # 请求体数据
    data = {
        "searchType": "herb_name",
        "subSearchType": "",
        "queryWords": herb_name
    }

    try:
        # 发送POST请求
        response = requests.post(url, headers=headers, data=json.dumps(data))

        # 检查响应状态码
        if response.status_code == 200:
            # 解析JSON响应
            result = response.json()

            # 检查返回数据是否有效
            if result.get("code") == 0 and result.get("data"):
                # 获取第一个结果的herb_en_name
                herb_en_name = result["data"][0].get("herb_en_name")
                return herb_en_name
            else:
                logger.info(f"查询结果无效: {result}")
                return None
        else:
            logger.error(f"请求失败，状态码：{response.status_code}")
            logger.error(f"响应内容： {response.text}")
            return None

    except requests.exceptions.RequestException as e:
        logger.error(f"请求发生异常：{e}")
        return None


def query_herb_detail(query_words):
    """
    查询中药详细信息

    参数:
        query_words (str): 中药名称(英文或中文)

    返回:
        dict: 完整的API响应数据，如果查询失败则返回None
    """
    # 目标URL
    url = " https://tcmsp-gateway.91medicine.cn/gateway-search/search/tcmsp"

    # 请求头，包含鉴权信息
    headers = {
        "Authorization": "Bearer ONSH3X9szIj6W1RztYKzm1AuL_TIXP3ecQJfXDyfDzkJNnoQo_zE12Az2_RazhzycminuqmHXafeXoIYc8Yx96xHkoR3bSt3An0WB5_dbXz2CCpO-DLnDXcGVZya3N2w",
        "Content-Type": "application/json"
    }

    # 请求体数据
    data = {
        "searchType": "herb_name",
        "subSearchType": "herb_info",
        "queryWords": query_words
    }

    try:
        # 发送POST请求
        response = requests.post(url, headers=headers, data=json.dumps(data))

        # 检查响应状态码
        if response.status_code == 200:
            # 解析JSON响应
            result = response.json()

            # 检查返回数据是否有效
            if result.get("code") == 0:
                return result
            else:
                logger.info(f"查询结果无效: {result}")
                return None
        else:
            logger.info(f"请求失败，状态码：{response.status_code}")
            return None

    except requests.exceptions.RequestException as e:
        logger.info(f"请求发生异常：{e}")
        return None


def filter_molecules(molecules_list):
    """
    过滤molecules列表，只保留ob >= 30且dl >= 0.18的记录

    参数:
        molecules_list (list): 原始molecules数据列表

    返回:
        list: 过滤后的molecules数据列表
    """
    filtered_list = []
    for item in molecules_list:
        try:
            ob = float(item.get('ob', 0))
            dl = float(item.get('dl', 0))
            if ob >= 30 and dl >= 0.18:
                filtered_list.append(item)
        except (ValueError, TypeError):
            # 如果ob或dl不是数字，跳过该记录
            continue
    return filtered_list


def filter_targets(targets, molecule_names):
    filtered = []
    for item in targets:
        if item['molecule_name'] in molecule_names:
            filtered.append(item)
    return filtered


def save_herb_detail(detail_data, file_name):
    """
    将中药详细信息保存为Excel文件

    参数:
        detail_data (dict): 从query_herb_detail函数获取的详细数据
        file_name (str): 要保存的Excel文件名(不带扩展名)
    """
    if not detail_data or 'data' not in detail_data:
        logger.error("无效的详细数据，无法保存")
        return False

    data = detail_data['data']

    # 检查是否有targets和molecules数据
    if 'targets' not in data or 'molecules' not in data:
        logger.warn("详细数据中缺少targets或molecules信息")
        return False

    try:
        # 在内存中创建Excel
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            # 处理molecules数据
            if data['molecules']:
                filtered_molecules = data['molecules'] if not ob_dl_fiter else filter_molecules(data['molecules'])
                if filtered_molecules:
                    molecules_df = pd.DataFrame(filtered_molecules)
                    molecules_df.to_excel(writer, sheet_name='molecules', index=False)
                else:
                    logger.warn(f"警告: {file_name}的molecules数据经过滤后无有效记录")
                    pd.DataFrame().to_excel(writer, sheet_name='molecules', index=False)

                # 处理targets数据
                if data['targets']:
                    filtered_targets = filter_targets(data['targets'],
                                                   list(map(lambda x: x['molecule_name'], filtered_molecules)))
                    if filtered_targets:
                        targets_df = pd.DataFrame(filtered_targets)
                        targets_df.to_excel(writer, sheet_name='targets', index=False)
        logger.info(f"数据已成功保存 {file_name}.xlsx")

        return {
            'value': excel_buffer.getvalue(),
            'file_name': f"{file_name}.xlsx",
            'media_type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }

    except Exception as ee:
        logger.info(f"保存Excel文件时出错: {ee}")
        return False



# 要查询的中药列表
herb_list = [
    "麻黄", "黄芪", "川芎", "牛膝", "补骨脂", "茯苓", "威灵仙", "蜈蚣", "甘草",
    "百合", "甘草", "淮小麦", "大枣枚", "郁金", "合欢花", "佛手", "薄荷",
    "橘皮", "橘叶", "娑罗子", "当归", "柴胡", "党参", "白术", "炙刺猬皮",
    "半夏", "白芍", "枳壳", "泽泻", "防风"
]


def batch_query_and_save_herbs(herb_list):
    """
    批量查询中药并保存详细信息到Excel

    参数:
        herb_list (list): 中药名称列表(中文)
    """
    failed_herbs = []  # 用于记录处理失败的药物名称

    zip_io = io.BytesIO()
    zipf = zipfile.ZipFile(zip_io,'w')
    for herb in herb_list:
        process_pool.log_to_dialog(f"\n正在处理: {herb}")

        # 1. 查询英文名称
        en_name =  queryHerbEnName(herb)
        if not en_name:
            logger.info(f"无法获取'{herb}'的英文名称，跳过此药物")
            failed_herbs.append(herb)
            continue

        logger.info(f"'{herb}'的英文名称是: {en_name}")

        # 2. 查询详细信息
        detail = query_herb_detail(en_name)
        if not detail:
            process_pool.log_to_dialog(f"无法获取'{en_name}'的详细信息，跳过此药物")
            failed_herbs.append(herb)
            continue

        # 3. 保存到Excel
        item = save_herb_detail(detail, herb)
        if not item:
            logger.error(f"保存'{herb}'的详细信息到Excel失败")
            failed_herbs.append(herb)
            continue
        zipf.writestr(item['file_name'], item['value'])

        # 避免请求过于频繁，添加短暂延迟
        time.sleep(1)

    # 打印处理失败的药物列表
    if failed_herbs:
        logger.error("\n以下药物处理失败:")
        for failed_herb in failed_herbs:
            logger.error(f"- {failed_herb}")
    else:
        logger.info("\n所有药物处理成功!")
    zipf.close()
    return zip_io.getvalue(), 'excels.zip'


# 执行批量查询和保存

if __name__ == "__main__":
    # 确保已安装所需库
    try:
        import requests
        import json
    except ImportError as e:
        logger.info(f"缺少必要的Python库: {e}")
        logger.info("请先安装: pip install requests pandas openpyxl")
        exit(1)

    logger.info("开始批量查询中药信息...")
    batch_query_and_save_herbs(herb_list)
    logger.info("\n所有药物处理完成!")

# 以下药物处理失败:
# - 补骨脂
# - 蜈蚣
# - 川百合
# - 炙甘草
# - 淮小麦
# - 大枣枚
# - 广郁金
# - 合欢花
# - 佛手片
# - 橘皮
# - 全当归
# - 炒白术
# - 炙刺猬皮
# - 法半夏
# - 炒白芍
# - 炒枳壳