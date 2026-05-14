FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY tsconfig.json ./
COPY src/ ./src/

RUN npx tsc

ENV NODE_ENV=production
ENV PORT=3001
ENV DEMO_MODE=true

EXPOSE 3001

CMD ["node", "dist/server.js", "--sse"]
