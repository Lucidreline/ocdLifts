# syntax=docker/dockerfile:1.4

###############################################################################
# 1) Builder image: compile your React / Vite app + inject prod env variables #
###############################################################################

FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

# needed by some dependencies (e.g. node‑sass)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 1) copy just lockfiles -> install deps
COPY package.json package-lock.json ./
RUN npm ci

# 2) pull in your secret .env.production as a BuildKit secret
#    (make sure you have set ENV_PRODUCTION_CONTENT in your repo’s secrets)
RUN --mount=type=secret,id=prod_env \
    tee .env.production < /run/secrets/prod_env

# 3) copy the rest of your source & build
COPY . .
RUN npm run build


###############################################################################
# 2) Production image: serve the built SPA with nginx                         #
###############################################################################

FROM nginx:alpine

# swap in your custom nginx.conf (must handle SPA history‑mode, etc.)
RUN rm /etc/nginx/conf.d/default.conf

# copy built artifacts from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
