FROM registry.access.redhat.com/ubi9/nodejs-20@sha256:89d0be288e9e76dc42bb2b1f76cd9cc619dde6e5e28c05cfeb3dcf4249b55450 AS builder

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

FROM registry.access.redhat.com/ubi9/nginx-120@sha256:c5fdf1b976571cf1f058b8f2dd955a94d80ced7a43756362d7e87d99e9c92337

COPY --from=builder /opt/app-root/src/dist/* /opt/app-root/src/

USER 0
# Disable IPv6 since it's not enabled on all systems
RUN sed -i '/\s*listen\s*\[::\]:8080 default_server;/d' /etc/nginx/nginx.conf
USER 1001

CMD ["nginx", "-g", "daemon off;"]
