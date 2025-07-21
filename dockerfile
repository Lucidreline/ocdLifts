# 1) Build the React app on ARMv7
FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

# install python3 / make / g++ for node-sass (if you need it)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# copy lockfile & install deps
COPY package.json package-lock.json ./
RUN npm ci

# bring in your production env file so Vite picks it up at build time
COPY .env.production .env.production

# copy all your source (including vite.config.js, src/, public/, etc.)
COPY . .

# do the Vite build (will embed those VITE_… vars into the static assets)
RUN npm run build

# 2) Serve with nginx
FROM nginx:stable-alpine

# remove the stock config & add yours (with your SPA try_files snippet)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ship the static build into nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
