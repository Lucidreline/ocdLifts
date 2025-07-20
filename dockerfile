# 1) Build the React app on ARMv7
FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

# Install build dependencies for node-sass
RUN apk add --no-cache python3 make g++

WORKDIR /app

# copy lockfile & install
COPY package.json package-lock.json ./
RUN npm ci

# copy source & build
COPY . .
RUN npm run build

# 2) Serve with nginx
FROM nginx:stable-alpine

# Remove the default config and add ours
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy in the built SPA
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80