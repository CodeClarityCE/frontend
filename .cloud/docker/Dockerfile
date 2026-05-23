#syntax=docker/dockerfile:1.4

ARG PNPM_VERSION=11.2.2

# Dev image
FROM node:26.2.0-alpine AS frontend-dev
WORKDIR /app
COPY --link . /app/
RUN npm install -g corepack@latest --force && corepack enable
RUN corepack prepare pnpm@${PNPM_VERSION} --activate
# Standalone install in /app. /app/pnpm-workspace.yaml (bind-mounted from
# frontend/pnpm-workspace.yaml on host) provides allowBuilds + minimumReleaseAge=0
# so this container does not need the repo-root workspace yaml.
ENTRYPOINT ["/bin/sh", "-c" , "pnpm install && pnpm run dev --host"]

# Builder image
FROM node:26.2.0-alpine AS pnpm_builder
RUN npm install -g corepack@latest --force && corepack enable
RUN corepack prepare pnpm@${PNPM_VERSION} --activate
ENV PNPM_STORE_DIR=/pnpm/store
COPY --link . /app/
WORKDIR /app
RUN --mount=type=cache,id=pnpm-store-frontend,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile
RUN pnpm --filter frontend build-only

# Caddy image
FROM caddy:2.11.3-alpine AS app_caddy
WORKDIR /srv/app
COPY --link .cloud/docker/conf/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=pnpm_builder --link /app/frontend/dist /srv/app/dist/
