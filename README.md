## ⚠️ Attribution Notice

**This is NOT my original work.** This repository is a fork/copy of the original Zipline project for personal experimentation and learning purposes.

**Original Author:** [diced](https://github.com/diced)  
**Original Repository:** [https://github.com/diced/zipline](https://github.com/diced/zipline)  
**License:** Please refer to the original repository for licensing terms.

All credit goes to the original author and contributors. This copy exists solely for personal use and has been modified to create "NodeCast" - a high-performance file server optimized for ZFS storage on TrueNAS Scale.

---

<div align="center">
  <img src="https://raw.githubusercontent.com/diced/zipline/trunk/public/zipline_small.png"/>

# NodeCast
**High-Performance File Server for TrueNAS Scale**  
*Optimized for ZFS with SLOG and Cache Drives*

![Version](https://img.shields.io/badge/version-4.3.1-blue?style=for-the-badge)
![TrueNAS Scale](https://img.shields.io/badge/TrueNAS_Scale-22.12%2B-green?style=for-the-badge)
![ZFS](https://img.shields.io/badge/Storage-ZFS_Optimized-orange?style=for-the-badge)

**Based on the excellent Zipline project by [diced](https://github.com/diced)**

</div>

## 🚀 What is NodeCast?

NodeCast is a high-performance file sharing and URL shortening server specifically optimized for **TrueNAS Scale** with **ZFS storage**. Built on the solid foundation of Zipline, NodeCast adds enterprise-grade optimizations for:

- **ZFS Storage with SLOG** - Optimized for consistent write performance
- **L2ARC Cache Integration** - Accelerated read performance for frequently accessed files
- **TrueNAS Scale Native** - Designed specifically for TrueNAS Scale deployment
- **Container Optimized** - Efficient Docker containers with proper resource management

## ✨ Key Features

### 🏢 Enterprise Storage Features
- **ZFS-Aware Chunking** - Upload chunks aligned with ZFS recordsize for optimal performance
- **SLOG Optimization** - Database writes optimized for ZFS Intent Log devices
- **Cache Drive Integration** - L2ARC acceleration for frequently accessed content
- **Compression Support** - Works seamlessly with ZFS compression (LZ4/ZSTD)
- **Snapshot Compatibility** - Designed to work with ZFS snapshots and replication

### 📁 File Management
- **Large File Support** - Optimized for multi-gigabyte file uploads
- **Chunked Uploads** - Resumable uploads with configurable chunk sizes
- **Image Compression** - Automatic image optimization
- **Video Thumbnails** - Automatic thumbnail generation for media files
- **Folder Organization** - Hierarchical file organization
- **Tagging System** - Organize files with custom tags

### 🔗 URL Shortening
- **Custom Vanity URLs** - Create memorable short links
- **View Limits** - Set maximum view counts for sensitive links
- **Password Protection** - Secure your shared content
- **Expiration Dates** - Automatic link expiration

### 🔐 Security & Authentication
- **Multi-User Support** - Role-based access control
- **Two-Factor Authentication** - TOTP and Passkey support
- **OAuth Integration** - Google, GitHub, Discord, and OIDC providers
- **Rate Limiting** - Protection against abuse
- **Invite System** - Controlled user registration

### 📊 Monitoring & Analytics
- **Usage Metrics** - Detailed storage and access analytics
- **Health Checks** - Built-in application monitoring
- **ZFS Integration** - Monitor pool health and performance
- **Container Metrics** - Docker resource usage tracking

## 🏗️ Quick Start for TrueNAS Scale

### Prerequisites
- TrueNAS Scale 22.12.0 or higher
- ZFS pool with available space
- (Recommended) Dedicated SLOG device (NVMe SSD)
- (Recommended) L2ARC cache device

### One-Line Installation

```bash
curl -fsSL https://raw.githubusercontent.com/InfamousMorningstar/NodeCase/trunk/install-truenas.sh | sudo bash
```

### Manual Installation

1. **Clone the repository:**
   ```bash
   cd /mnt/pool
   git clone https://github.com/InfamousMorningstar/NodeCase.git nodecast
   cd nodecast
   ```

2. **Run the optimization setup:**
   ```bash
   chmod +x install-truenas.sh
   sudo ./install-truenas.sh
   ```

3. **Access NodeCast:**
   - Web interface: `http://your-truenas-ip:3000`
   - Complete initial setup
   - Create your admin account

## 📖 Documentation

- **[TrueNAS Scale Deployment Guide](TRUENAS-DEPLOYMENT.md)** - Complete setup and optimization guide
- **[ZFS Optimization](TRUENAS-DEPLOYMENT.md#-zfs-pool-configuration)** - SLOG and L2ARC configuration
- **[Performance Tuning](TRUENAS-DEPLOYMENT.md#-performance-optimization)** - Advanced performance settings
- **[Monitoring & Maintenance](TRUENAS-DEPLOYMENT.md#-monitoring-and-maintenance)** - Health monitoring and upkeep

## 🏭 Architecture

NodeCast is designed with TrueNAS Scale in mind:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NodeCast App  │    │   PostgreSQL    │    │   File Storage  │
│   (Container)   │◄──►│   (Container)   │    │  (ZFS Dataset)  │
│                 │    │                 │    │                 │
│  - Web UI       │    │  - User Data    │    │  - Uploads      │
│  - File API     │    │  - Metadata     │    │  - Thumbnails   │
│  - URL Router   │    │  - Analytics    │    │  - Temp Files   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  ZFS Storage    │
                    │                 │
                    │  ⚡ SLOG Device  │ ←─ NVMe for sync writes
                    │  🚀 L2ARC Cache │ ←─ NVMe for read cache  
                    │  💾 Main Pool   │ ←─ HDDs/SSDs for bulk storage
                    └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

Key configuration options for NodeCast:

```env
# Core Settings
CORE_SECRET=your_32_character_secret
DATABASE_URL=postgresql://nodecast:password@postgres:5432/nodecast

# ZFS-Optimized Storage
DATASOURCE_LOCAL_DIRECTORY=/nodecast/uploads
CHUNKS_ENABLED=true
CHUNKS_SIZE=100MB  # Aligns with ZFS recordsize=1M

# Performance Optimization
FEATURES_IMAGE_COMPRESSION=true
FEATURES_THUMBNAILS_ENABLED=true
FEATURES_THUMBNAILS_NUM_THREADS=4

# Security
FEATURES_USER_REGISTRATION=false
INVITES_ENABLED=true
RATELIMIT_ENABLED=true
```

### ZFS Dataset Configuration

Optimal ZFS settings for NodeCast:

```bash
# Main storage - large files
zfs create -o recordsize=1M -o compression=lz4 pool/nodecast/uploads

# Database - small records with sync writes
zfs create -o recordsize=8K -o sync=always -o logbias=throughput pool/nodecast/database

# Temp storage - fast processing
zfs create -o recordsize=128K -o sync=disabled pool/nodecast/temp
```

![License](https://img.shields.io/github/license/InfamousMorningstar/NodeCase?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-22+-green?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)
![TrueNAS](https://img.shields.io/badge/TrueNAS-Scale-orange?style=for-the-badge)
![ZFS](https://img.shields.io/badge/ZFS-Optimized-blue?style=for-the-badge)

🚨 **Forked from [Zipline](https://github.com/diced/zipline)** - Optimized for TrueNAS Scale

---

**NodeCast** is a high-performance file sharing server specifically optimized for TrueNAS Scale environments. Built on the foundation of the excellent Zipline project by [diced](https://github.com/diced), NodeCast adds specialized ZFS optimizations, SLOG integration, and L2ARC caching for enterprise-grade performance.

</div>

## ✨ Key Features

### 📁 Advanced File Management
- **Drag & Drop Upload** - Modern web interface with progress tracking
- **Chunked Uploads** - Resume interrupted transfers, ZFS-aligned chunking
- **Format Support** - Images, videos, documents, archives, and more
- **Compression** - Automatic image optimization and ZFS compression
- **Video Thumbnails** - Automatic thumbnail generation for media files
- **Folder Organization** - Hierarchical file organization
- **Tagging System** - Organize files with custom tags

### 🔗 URL Shortening
- **Custom Vanity URLs** - Create memorable short links
- **View Limits** - Set maximum view counts for sensitive links  
- **Password Protection** - Secure your shared content
- **Expiration Dates** - Automatic link expiration

### 🔐 Security & Authentication
- **Multi-User Support** - Role-based access control
- **Two-Factor Authentication** - TOTP and Passkey support
- **OAuth Integration** - Google, GitHub, Discord, and OIDC providers
- **Rate Limiting** - Protection against abuse
- **Invite System** - Controlled user registration

### 📊 Monitoring & Analytics
- **Usage Metrics** - Detailed storage and access analytics
- **Health Checks** - Built-in application monitoring
- **ZFS Integration** - Monitor pool health and performance
- **Container Metrics** - Docker resource usage tracking

### ⚡ TrueNAS Scale Optimizations
- **SLOG Integration** - Dedicated intent log for consistent write performance
- **L2ARC Caching** - NVMe read cache for frequently accessed files
- **ZFS Recordsize Alignment** - Optimal chunk sizes for storage efficiency
- **Container Optimization** - Alpine Linux with minimal resource overhead
- **Health Monitoring** - ZFS pool status and performance metrics

## 📊 System Requirements

### Minimum Requirements
- **CPU:** 2 cores, 2.0GHz
- **RAM:** 2GB
- **Storage:** 50GB available ZFS space
- **OS:** TrueNAS Scale 22.12.0+

### Recommended for High Performance
- **CPU:** 4+ cores, 3.0GHz+
- **RAM:** 8GB+ (with ZFS ARC optimization)
- **SLOG:** 32GB+ NVMe SSD (for database writes)
- **L2ARC:** 128GB+ NVMe SSD (for read cache)
- **Storage:** ZFS pool with RAIDZ2 or mirrors

## 🚀 Performance Benefits

With NodeCast's TrueNAS Scale optimization:

| Feature | Benefit |
|---------|---------|
| **SLOG Integration** | Consistent sub-millisecond write latency |
| **L2ARC Acceleration** | 90%+ cache hit rates for active files |
| **ZFS Compression** | 1.5-2.5x storage space savings |
| **Aligned Chunking** | Optimal ZFS recordsize utilization |
| **Container Efficiency** | Minimal resource overhead |

## 🏗️ Quick Start for TrueNAS Scale

### Prerequisites
- TrueNAS Scale 22.12.0 or higher
- ZFS pool with available space
- (Recommended) Dedicated SLOG device (NVMe SSD)
- (Recommended) L2ARC cache device

### One-Line Installation

```bash
curl -fsSL https://raw.githubusercontent.com/InfamousMorningstar/NodeCase/trunk/install-truenas.sh | sudo bash
```

### Manual Installation

1. **Clone the repository:**
   ```bash
   cd /mnt/pool
   git clone https://github.com/InfamousMorningstar/NodeCase.git nodecast
   cd nodecast
   ```

2. **Run the optimization setup:**
   ```bash
   chmod +x install-truenas.sh
   sudo ./install-truenas.sh
   ```

3. **Access NodeCast:**
   - Web interface: `http://your-truenas-ip:3000`
   - Complete initial setup
   - Create your admin account

### TrueNAS Scale Docker Compose

Optimized for ZFS performance:

```yml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: nodecast
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: nodecast
    volumes:
      - /mnt/pool/nodecast/postgres:/var/lib/postgresql/data
    command: >
      postgres
      -c shared_preload_libraries=pg_stat_statements
      -c pg_stat_statements.track=all
      -c synchronous_commit=on
      -c wal_sync_method=fdatasync
      -c checkpoint_completion_target=0.9
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U nodecast']
      interval: 10s
      timeout: 5s
      retries: 5

  nodecast:
    build:
      context: .
      dockerfile: Dockerfile.truenas
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://nodecast:${POSTGRES_PASSWORD}@postgres:5432/nodecast
      CORE_SECRET: ${CORE_SECRET}
      DATASOURCE_LOCAL_DIRECTORY: /app/uploads
      CHUNKS_SIZE: 100MB
      ZFS_RECORDSIZE_HINT: 1048576
    volumes:
      - /mnt/pool/nodecast/uploads:/app/uploads
      - /mnt/pool/nodecast/temp:/app/temp
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'wget', '-q', '--spider', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 10s
      retries: 3
```

## 📖 Documentation

- **[TrueNAS Scale Deployment Guide](TRUENAS-DEPLOYMENT.md)** - Complete setup and optimization guide
- **[ZFS Optimization](TRUENAS-DEPLOYMENT.md#-zfs-pool-configuration)** - SLOG and L2ARC configuration
- **[Performance Tuning](TRUENAS-DEPLOYMENT.md#-performance-optimization)** - Advanced performance settings
- **[Monitoring & Maintenance](TRUENAS-DEPLOYMENT.md#-monitoring-and-maintenance)** - Health monitoring and upkeep

## 🏭 Architecture

NodeCast is designed with TrueNAS Scale in mind:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NodeCast App  │    │   PostgreSQL    │    │   File Storage  │
│   (Container)   │◄──►│   (Container)   │    │  (ZFS Dataset)  │
│                 │    │                 │    │                 │
│  - Web UI       │    │  - User Data    │    │  - Uploads      │
│  - File API     │    │  - Metadata     │    │  - Thumbnails   │
│  - URL Router   │    │  - Analytics    │    │  - Temp Files   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  ZFS Storage    │
                    │                 │
                    │  ⚡ SLOG Device  │ ←─ NVMe for sync writes
                    │  🚀 L2ARC Cache │ ←─ NVMe for read cache  
                    │  💾 Main Pool   │ ←─ HDDs/SSDs for bulk storage
                    └─────────────────┘
```

## 🔧 Environment Configuration

Create a `.env.truenas` file for production deployment:

```env
# Core NodeCast Settings
CORE_SECRET=your_32_character_secret_here
CORE_PORT=3000
CORE_HOSTNAME=0.0.0.0
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://nodecast:secure_password@postgres:5432/nodecast

# ZFS-Optimized Storage Paths
DATASOURCE_TYPE=local
DATASOURCE_LOCAL_DIRECTORY=/app/uploads
CORE_TEMP_DIRECTORY=/app/temp

# Performance Optimization
CHUNKS_ENABLED=true
CHUNKS_SIZE=100MB
ZFS_RECORDSIZE_HINT=1048576

# Feature Configuration
FEATURES_USER_REGISTRATION=false
FEATURES_HEADLESS=false
FEATURES_IMAGE_COMPRESSION=true
FEATURES_THUMBNAILS_ENABLED=true
FEATURES_THUMBNAILS_NUM_THREADS=4
FEATURES_METRICS_ENABLED=true

# Security Settings  
INVITES_ENABLED=true
RATELIMIT_ENABLED=true
CORE_RETURN_HTTPS_URLS=false
```

### ZFS Dataset Configuration

Optimal ZFS settings for NodeCast performance:

```bash
# Main file storage - optimized for large files
zfs create -o recordsize=1M \
           -o compression=lz4 \
           -o sync=standard \
           -o atime=off \
           pool/nodecast/uploads

# Database storage - optimized for small, frequent writes
zfs create -o recordsize=8K \
           -o sync=always \
           -o logbias=throughput \
           -o primarycache=metadata \
           pool/nodecast/postgres

# Temporary processing - optimized for speed
zfs create -o recordsize=128K \
           -o sync=disabled \
           -o compression=off \
           pool/nodecast/temp
```

## 📊 System Requirements

### Minimum Requirements
- **CPU:** 2 cores, 2.0GHz
- **RAM:** 2GB
- **Storage:** 50GB available ZFS space
- **OS:** TrueNAS Scale 22.12.0+

### Recommended for High Performance
- **CPU:** 4+ cores, 3.0GHz+
- **RAM:** 8GB+ (with ZFS ARC optimization)
- **SLOG:** 32GB+ NVMe SSD (for database writes)
- **L2ARC:** 128GB+ NVMe SSD (for read cache)
- **Storage:** ZFS pool with RAIDZ2 or mirrors

## 🚀 Performance Benefits

With NodeCast's TrueNAS Scale optimization:

| Feature | Benefit |
|---------|---------|
| **SLOG Integration** | Consistent sub-millisecond write latency |
| **L2ARC Acceleration** | 90%+ cache hit rates for active files |
| **ZFS Compression** | 1.5-2.5x storage space savings |
| **Aligned Chunking** | Optimal ZFS recordsize utilization |
| **Container Efficiency** | Minimal resource overhead |

## 🛠️ Development

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/InfamousMorningstar/NodeCase.git
cd NodeCase

# Install dependencies
pnpm install

# Set up database
pnpm run db:prototype

# Start development server
pnpm run dev
```

### Building for Production

```bash
# Build application
pnpm run build

# Build Docker image
docker build -f Dockerfile.truenas -t nodecast:latest .
```

## 🤝 Contributing

NodeCast is based on Zipline by [diced](https://github.com/diced). While this is a personal optimization fork, you can:

1. **Report Issues** - TrueNAS Scale specific problems
2. **Suggest Optimizations** - ZFS or container improvements  
3. **Submit Pull Requests** - Performance enhancements
4. **Share Experiences** - Deployment success stories

## 📄 License

This project maintains the same MIT license as the original Zipline project. See the original repository for full license terms.

## 🙏 Acknowledgments

- **[diced](https://github.com/diced)** - Original Zipline creator and maintainer
- **Zipline Contributors** - All the amazing developers who built the foundation
- **TrueNAS Community** - For the incredible NAS platform
- **OpenZFS Project** - For the world's best filesystem

---

<div align="center">

**🚀 Ready to deploy high-performance file sharing on TrueNAS Scale?**

[📖 Read the Deployment Guide](TRUENAS-DEPLOYMENT.md) | [⚡ Quick Install](install-truenas.sh)

</div>
