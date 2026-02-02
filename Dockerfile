FROM registry.access.redhat.com/ubi9/nodejs-20@sha256:938970e0012ddc784adda181ede5bc00a4dfda5e259ee4a57f67973720a565d1 as builder

WORKDIR  /opt/app-root/src
RUN npm install -g corepack && corepack enable

COPY @types @types
COPY public public
COPY src src
COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY webpack.config.js webpack.config.js
COPY webpack.prod.config.js webpack.prod.config.js 
COPY yarn.lock yarn.lock
COPY .swcrc .swcrc
COPY aliases.config.js aliases.config.js
COPY .yarnrc.yml .yarnrc.yml

RUN yarn install --immutable
RUN yarn build

FROM registry.access.redhat.com/ubi9/nginx-120@sha256:c5fdf1b976571cf1f058b8f2dd955a94d80ced7a43756362d7e87d99e9c92337

COPY --from=builder /opt/app-root/src/dist/* /opt/app-root/src/

USER 0
# Disable IPv6 since it's not enabled on all systems
RUN sed -i '/\s*listen\s*\[::\]:8080 default_server;/d' /etc/nginx/nginx.conf
USER 1001

CMD ["nginx", "-g", "daemon off;"]
