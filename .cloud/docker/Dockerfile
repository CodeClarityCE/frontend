#syntax=docker/dockerfile:1.4

ARG PNPM_VERSION=12.3.4

# Dev image
FROM node:26.8.1-alpine@sha256:2d984a15c9b54fd0aeb608b8e0d0d83529eb34d2966db27a1fb4f1edc3d298a3 AS frontend-dev
WORKDIR /app
COPY --link . /app/
RUN npm install -g corepack@latest --force && corepack enable
RUN corepack prepare pnpm@${PNPM_VERSION} --activate
# Standalone install in /app. /app/pnpm-workspace.yaml (bind-mounted from
# frontend/.cloud/docker/pnpm-workspace.yaml on host) provides allowBuilds +
# minimumReleaseAge=0 so this container does not need the repo-root workspace yaml.
ENTRYPOINT ["/bin/sh", "-c" , "pnpm install && pnpm run dev --host"]

# Builder image
FROM node:26.8.1-alpine@sha256:2d984a15c9b54fd0aeb608b8e0d0d83529eb34d2966db27a1fb4f1edc3d298a3 AS pnpm_builder
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
FROM caddy:2.11.4-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648 AS app_caddy
WORKDIR /srv/app
COPY --link .cloud/docker/conf/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=pnpm_builder --link /app/dist /srv/app/dist/
