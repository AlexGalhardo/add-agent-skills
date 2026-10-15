# Image used to record docs/demo.gif with VHS. See scripts/demo/demo.tape.
FROM node:22.21.0-bookworm-slim AS node

FROM ghcr.io/charmbracelet/vhs:v0.12.1
COPY --from=node /usr/local/bin/node /usr/local/bin/node
# The demo types the published command; inside the image it runs the local build instead.
RUN printf '#!/bin/sh\nshift\nexec node /app/dist/cli.js "$@"\n' > /usr/local/bin/bunx && chmod +x /usr/local/bin/bunx
