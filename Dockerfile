FROM registry.access.redhat.com/ubi9/nodejs-24@sha256:f4828e159e7e6099a66a3c5b87713b08885e3d76e3e40d0679ac4c15e1972c25 AS builder

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

FROM registry.access.redhat.com/ubi9/nginx-120@sha256:154529f16f9ddd9b5539ad5add955a35ed48d9d717904bb5b9b27dff685725b1

COPY --from=builder /opt/app-root/src/dist/* /opt/app-root/src/

USER 0
# Disable IPv6 since it's not enabled on all systems
RUN sed -i '/\s*listen\s*\[::\]:8080 default_server;/d' /etc/nginx/nginx.conf
USER 1001

CMD ["nginx", "-g", "daemon off;"]
