#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PyJWT 所有算法演示
支持算法：HS256, HS384, HS512, RS256, RS384, RS512, ES256, ES256K, ES384, ES512, PS256, PS384, PS512, EdDSA, none
"""
import base64
import json
import jwt

algos = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES256K', 'ES384', 'ES512', 'PS256', 'PS384', 'PS512', 'EdDSA']


def decode_with_signature_extraction(token, algorithm):
    """解码并提取signature信息"""
    print(f"\n=== {algorithm} Signature 提取 ===")
    parts = token.split('.')
    print(parts)
    if len(parts) != 3:
        raise Exception('无效的JWT格式!')

    header_b64, payload_b64, signature_b64 = parts

    # 解码header
    header_padding = '=' * (4 - len(header_b64) % 4)
    header_bytes = base64.urlsafe_b64decode(header_b64 + header_padding)
    header = json.loads(header_bytes.decode('utf-8'))

    # 解码payload
    payload_padding = '=' * (4 - len(payload_b64) % 4)
    payload_bytes = base64.urlsafe_b64decode(payload_b64 + payload_padding)
    payload = json.loads(payload_bytes.decode('utf-8'))

    print(f"Header: {header}")
    print(f"Payload: {payload}")
    print(f"Signature (base64): {signature_b64}")
    return {
        'header': header,
        'payload': payload
    }
def jwt_decode(jwt_model):
    try:
        jwt_model['error'] = ''
        algo = jwt_model['algo']
        decoded = decode_with_signature_extraction(jwt_model['encoded'],algo)
        jwt_model['body'] = json.dumps(decoded['payload'],indent=4)
        jwt_model['header'] = json.dumps(decoded['header'],indent=4)
        if 'alg' in decoded['header'] and decoded['header']['alg']  in algos:
            jwt_model['algo'] = decoded['header']['alg']
    except Exception as e:
        print(e)
        jwt_model['error'] = f"{type(e).__name__}: {str(e)}"
def jwt_encode(jwt_model):
    try:
        jwt_model['error'] = ''
        pl = json.loads(jwt_model['body'])
        if jwt_model['algo'].startswith('HS'):
            jwt_model['encoded'] = jwt.encode(pl, key=jwt_model['signature'], algorithm=jwt_model['algo'])
        else:
            jwt_model['encoded'] = jwt.encode(pl, key=jwt_model['pri'], algorithm=jwt_model['algo'])
    except Exception as e:
        jwt_model['error'] = f"{type(e).__name__}: {str(e)}"

def jwt_verify(jwt_model):
    try:
        jwt_model['error'] = ''
        if jwt_model['algo'].startswith('HS'):
            jwt.decode(jwt_model['encoded'], key=jwt_model['signature'], algorithms=[jwt_model['algo']],verify=True)
        else:
            ret = jwt.decode(jwt_model['encoded'], key=jwt_model['pub'], algorithms=[jwt_model['algo']],verify=True)
            print(ret)
    except Exception as e:
        jwt_model['error'] = f"{type(e).__name__}: {str(e)}"