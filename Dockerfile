FROM registry.access.redhat.com/ubi9/nodejs-24@sha256:36af0bcb31021be93b0aab49e3ebcbbe07326496a550cface3294634fe7e6433 AS builder

# Run as root in builder stage (final image uses non-root USER 1001)
USER 0
WORKDIR /opt/app-root/src

# Copy bundled Yarn Berry (no corepack needed - avoids ESM compatibility issues)
COPY .yarn/releases .yarn/releases
COPY .yarnrc.yml .yarnrc.yml
COPY package.json package.json
COPY yarn.lock yarn.lock

# Create yarn wrapper script to enable 'yarn' command
# This delegates to the bundled, version-controlled yarn binary
RUN printf '#!/bin/sh\nexec node /opt/app-root/src/.yarn/releases/yarn-4.12.0.cjs "$@"\n' > /usr/local/bin/yarn && \
    chmod +x /usr/local/bin/yarn

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

FROM registry.access.redhat.com/ubi9/nginx-120@sha256:10d63fded799656ec1dab9888d6d8dccc7f5bcc65d6fd3e4762e529db17f846b

COPY --from=builder /opt/app-root/src/dist/* /opt/app-root/src/

USER 0
# Disable IPv6 since it's not enabled on all systems
RUN sed -i '/\s*listen\s*\[::\]:8080 default_server;/d' /etc/nginx/nginx.conf
USER 1001

CMD ["nginx", "-g", "daemon off;"]
