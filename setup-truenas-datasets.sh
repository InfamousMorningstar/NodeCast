#!/bin/bash
# NodeCast TrueNAS Scale Dataset Setup Script
# Configured for your system: app-pool (SSD) + Centauri (HDD)
# Container runs as UID:GID 568:568

echo "🚀 Setting up NodeCast ZFS datasets on TrueNAS Scale..."
echo "📦 SSD Pool: app-pool (Database, Config, Redis, Themes)"
echo "💾 HDD Pool: Centauri (Uploads, Temp, Public)"
echo "👤 Container User: 568:568 (standard container user)"
echo ""

# Create container user if it doesn't exist
echo "Creating container user (568:568)..."
if ! id -u nodecast >/dev/null 2>&1; then
    sudo groupadd -g 568 nodecast
    sudo useradd -u 568 -g 568 -r -s /bin/false -d /nonexistent nodecast
    echo "✅ Created user nodecast (568:568)"
else
    echo "✅ User nodecast already exists"
fi

# SSD Pool (app-pool) - Performance critical data
echo ""
echo "Creating SSD pool datasets (app-pool)..."
sudo zfs create app-pool/nodecast
sudo zfs create app-pool/nodecast/postgresql
sudo zfs create app-pool/nodecast/redis
sudo zfs create app-pool/nodecast/config
sudo zfs create app-pool/nodecast/themes

# HDD Pool (Centauri) - Bulk storage
echo ""
echo "Creating HDD pool datasets (Centauri)..."
sudo zfs create Centauri/nodecast
sudo zfs create Centauri/nodecast/uploads
sudo zfs create Centauri/nodecast/temp
sudo zfs create Centauri/nodecast/public

echo ""
echo "⚡ Optimizing ZFS settings for NodeCast..."

# SSD Pool Optimizations (performance critical)
echo "Optimizing SSD pool (app-pool) for database and config performance..."
sudo zfs set compression=lz4 app-pool/nodecast
sudo zfs set atime=off app-pool/nodecast
sudo zfs set sync=standard app-pool/nodecast                  # ACID compliance for databases
sudo zfs set logbias=throughput app-pool/nodecast             # Optimize for sustained writes
sudo zfs set primarycache=all app-pool/nodecast               # Cache both metadata and data

# PostgreSQL specific optimizations
sudo zfs set recordsize=8k app-pool/nodecast/postgresql       # Optimal for PostgreSQL pages
sudo zfs set logbias=latency app-pool/nodecast/postgresql     # Low latency for DB operations
sudo zfs set sync=always app-pool/nodecast/postgresql         # Ensure database consistency

# Redis specific optimizations  
sudo zfs set recordsize=4k app-pool/nodecast/redis            # Optimal for Redis operations
sudo zfs set compression=gzip app-pool/nodecast/redis         # Better compression for Redis data
sudo zfs set logbias=latency app-pool/nodecast/redis          # Low latency for cache operations

# Config and themes (small files)
sudo zfs set recordsize=4k app-pool/nodecast/config           # Small config files
sudo zfs set recordsize=32k app-pool/nodecast/themes          # Web assets and themes

# HDD Pool Optimizations (bulk storage)
echo "Optimizing HDD pool (Centauri) for large file storage..."
sudo zfs set compression=lz4 Centauri/nodecast
sudo zfs set atime=off Centauri/nodecast
sudo zfs set sync=disabled Centauri/nodecast                  # Better performance for bulk storage
sudo zfs set logbias=throughput Centauri/nodecast             # Optimize for large transfers
sudo zfs set primarycache=metadata Centauri/nodecast          # Cache only metadata on HDD

# Upload storage optimizations
sudo zfs set recordsize=1M Centauri/nodecast/uploads          # Large files (videos, images, etc.)
sudo zfs set xattr=sa Centauri/nodecast/uploads               # Required for NodeCast metadata
sudo zfs set dedup=on Centauri/nodecast/uploads               # Save space with deduplication
sudo zfs set compression=gzip Centauri/nodecast/uploads       # Better compression for uploads

# Temporary files
sudo zfs set recordsize=128k Centauri/nodecast/temp           # Mixed file sizes during processing
sudo zfs set sync=disabled Centauri/nodecast/temp             # Fast temp operations
sudo zfs set compression=lz4 Centauri/nodecast/temp           # Fast compression for temp files

# Public web assets
sudo zfs set recordsize=32k Centauri/nodecast/public          # Web assets (CSS, JS, images)
sudo zfs set compression=gzip Centauri/nodecast/public        # Best compression for web assets

echo ""
echo "🔧 Setting up directory permissions for container user (568:568)..."

# Set proper ownership for container user 568:568
sudo chown -R 568:568 /mnt/app-pool/nodecast
sudo chown -R 568:568 /mnt/Centauri/nodecast

# Set proper permissions
sudo chmod -R 755 /mnt/app-pool/nodecast
sudo chmod -R 755 /mnt/Centauri/nodecast

# PostgreSQL needs specific permissions
sudo chmod 700 /mnt/app-pool/nodecast/postgresql
sudo chown -R 568:568 /mnt/app-pool/nodecast/postgresql

# Ensure upload directory has proper permissions for file operations
sudo chmod 755 /mnt/Centauri/nodecast/uploads
sudo chmod 1755 /mnt/Centauri/nodecast/temp  # Sticky bit for temp directory

echo ""
echo "✅ NodeCast datasets created and optimized successfully!"
echo ""
echo "📋 Created datasets with optimizations:"
echo ""
echo "   🚀 SSD Pool (app-pool) - HIGH PERFORMANCE:"
echo "   ├── postgresql/  → 8K records, ACID compliance, low latency"
echo "   ├── redis/       → 4K records, gzip compression, low latency"  
echo "   ├── config/      → 4K records, fast access"
echo "   └── themes/      → 32K records, web asset optimization"
echo ""
echo "   💾 HDD Pool (Centauri) - BULK STORAGE:"
echo "   ├── uploads/     → 1M records, deduplication, gzip compression"
echo "   ├── temp/        → 128K records, fast processing"
echo "   └── public/      → 32K records, web asset compression"
echo ""
echo "� Permissions: All directories owned by 568:568 (container user)"
echo "🔒 Security: Proper file permissions and PostgreSQL protection"
echo ""
echo "🚀 Next steps:"
echo "1. Deploy NodeCast using portainer-truenas.yml in Portainer"
echo "2. Set PUID=568 and PGID=568 in environment variables"
echo "3. Access NodeCast at: http://192.168.1.113:3000"
echo ""
echo "📊 Performance optimizations applied:"
echo "✅ SSD pool: Tuned for database and config performance"
echo "✅ HDD pool: Optimized for large file storage with deduplication"
echo "✅ Record sizes: Optimized for each data type"
echo "✅ Compression: LZ4 for speed, gzip for storage efficiency"
echo "✅ Caching: Metadata-only on HDD, full caching on SSD"
echo "✅ Sync policies: Balanced for performance and data integrity"