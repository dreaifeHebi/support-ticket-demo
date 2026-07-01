FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY prisma prisma
COPY packages packages
COPY apps/api apps/api

RUN npx prisma generate
RUN npm run typecheck -w apps/api

ENV NODE_ENV=production
EXPOSE 4000

CMD ["npm", "run", "start", "-w", "apps/api"]
