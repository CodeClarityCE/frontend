#syntax=docker/dockerfile:1.4

ARG PNPM_VERSION=11.2.2

# Dev image
FROM node:26.2.0-alpine AS frontend-dev
WORKDIR /app
COPY --link . /app/
RUN npm install -g corepack@latest --force && corepack enable
RUN corepack prepare pnpm@${PNPM_VERSION} --activate
# Standalone install in /app. /app/pnpm-workspace.yaml (bind-mounted from
# frontend/.cloud/docker/pnpm-workspace.yaml on host) provides allowBuilds +
# minimumReleaseAge=0 so this container does not need the repo-root workspace yaml.
ENTRYPOINT ["/bin/sh", "-c" , "pnpm install && pnpm run dev --host"]

# Builder image
FROM node:26.2.0-alpine AS pnpm_builder
WORKDIR /app
RUN npm install -g corepack@latest --force && corepack enable
RUN corepack prepare pnpm@${PNPM_VERSION} --activate
ENV PNPM_STORE_DIR=/pnpm/store
COPY --link . /app/
# Stage the standalone pnpm config (allowBuilds + minimumReleaseAge=0).
# Source of truth is .cloud/docker/pnpm-workspace.yaml; this COPY makes the
# Dockerfile self-sufficient regardless of whether Jenkins pre-staged it.
COPY .cloud/docker/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN --mount=type=cache,id=pnpm-store-frontend,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile
# Build directly without --filter: standalone clone, not a workspace.
RUN pnpm run build-only

# Caddy image
FROM caddy:2.11.3-alpine AS app_caddy
WORKDIR /srv/app
COPY --link .cloud/docker/conf/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=pnpm_builder --link /app/dist /srv/app/dist/
