FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Prisma config requires a syntactically valid URL during client generation.
# No database connection is opened by prisma generate.
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fusionify_coffee_build
RUN npm run prisma:generate \
    && npm run build \
    && npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json

USER node
EXPOSE 3000

CMD ["node", "dist/main.js"]
