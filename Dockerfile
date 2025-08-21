# 使用官方 Bun 镜像作为基础镜像
FROM magicbook_base:latest

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 bun.lockb
COPY package.json ./

# 安装依赖
RUN yarn install

# 复制源代码
COPY . .

# 构建应用（如果需要）
RUN bun run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["bun", "run", "dev"]