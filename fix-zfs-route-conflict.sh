#!/bin/bash
# Fix NodeCast ZFS Route Conflict - TrueNAS Scale
# This addresses the duplicate /snapshots route error

echo "🔧 Fixing NodeCast ZFS route conflict..."

# Stop containers
echo "Stopping containers..."
docker compose down

# Update .env file to disable ZFS routes temporarily
echo "Updating configuration to disable ZFS routes..."
cat > /root/.env << 'EOF'
# NodeCast Production Environment - TrueNAS Scale Optimized
# ZFS Routes DISABLED to prevent duplicate route error

# =============================================================================
# CORE CONFIGURATION
# =============================================================================

# Database Configuration
DATABASE_URL=postgresql://nodecast:343bodf8@postgres:5432/nodecast
POSTGRES_PASSWORD=343bodf8

# Application Security
CORE_SECRET=cKGL'D3N]'=mTfdD/ht|r9|W]&c+kU->
CORE_PORT=3069
CORE_HOSTNAME=0.0.0.0

# External port mapping
NODECAST_PORT=3069
DOMAIN=192.168.1.113:3069

# =============================================================================
# STORAGE CONFIGURATION (ZFS OPTIMIZED - TEMPORARILY DISABLED)
# =============================================================================

# Primary storage type
DATASOURCE_TYPE=local

# Storage paths (mounted from ZFS datasets)
DATASOURCE_LOCAL_DIRECTORY=/nodecast/uploads
CORE_TEMP_DIRECTORY=/nodecast/temp

# Disable ZFS features to prevent route conflicts
DISABLE_ZFS_ROUTES=true
ZFS_ENABLED=false
ZFS_SNAPSHOTS_ENABLED=false

# =============================================================================
# ZFS-OPTIMIZED PERFORMANCE SETTINGS
# =============================================================================

# Chunked uploads (aligns with ZFS recordsize=1M)
CHUNKS_ENABLED=true
CHUNKS_MAX=1GB
CHUNKS_SIZE=100MB

# File handling optimizations
FILES_MAX_FILE_SIZE=10GB
FILES_ROUTE=/f
FILES_LENGTH=12
FILES_DEFAULT_FORMAT=RANDOM

# Compression settings (works with ZFS compression)
FEATURES_IMAGE_COMPRESSION=true
FEATURES_THUMBNAILS_ENABLED=true
FEATURES_THUMBNAILS_NUM_THREADS=4
FEATURES_THUMBNAILS_FORMAT=webp

# =============================================================================
# WEBSITE BRANDING
# =============================================================================

WEBSITE_TITLE=NodeCast - High-Performance File Server
WEBSITE_EXTERNAL_LINKS=[]

# =============================================================================
# USER MANAGEMENT
# =============================================================================

FEATURES_USER_REGISTRATION=false
INVITES_ENABLED=true
INVITES_LENGTH=16

# =============================================================================
# SECURITY FEATURES
# =============================================================================

# Rate limiting (protects against abuse)
RATELIMIT_ENABLED=true
RATELIMIT_MAX=100
RATELIMIT_WINDOW=60000

# Multi-factor authentication
MFA_TOTP_ENABLED=true
MFA_TOTP_ISSUER=NodeCast
MFA_PASSKEYS=true

# =============================================================================
# PERFORMANCE OPTIMIZATIONS
# =============================================================================

# Task intervals (optimized for ZFS maintenance)
TASKS_DELETE_INTERVAL=30m
TASKS_CLEAR_INVITES_INTERVAL=30m
TASKS_MAX_VIEWS_INTERVAL=30m
TASKS_THUMBNAILS_INTERVAL=10m
TASKS_METRICS_INTERVAL=60m

# URL shortening
URLS_ROUTE=/s
URLS_LENGTH=8

# PWA Configuration
PWA_ENABLED=true
PWA_TITLE=NodeCast
PWA_SHORT_NAME=NodeCast
PWA_DESCRIPTION=High-performance file sharing server
PWA_BACKGROUND_COLOR=#1a1b1e
PWA_THEME_COLOR=#228be6

# =============================================================================
# ZFS STORAGE MONITORING (TEMPORARILY DISABLED DUE TO ROUTE CONFLICT)
# =============================================================================

# Disable ZFS features to avoid duplicate route error
ZFS_ENABLED=false
ZFS_SNAPSHOTS_ENABLED=false

# Enable metrics for storage monitoring
FEATURES_METRICS_ENABLED=true
FEATURES_METRICS_ADMIN_ONLY=true
FEATURES_METRICS_SHOW_USER_SPECIFIC=false

# =============================================================================
# BACKUP AND MAINTENANCE
# =============================================================================

# Version checking
FEATURES_VERSION_CHECKING=true

# Health checks
FEATURES_HEALTHCHECK=true

# =============================================================================
# DEBUGGING (DISABLE IN PRODUCTION)
# =============================================================================

# DEBUG=nodecast
# NODE_ENV=production
EOF

echo "✅ Configuration updated to disable ZFS routes"

# Start containers
echo "Starting NodeCast with ZFS features disabled..."
docker compose up -d

# Check status
echo "⏳ Waiting for services to start..."
sleep 10

echo "📊 Container status:"
docker compose ps

echo ""
echo "🌐 NodeCast should now be accessible at: http://192.168.1.113:3069"
echo "⚠️  ZFS snapshot features are temporarily disabled due to a route conflict bug"
echo "📂 File uploads will still work normally, just without ZFS versioning"
echo ""
echo "To check logs: docker compose logs -f app"