# ── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage 2: builder ─────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# BACKEND_API_URL is only used server-side during `next build` for rewrites;
# it must be provided at build time so Next.js can embed it in the server config.
ARG BACKEND_API_URL=http://backend:3000
ENV BACKEND_API_URL=$BACKEND_API_URL

RUN npm run build

# ── Stage 3: production ──────────────────────────────────────────────────────
FROM node:24-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/public ./public

USER appuser

EXPOSE 3001
CMD ["node", "server.js"]
