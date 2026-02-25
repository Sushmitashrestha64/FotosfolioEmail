# --- Build Stage ---
FROM node:20-alpine AS builder

# Install build dependencies (if needed for native modules)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --prefer-offline --no-audit

# Copy build config files
COPY tsconfig*.json nest-cli.json ./

# Copy source code
COPY src ./src

# Build the application
RUN npm run build && \
    npm prune --production

# --- Production Stage ---
FROM node:20-alpine

# Set NODE_ENV
ENV NODE_ENV=production

WORKDIR /app

# Create non-root user first (better security practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy package files
COPY --chown=nestjs:nodejs package*.json ./

# Install production dependencies only
RUN npm ci --only=production --prefer-offline --no-audit && \
    npm cache clean --force

# Copy built application from builder
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port (use ENV for flexibility)
EXPOSE 3000

# Health check - fixed port variable
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start application directly with node (no need for npm)
CMD ["node", "dist/main.js"]
