FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY prisma ./prisma
RUN pnpm exec prisma generate
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN pnpm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY prisma ./prisma
RUN pnpm exec prisma generate
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/main.js"]
