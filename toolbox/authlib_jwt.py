import base64

from authlib.jose import jwt
header = {'alg': 'HS256'}
payload = {'iss': 'Authlib', 'sub': '123'}
s = jwt.encode(header, payload, "private_key1")
print(s)