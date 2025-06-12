FROM registry.access.redhat.com/ubi9/nodejs-20@sha256:8d8ab723e421f7303b51de36317a5632e7b161a016cd76a214f993124c5b1a95 as builder

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
COPY aliases.config.js aliases.config.js

RUN yarn install
RUN yarn build

FROM registry.access.redhat.com/ubi9/nginx-120@sha256:7780f65bb941e76560b5f6870d2bb1f6c65305c6ef56e573ed6dfafe61ded3ef

COPY --from=builder /opt/app-root/src/dist/* /opt/app-root/src/

USER 0
# Disable IPv6 since it's not enabled on all systems
RUN sed -i '/\s*listen\s*\[::\]:8080 default_server;/d' /etc/nginx/nginx.conf
USER 1001

CMD ["nginx", "-g", "daemon off;"]
