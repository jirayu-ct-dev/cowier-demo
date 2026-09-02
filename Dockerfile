# ==============================================================================
# Stage 1: Build & Compile
# ==============================================================================
FROM node:22-alpine AS dependencies

WORKDIR /app

# Enable pnpm via Corepack
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.18.0 --activate

# Copy manifest and lockfiles for cached dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies (frozen lockfile)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm exec prisma generate

# ==============================================================================
# Stage 2: Run database migrations once before the app starts
# ==============================================================================
FROM dependencies AS migration

COPY server/core/auth/password.ts ./server/core/auth/password.ts
COPY server/core/database/client.ts ./server/core/database/client.ts

CMD ["pnpm", "run", "db:migrate:deploy"]

# ==============================================================================
# Stage 3: Build application
# ==============================================================================
FROM dependencies AS builder

# Copy application source
COPY . .

# Build production Nuxt bundle
RUN pnpm run build

# ==============================================================================
# Stage 4: Production Runtime
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install curl / wget for healthcheck
RUN apk --no-cache add curl

# Copy built artifacts from builder stage
COPY --from=builder --chown=node:node /app/.output ./.output

# Use non-root user
USER node

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start Nitro Server
CMD ["node", ".output/server/index.mjs"]
