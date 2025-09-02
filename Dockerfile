FROM node:24-alpine

RUN npm install -g bun --force
ENV PATH="/root/.bun/bin:$PATH"

RUN npm config set registry https://registry.npmmirror.com

# Bun 镜像源设置（正确的环境变量）
ENV BUN_INSTALL_REGISTRY=https://registry.npmmirror.com

WORKDIR /app

CMD ["sh"]