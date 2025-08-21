docker build -f Dockerbase -t magicbook_base:latest
docker-compose up -d

docker build -f Dockerfile -t magocbook:latest
