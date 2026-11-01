#syntax=docker/dockerfile:1.4

# Toolchain image: pinned Node + corepack + the pnpm version from package.json's
# packageManager field (the single source of truth for pnpm). Jenkins runs its
# Setup/Test stages inside this target, so CI uses the same toolchain as the
# image build instead of whatever the agent host has installed. Corepack must be
# >= 0.34.5: pnpm >= 11 ships bin/pnpm.mjs and older corepack looks for pnpm.cjs.
FROM node:26.10.0-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS toolchain
ENV COREPACK_HOME=/opt/corepack \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app
RUN npm install -g corepack@0.36.0 --force && corepack enable
COPY package.json ./
# World-writable so the unprivileged Jenkins uid can use the cached pnpm.
RUN corepack install && chmod -R a+rwX /opt/corepack

# Dev image
FROM toolchain AS frontend-dev
COPY --link . /app/
# Standalone install in /app. /app/pnpm-workspace.yaml (bind-mounted from
# frontend/.cloud/docker/pnpm-workspace.yaml on host) provides allowBuilds and the
# minimumReleaseAge gate so this container does not need the repo-root workspace yaml.
ENTRYPOINT ["/bin/sh", "-c" , "pnpm install && pnpm run dev --host"]

# Builder image
FROM toolchain AS pnpm_builder
ENV PNPM_STORE_DIR=/pnpm/store
COPY --link . /app/
# Stage the standalone pnpm config (allowBuilds + minimumReleaseAge).
# Source of truth is .cloud/docker/pnpm-workspace.yaml; this COPY makes the
# Dockerfile self-sufficient regardless of whether Jenkins pre-staged it.
COPY .cloud/docker/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN --mount=type=cache,id=pnpm-store-frontend,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile
# Build directly without --filter: standalone clone, not a workspace.
RUN pnpm run build-only

# Caddy image
FROM caddy:2.11.4-alpine@sha256:6aeddd44c3078b0f9a35206472a11420648a79c184603ef95957d0a20044cb2b AS app_caddy
WORKDIR /srv/app
COPY --link .cloud/docker/conf/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=pnpm_builder --link /app/dist /srv/app/dist/
