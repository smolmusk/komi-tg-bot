FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=http://localhost:3001

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY src ./src
COPY index.html vite.config.ts tsconfig.json ./

ENV VITE_API_URL=$VITE_API_URL
RUN yarn build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
