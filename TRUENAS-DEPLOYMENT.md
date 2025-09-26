# NodeCast on TrueNAS Scale - ZFS Optimization Guide

## 🚀 High-Performance File Server for TrueNAS Scale

NodeCast is optimized for ZFS storage with SLOG and cache drives, providing enterprise-grade file sharing performance on TrueNAS Scale.

## 📋 Prerequisites

- TrueNAS Scale 22.12.0 or higher
- ZFS pool with at least 50GB free space
- (Recommended) Dedicated SLOG device (NVMe SSD)
- (Recommended) Cache drive (L2ARC) for read acceleration

## 🗄️ ZFS Pool Configuration

### Optimal ZFS Pool Setup

```bash
# Create main storage dataset
zfs create -o recordsize=1M -o compression=lz4 -o atime=off pool/nodecast

# Create database dataset with sync optimization
zfs create -o recordsize=8K -o compression=lz4 -o sync=always -o logbias=throughput pool/nodecast/database

# Create upload dataset with large recordsize for files
zfs create -o recordsize=1M -o compression=lz4 -o sync=standard pool/nodecast/uploads

# Create temp dataset on fast storage
zfs create -o recordsize=128K -o compression=lz4 -o sync=disabled pool/nodecast/temp

# Create public assets dataset (cache-friendly)
zfs create -o recordsize=128K -o compression=lz4 -o primarycache=all pool/nodecast/public
```

### SLOG (ZFS Intent Log) Configuration

For optimal database performance with PostgreSQL:

```bash
# Add dedicated SLOG device (NVMe recommended)
zpool add pool log /dev/disk/by-id/nvme-YOUR_SLOG_DEVICE

# Verify SLOG is active
zpool status pool
```

### L2ARC (Cache Drive) Configuration

For improved read performance:

```bash
# Add L2ARC cache device
zpool add pool cache /dev/disk/by-id/nvme-YOUR_CACHE_DEVICE

# Monitor cache hit ratio
arc_summary | grep -E "Hit|Miss"
```

## 🐳 Container Deployment

### 1. Create Required Datasets

```bash
# Main datasets
zfs create pool/nodecast/database
zfs create pool/nodecast/uploads  
zfs create pool/nodecast/temp
zfs create pool/nodecast/public
zfs create pool/nodecast/themes

# Set permissions
chown -R 1001:1001 /mnt/pool/nodecast/
```

### 2. Environment Configuration

Create `/mnt/pool/nodecast/.env`:

```env
# NodeCast Production Configuration
POSTGRES_PASSWORD=your_secure_postgres_password
CORE_SECRET=your_32_character_or_longer_secret_key
NODECAST_PORT=3000
FEATURES_USER_REGISTRATION=false

# ZFS Optimized Settings
CHUNKS_ENABLED=true
CHUNKS_MAX=1GB
CHUNKS_SIZE=100MB
FILES_MAX_FILE_SIZE=10GB
FEATURES_IMAGE_COMPRESSION=true
FEATURES_THUMBNAILS_ENABLED=true
```

### 3. Deploy with Docker Compose

```bash
cd /mnt/pool/nodecast
cp docker-compose.truenas.yml docker-compose.yml
docker-compose up -d
```

## ⚡ Performance Optimization

### ZFS Tuning Parameters

Add to `/boot/loader.conf` and reboot:

```conf
# Optimize ARC size (50% of RAM recommended)
vfs.zfs.arc_max=4294967296

# Optimize for SSDs
vfs.zfs.vdev.cache.size=10M
vfs.zfs.txg.timeout=5

# SLOG optimization
vfs.zfs.zil_replay_disable=0

# L2ARC optimization  
vfs.zfs.l2arc_write_max=268435456
vfs.zfs.l2arc_write_boost=536870912
```

### PostgreSQL Optimization

The included PostgreSQL configuration is optimized for ZFS with SLOG:

- `synchronous_commit=on` - Ensures SLOG utilization
- `fsync=on` - Maintains data integrity
- `wal_buffers=16MB` - Optimized for SLOG writes
- `shared_buffers=256MB` - Balanced for container environment

### NodeCast Application Tuning

- **Chunked Uploads**: 100MB chunks optimize ZFS recordsize
- **Image Compression**: Reduces storage usage with ZFS compression
- **Thumbnail Generation**: 4 threads for multi-core performance
- **Temp Directory**: Placed on fast storage for processing

## 📊 Monitoring and Maintenance

### ZFS Health Monitoring

```bash
# Check pool health
zpool status

# Monitor ARC efficiency
arc_summary

# Check dataset usage
zfs list -o name,used,avail,refer,compression,compressratio

# Monitor SLOG utilization
zpool iostat -v 5
```

### Container Health Monitoring

```bash
# Check container status
docker-compose -f docker-compose.truenas.yml ps

# Monitor resource usage
docker stats nodecast-app nodecast-postgres

# View application logs
docker-compose -f docker-compose.truenas.yml logs -f nodecast
```

## 🔧 Maintenance Tasks

### Regular ZFS Maintenance

```bash
# Schedule weekly scrubs
echo "35 23 * * 0 /sbin/zpool scrub pool" >> /etc/crontab

# Monitor fragmentation
zpool list -o name,frag

# Trim SSDs (if applicable)
zpool trim pool
```

### Database Maintenance

```bash
# Backup database
docker exec nodecast-postgres pg_dump -U nodecast nodecast > backup.sql

# Vacuum and analyze (automated by container)
docker exec nodecast-postgres psql -U nodecast -d nodecast -c "VACUUM ANALYZE;"
```

## 🚀 Performance Benefits

With this optimized setup, you can expect:

- **Database Performance**: SLOG provides consistent write latency
- **File Upload Speed**: ZFS recordsize alignment with chunking
- **Read Performance**: L2ARC acceleration for frequently accessed files
- **Storage Efficiency**: LZ4 compression typically achieves 1.5-2.5x space savings
- **Data Integrity**: ZFS checksums prevent silent corruption
- **High Availability**: ZFS snapshots and replication capabilities

## 📈 Scaling Recommendations

### Small Deployment (< 1TB)
- Pool: 2-way mirror
- SLOG: Optional (use embedded log)
- Cache: Not necessary

### Medium Deployment (1-10TB)
- Pool: RAIDZ1 or RAIDZ2
- SLOG: Dedicated NVMe (32GB+)
- Cache: NVMe L2ARC (128GB+)

### Large Deployment (10TB+)
- Pool: RAIDZ2 or RAIDZ3
- SLOG: Mirrored NVMe SLOG (64GB+ each)
- Cache: Multiple NVMe L2ARC devices (256GB+ each)

## 🔒 Security Considerations

- Enable ZFS encryption for sensitive data
- Use dataset quotas to prevent space exhaustion
- Configure proper container resource limits
- Enable ZFS audit logging for compliance
- Regular security updates for base images

## 📞 Support

For issues specific to the TrueNAS Scale deployment, check:
1. ZFS pool health: `zpool status`
2. Container logs: `docker-compose logs`
3. Resource usage: `docker stats`
4. Network connectivity between containers