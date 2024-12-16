FROM registry.access.redhat.com/ubi9/nodejs-20@sha256:c7fdc40c06db3c26e2478a57387a4c171e5045ac3d9558fef7ed4a3295dcddb9 as builder

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

FROM registry.access.redhat.com/ubi9/nginx-120@sha256:334c2cd7e7cfe8cef09d289ec5a8f223e0ed9a8374f19895ea1592fbff2d2d1a

COPY --from=builder /opt/app-root/src/dist/* /opt/app-root/src/

USER 0
# Disable IPv6 since it's not enabled on all systems
RUN sed -i '/\s*listen\s*\[::\]:8080 default_server;/d' /etc/nginx/nginx.conf
USER 1001

CMD ["nginx", "-g", "daemon off;"]
