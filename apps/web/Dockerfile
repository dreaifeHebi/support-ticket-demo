FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY packages packages
COPY apps/web apps/web

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run typecheck -w apps/web
RUN npm run build -w apps/web

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start", "-w", "apps/web"]
