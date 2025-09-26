<div align="center">

# ⚠️ NodeCast - TESTING VERSION - DO NOT USE IN PRODUCTION

**🔬 EXPERIMENTAL FORK - CONTAINS CRITICAL BUGS**

**⚠️ WARNING: This version has known critical issues that prevent normal operation. See [TESTING-STATUS.md](./TESTING-STATUS.md) for details.**

---

# NodeCast
**High-Performance File Server for TrueNAS Scale**  
*Enterprise-Grade ZFS-Optimized File Sharing*

![Version](https://img.shields.io/badge/version-4.3.1-blue?style=for-the-badge)
![TrueNAS Scale](https://img.shields.io/badge/TrueNAS_Scale-22.12%2B-green?style=for-the-badge)
![ZFS](https://img.shields.io/badge/Storage-ZFS_Optimized-orange?style=for-the-badge)
![License](https://img.shields.io/github/license/InfamousMorningstar/NodeCast?style=for-the-badge)

</div>

## 🚀 What is NodeCast?

NodeCast is a high-performance file sharing and URL shortening server specifically optimized for **TrueNAS Scale** with **ZFS storage**. It provides enterprise-grade file management with advanced optimizations for:

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

### 📁 Advanced File Management
- **Drag & Drop Upload** - Modern web interface with progress tracking
- **Chunked Uploads** - Resume interrupted transfers, ZFS-aligned chunking
- **Large File Support** - Optimized for multi-gigabyte file uploads
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

## 🚀 Quick Installation

### Simple Docker Compose (Recommended)
```bash
# Download files
curl -o docker-compose.yml https://raw.githubusercontent.com/InfamousMorningstar/NodeCast/trunk/docker-compose.yml
curl -o .env.example https://raw.githubusercontent.com/InfamousMorningstar/NodeCast/trunk/.env.example

# Configure
cp .env.example .env
nano .env  # Set POSTGRES_PASSWORD and CORE_SECRET

# Deploy
docker-compose up -d
```

**🌐 Access**: `http://your-server-ip:3000`

👉 **[Complete Installation Guide](./INSTALL.md)** for TrueNAS Scale, Portainer, and advanced setups.

## 🏗️ TrueNAS Scale Installation

### Prerequisites
- TrueNAS Scale 22.12.0 or higher
- ZFS pool with available space
- (Recommended) Dedicated SLOG device (NVMe SSD)
- (Recommended) L2ARC cache device

### Quick TrueNAS Setup

1. **Download NodeCast:**
   ```bash
   cd /mnt/your-pool
   curl -o docker-compose.yml https://raw.githubusercontent.com/InfamousMorningstar/NodeCast/trunk/docker-compose.yml
   curl -o .env.example https://raw.githubusercontent.com/InfamousMorningstar/NodeCast/trunk/.env.example
   ```

2. **Create ZFS datasets:**
   ```bash
   zfs create your-pool/nodecast
   zfs create your-pool/nodecast/uploads
   zfs create your-pool/nodecast/config
   chown -R 568:568 /mnt/your-pool/nodecast
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings (see INSTALL.md for details)
   ```

4. **Deploy:**
   ```bash
   # Copy the TrueNAS optimized configuration
   cp docker-compose.truenas.yml docker-compose.yml
   
   # Set environment variables in your .env file
   # Edit .env with your configuration
   
   # Deploy the stack
   docker-compose up -d
   ```

4. **Access NodeCast:**
   - Web interface: `http://your-truenas-ip:3000`
   - Complete initial setup
   - Create your admin account

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

## 📋 System Requirements

### Minimum Requirements
- **CPU:** 2 cores
- **RAM:** 2GB
- **Storage:** 10GB available space
- **Network:** 100 Mbps

### Recommended Requirements
- **CPU:** 4+ cores
- **RAM:** 8GB+ 
- **Storage:** ZFS pool with SLOG and L2ARC
- **Network:** 1 Gbps+

### TrueNAS Scale Optimization
- **SLOG:** NVMe SSD for sync write acceleration
- **L2ARC:** Additional NVMe SSD for read caching
- **Pool:** Mixed HDD/SSD configuration for cost-effectiveness

## 🔒 Security

NodeCast includes comprehensive security features:

- **Authentication:** Multi-factor authentication with TOTP and Passkey support
- **Authorization:** Role-based access control with granular permissions
- **Rate Limiting:** Configurable rate limits to prevent abuse
- **Data Protection:** File encryption and secure deletion
- **Network Security:** HTTPS support with custom SSL certificates

## 📈 Performance

NodeCast is optimized for high-performance file operations:

- **Chunked Uploads:** Resume interrupted transfers, reduce memory usage
- **ZFS Integration:** Aligned with ZFS recordsize for optimal I/O
- **Caching:** Multi-tier caching with L2ARC integration
- **Compression:** On-the-fly file compression and optimization
- **Thumbnails:** Efficient media processing with worker pools

## 🔧 Development

### Local Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/InfamousMorningstar/NodeCast.git
   cd NodeCast
   pnpm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   pnpm dev
   ```

### Building

```bash
# Build for production
pnpm build

# Build Docker image
docker build -t nodecast:latest .
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TrueNAS Scale Team** - For creating an excellent NAS platform
- **OpenZFS Contributors** - For the amazing ZFS filesystem
- **Node.js Community** - For the robust runtime environment
- **Video Thumbnails** - Automatic thumbnail generation for media files
- **Folder Organization** - Hierarchical file organization

