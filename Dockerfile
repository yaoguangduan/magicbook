FROM magicbook_base:latest

WORKDIR /app

COPY package.json ./

RUN yarn install

COPY . .

RUN bun run build

EXPOSE 3000

# 启动应用
CMD ["bun", "run", "start"]