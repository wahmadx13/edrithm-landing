# Production image for the Edrithm landing site (ED-032; Ziad, 2026-11-22). Build from the repository root:
#   docker build -t edrithm-landing:<sha> --build-arg NEXT_PUBLIC_APP_URL=https://<app host> .
# NEXT_PUBLIC_APP_URL is compiled into the browser bundle (the "Sign in" link), so it's a build argument, never a secret.
# The landing site holds no credentials and calls no Edrithm API. Heavy (next build): only with an order slot from Greta
# and at least 1.5 GB free.
FROM node:24-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build && npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:24-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json /app/next.config.ts /app/middleware.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src
COPY --from=build /app/locales ./locales
RUN mkdir -p .next/cache && chown -R node:node .next/cache
USER node
EXPOSE 3001
# Loopback only, behind the TLS edge in the same network namespace (like the other web apps).
CMD ["node", "node_modules/next/dist/bin/next", "start", "--port", "3001", "--hostname", "127.0.0.1"]
