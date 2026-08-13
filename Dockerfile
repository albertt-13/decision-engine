# Repo propio, no monorepo (a diferencia de OrderFlow) - Dockerfile mas
# simple, un solo package.json.
FROM node:24-alpine AS base
WORKDIR /app
COPY tsconfig.json ./tsconfig.json
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS runtime
COPY . .
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 4100
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/server.ts"]
