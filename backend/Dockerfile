FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json tsconfig.base.json ./

RUN yarn build

EXPOSE 3001

CMD ["node", "dist/main.js"]
