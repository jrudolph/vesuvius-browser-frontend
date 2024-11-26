FROM node:23 AS node-builder

WORKDIR /tmp/

COPY .git /tmp/.git
RUN git reset --hard HEAD

WORKDIR /tmp/

RUN npm install
RUN npx vite build

FROM node:23 AS node-runner

WORKDIR /app

COPY --from=node-builder /tmp/dist /app/dist

RUN npm install -g serve

CMD ["serve", "-s", "dist"]
