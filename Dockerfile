FROM registry.access.redhat.com/ubi9/nodejs-24@sha256:c4d7c5ca1a074827cf475c08bb2ec6c1803650af241afe4244bc2437a898ef65 AS builder

# Run as root in builder stage (final image uses non-root USER 1001)
USER 0
WORKDIR /opt/app-root/src

# Copy bundled Yarn Berry (no corepack needed - avoids ESM compatibility issues)
COPY .yarn/releases .yarn/releases
COPY .yarnrc.yml .yarnrc.yml
COPY package.json package.json
COPY yarn.lock yarn.lock

# Resolve the bundled Yarn Berry release at invocation time (not a hardcoded yarn-<version>.cjs).
# KONFLUX_YARN_RELEASES_DIR is not YARN_* so Yarn Berry does not treat it as a yarnrc setting.
COPY --chmod=755 scripts/container-yarn /usr/local/bin/yarn
ENV KONFLUX_YARN_RELEASES_DIR=/opt/app-root/src/.yarn/releases

# Copy source files
COPY @types @types
COPY public public
COPY src src
COPY tsconfig.json tsconfig.json
COPY webpack.config.js webpack.config.js
COPY webpack.prod.config.js webpack.prod.config.js
COPY .swcrc .swcrc
COPY aliases.config.js aliases.config.js

# Use yarn directly (wrapper delegates to bundled .cjs file)
RUN yarn install --immutable
RUN yarn build

FROM registry.access.redhat.com/ubi9/nginx-120@sha256:80e541051bfbe3b5908a40e52fcf63dba9c0be980d3d1361fd71aa7ca960e1a8

COPY --from=builder /opt/app-root/src/dist/* /opt/app-root/src/

USER 0
# Disable IPv6 since it's not enabled on all systems
RUN sed -i '/\s*listen\s*\[::\]:8080 default_server;/d' /etc/nginx/nginx.conf
USER 1001

CMD ["nginx", "-g", "daemon off;"]
