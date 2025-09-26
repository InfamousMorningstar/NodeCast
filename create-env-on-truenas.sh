#!/bin/bash
# Complete .env file for NodeCast on TrueNAS Scale
# Run this command on your TrueNAS server to create the .env file

cat > /root/.env << 'EOF'
# NodeCast Production Environment - TrueNAS Scale Optimized
# Copy this file to .env and customize for your deployment

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

# External port mapping (change if 3000 is occupied)
EXTERNAL_PORT=3069
NODECAST_PORT=3069
DOMAIN=192.168.1.113:3069

# =============================================================================
# STORAGE CONFIGURATION (ZFS OPTIMIZED)
# =============================================================================

# Primary storage type
DATASOURCE_TYPE=local

# Storage paths (mounted from ZFS datasets)
DATASOURCE_LOCAL_DIRECTORY=/nodecast/uploads
CORE_TEMP_DIRECTORY=/nodecast/temp

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
# WEBSITE_TITLE_LOGO=https://your-domain.com/logo.png

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
# OPTIONAL INTEGRATIONS
# =============================================================================

# Discord Webhooks (optional)
# DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK
# DISCORD_USERNAME=NodeCast
# DISCORD_ON_UPLOAD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_UPLOAD_WEBHOOK

# OAuth Providers (optional)
# OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
# OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
# OAUTH_GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/oauth/google

# =============================================================================
# ZFS STORAGE MONITORING
# =============================================================================

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

# Uncomment for debugging (disable in production)
# DEBUG=nodecast
# NODE_ENV=production
EOF

echo "✅ Created /root/.env file"
echo "🚀 Now run: docker compose up -d"
echo "🌐 Access NodeCast at: http://192.168.1.113:3069"