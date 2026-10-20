FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production GHOSTCASE_DATA_DIR=/data
RUN useradd --system --uid 10001 ghostcase && mkdir /data && chown ghostcase:ghostcase /data
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER ghostcase
EXPOSE 8787
CMD ["node","dist/src/server.js"]
