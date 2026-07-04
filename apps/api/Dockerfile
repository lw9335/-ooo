# ---- build stage ----
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci || npm install
COPY . .
RUN npx prisma generate && npm run build && test -f dist/main.js

# ---- run stage ----
FROM node:20-alpine
RUN apk add --no-cache openssl libc6-compat curl
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev || npm install --omit=dev
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
RUN test -f dist/main.js
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --retries=8 --start-period=90s \
  CMD curl -sf http://localhost:3000/api/health || exit 1
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
