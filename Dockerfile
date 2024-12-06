FROM node:23 AS node-builder

WORKDIR /tmp/

COPY package.json /tmp/
COPY package-lock.json /tmp/

RUN npm install

COPY .git /tmp/.git
RUN git reset --hard HEAD

WORKDIR /tmp/

RUN npx vite build

FROM node:23 AS node-runner

RUN npm install -g serve
WORKDIR /app

COPY --from=node-builder /tmp/dist /app/dist

CMD ["serve", "-s", "dist"]
