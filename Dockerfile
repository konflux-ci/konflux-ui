FROM registry.access.redhat.com/ubi9/nodejs-24@sha256:f4d08605ea8f87b27fc83af509e5e38f18f7ef72928826594d0373261d55c4e3 AS builder

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

FROM registry.access.redhat.com/ubi9/nginx-120@sha256:d1058ad0b51b68f18638ea2a63381148cbc80ef8767fa9281911008767b0d156

COPY --from=builder /opt/app-root/src/dist/* /opt/app-root/src/

USER 0
# Disable IPv6 since it's not enabled on all systems
RUN sed -i '/\s*listen\s*\[::\]:8080 default_server;/d' /etc/nginx/nginx.conf
USER 1001

CMD ["nginx", "-g", "daemon off;"]
