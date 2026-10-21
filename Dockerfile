# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=8787 \
    DATABASE_PATH=./server/data/scarlet.db
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
RUN mkdir -p /app/server/data/uploads && chown -R node:node /app/server/data
USER node
EXPOSE 8787
VOLUME ["/app/server/data"]
CMD ["npm", "start"]
