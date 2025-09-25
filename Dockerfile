FROM node:22-alpine3.21 AS base

# Install system dependencies for NodeCast
RUN apk add --no-cache \
    ffmpeg \
    tzdata \
    zfs \
    zfs-utils \
    util-linux \
    doas \
    && rm -rf /var/cache/apk/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /nodecast

COPY prisma ./prisma
COPY package.json .
COPY pnpm-lock.yaml .

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS builder
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY src ./src
COPY .gitignore ./.gitignore

COPY postcss.config.cjs ./postcss.config.cjs
COPY prettier.config.cjs ./prettier.config.cjs
COPY eslint.config.mjs ./eslint.config.mjs
COPY vite.config.ts ./vite.config.ts
COPY tsup.config.ts ./tsup.config.ts
COPY tsconfig.json ./tsconfig.json
COPY mimes.json ./mimes.json
COPY code.json ./code.json
COPY vite-env.d.ts ./vite-env.d.ts
COPY scripts ./scripts

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODECAST_BUILD=true

RUN ZIPLINE_BUILD=true pnpm run build

FROM base

# Create nodecast user for security
RUN addgroup -g 1000 nodecast && \
    adduser -D -s /bin/sh -u 1000 -G nodecast nodecast

COPY --from=deps /nodecast/node_modules ./node_modules

COPY --from=builder /nodecast/build ./build

COPY --from=builder /nodecast/mimes.json ./mimes.json
COPY --from=builder /nodecast/code.json ./code.json

RUN pnpm prisma generate

# Clean up temporary files and caches
RUN rm -rf /tmp/* /root/* /var/cache/apk/*

# Create necessary directories with proper permissions
RUN mkdir -p /nodecast/uploads /nodecast/temp /nodecast/config /nodecast/themes /nodecast/public && \
    chown -R nodecast:nodecast /nodecast

ENV NODE_ENV=production
ENV NODECAST_DOCKER=true

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -q --spider http://localhost:3000/api/healthcheck || exit 1

ARG NODECAST_GIT_SHA
ENV NODECAST_GIT_SHA=${NODECAST_GIT_SHA:-"unknown"}

# Switch to non-root user for security
USER nodecast

# Expose ports
EXPOSE 3000 8081

CMD ["node", "--enable-source-maps", "build/server"]
