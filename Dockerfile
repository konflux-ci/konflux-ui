FROM registry.access.redhat.com/ubi9/nodejs-20@sha256:4ae9da9fa205acc4e889e077415155119db6f2eecb6dfba63cdbc2c4f802a7b6 as builder

WORKDIR  /opt/app-root/src
RUN npm install yarn --global

COPY @types @types
COPY public public
COPY src src
COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY webpack.config.js webpack.config.js
COPY webpack.prod.config.js webpack.prod.config.js 
COPY yarn.lock yarn.lock
COPY .swcrc .swcrc

RUN yarn install
RUN yarn build

FROM registry.access.redhat.com/ubi9/nginx-120@sha256:9d691cf9d357a9010d73b3e4487508d7803083a8370187562dad22b8183981d9

COPY --from=builder /opt/app-root/src/dist/* /opt/app-root/src/

USER 0
# Disable IPv6 since it's not enabled on all systems
RUN sed -i '/\s*listen\s*\[::\]:8080 default_server;/d' /etc/nginx/nginx.conf
USER 1001

CMD ["nginx", "-g", "daemon off;"]
