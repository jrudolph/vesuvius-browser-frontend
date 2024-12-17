FROM node:23 AS node-builder

WORKDIR /tmp/

COPY package.json /tmp/
COPY package-lock.json /tmp/

RUN npm install

COPY .git /tmp/.git
RUN git reset --hard HEAD

WORKDIR /tmp/

ARG BUILD_VERSION=latest
ENV VITE_BUILD_VERSION=$BUILD_VERSION
RUN VITE_BUILD_GIT_VERSION=`git rev-parse --short HEAD` VITE_BUILD_TIME=`date +%s000` npx vite build

FROM node:23 AS node-runner

RUN npm install -g serve
WORKDIR /app

COPY --from=node-builder ["/tmp/dist/", "!*.map", "/app/dist/"]
COPY --from=node-builder /tmp/dist/*js.map /maps

CMD ["serve", "-s", "dist"]
