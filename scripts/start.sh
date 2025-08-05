pip install uv -i https://pypi.tuna.tsinghua.edu.cn/simple/
uv python pin /usr/local/bin/python3.12
uv venv --clear
uv run  --link-mode=copy -m magicbook.main