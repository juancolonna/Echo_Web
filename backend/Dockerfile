FROM node:22-alpine3.22 AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine3.22 AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json .
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 6677
CMD [ "npm", "run", "start:prod" ]

FROM node:22-alpine3.22 AS development
WORKDIR /app

ENV NODE_ENV=development
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 6677
CMD [ "npm", "start"]