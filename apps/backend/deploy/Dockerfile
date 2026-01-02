# PocketBase.cn Backend Dockerfile
# Multi-stage build with Litestream for continuous backup

ARG PB_VERSION=0.26.1
ARG LITESTREAM_VERSION=0.3.13

# =============================================================================
# Stage 1: Download binaries
# =============================================================================
FROM alpine:3.20 AS downloader

ARG PB_VERSION
ARG LITESTREAM_VERSION
ARG TARGETARCH

RUN apk add --no-cache curl unzip

WORKDIR /tmp

# Download PocketBase
RUN ARCH=$(case "${TARGETARCH}" in \
        "amd64") echo "amd64" ;; \
        "arm64") echo "arm64" ;; \
        *) echo "amd64" ;; \
    esac) && \
    curl -fsSL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${ARCH}.zip" -o pocketbase.zip && \
    unzip pocketbase.zip -d /tmp/pocketbase && \
    chmod +x /tmp/pocketbase/pocketbase

# Download Litestream
RUN ARCH=$(case "${TARGETARCH}" in \
        "amd64") echo "amd64" ;; \
        "arm64") echo "arm64" ;; \
        *) echo "amd64" ;; \
    esac) && \
    curl -fsSL "https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-v${LITESTREAM_VERSION}-linux-${ARCH}.tar.gz" -o litestream.tar.gz && \
    tar -xzf litestream.tar.gz && \
    chmod +x /tmp/litestream

# =============================================================================
# Stage 2: Runtime
# =============================================================================
FROM alpine:3.20

LABEL org.opencontainers.image.title="PocketBase.cn Backend"
LABEL org.opencontainers.image.description="PocketBase backend with Litestream replication"
LABEL org.opencontainers.image.source="https://github.com/pocketbase-cn/pocketbase.cn"

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    tini \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -S pocketbase && adduser -S pocketbase -G pocketbase

# Create directories
RUN mkdir -p /opt/pocketbase/pb_data \
             /opt/pocketbase/pb_hooks \
             /opt/pocketbase/pb_migrations \
             /opt/pocketbase/pb_public \
    && chown -R pocketbase:pocketbase /opt/pocketbase

WORKDIR /opt/pocketbase

# Copy binaries from downloader stage
COPY --from=downloader /tmp/pocketbase/pocketbase /usr/local/bin/pocketbase
COPY --from=downloader /tmp/litestream /usr/local/bin/litestream

# Copy application files
COPY --chown=pocketbase:pocketbase pb_hooks/ /opt/pocketbase/pb_hooks/
COPY --chown=pocketbase:pocketbase pb_migrations/ /opt/pocketbase/pb_migrations/
COPY --chown=pocketbase:pocketbase pb_public/ /opt/pocketbase/pb_public/

# Copy Litestream configuration
COPY --chown=pocketbase:pocketbase deploy/litestream.yml /etc/litestream.yml

# Copy entrypoint script
COPY --chown=pocketbase:pocketbase deploy/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER pocketbase

# Expose PocketBase port
EXPOSE 8090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8090/api/health || exit 1

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Start with Litestream replication
CMD ["/usr/local/bin/docker-entrypoint.sh"]
