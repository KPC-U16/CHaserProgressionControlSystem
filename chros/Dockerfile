# monorepo のルートを build context とする（docker-compose.yaml 参照）
FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY chros/package.json chros/
COPY packages/shared/package.json packages/shared/
COPY packages/scoring/package.json packages/scoring/
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter chros build

EXPOSE 3000
CMD ["pnpm", "--filter", "chros", "start"]
