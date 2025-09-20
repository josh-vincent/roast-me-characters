# Use the official Node.js 20 image as base
FROM node:20-alpine AS base

# Build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_BASE_URL=https://roastme.tocld.com
ARG NEXT_PUBLIC_APP_URL=https://roastme.tocld.com
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.json ./

# Copy packages
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Set environment variables for build
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@9.0.0

WORKDIR /app

# Copy built application and all dependencies
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/apps/web/package.json ./apps/web/package.json
COPY --from=base /app/apps/web/next.config.mjs ./apps/web/next.config.mjs
COPY --from=base /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/pnpm-workspace.yaml ./
COPY --from=base /app/package.json ./

# Expose port
EXPOSE 3000

# Change to web app directory and start
WORKDIR /app/apps/web
CMD ["npm", "start"]