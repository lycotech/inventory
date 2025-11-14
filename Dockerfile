# syntax=docker/dockerfile:1

# 1) Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install OS deps for prisma generate (openssl)
RUN apk add --no-cache openssl

# Copy package files
COPY package.json package-lock.json* .npmrc* ./

# Install deps
RUN npm ci --prefer-offline --no-audit --progress=false

# Copy source
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build Next.js (standalone output)
RUN npm run build

# 2) Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Add a non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy standalone server and static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma needs schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Expose port
EXPOSE 3000

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/ || exit 1

# Start the server
USER app
CMD ["node", "server.js"]
