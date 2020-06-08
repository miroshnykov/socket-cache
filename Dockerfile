FROM ubuntu:18.04
ARG node_version=12.16.1

COPY tests/run_docker_tests.sh /usr/local/bin/run_docker_tests.sh
RUN rm -rf /var/lib/apt/lists/*

RUN apt-get update
RUN apt-get install \
    build-essential \
    apt-transport-https \
    lsb-release \
    ca-certificates \
    curl \
    wget \
    python -y \
    redis-server

RUN curl --silent --location https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install --yes nodejs

WORKDIR /home/app
COPY . .
RUN npm install

EXPOSE 8091

ENTRYPOINT redis-server --daemonize yes && npm start
