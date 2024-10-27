#syntax=docker/dockerfile:1.4

# Dev image
FROM node:22.8.0-alpine AS frontend-dev
WORKDIR /app
COPY --link . /app/
RUN corepack enable
ENTRYPOINT yarn set version stable && yarn install && yarn dev --host

# Builder image
FROM node:22.8.0-alpine AS yarn_builder
COPY --link . /app/
WORKDIR /app
# RUN yarn set version stable
RUN yarn
RUN yarn build-only

# Caddy image
FROM caddy:2.8.4-alpine AS app_caddy
WORKDIR /srv/app
COPY --link .cloud/docker/conf/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=yarn_builder --link /app/dist /srv/app/dist/
