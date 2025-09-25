#!/bin/bash
# NodeCast TrueNAS Scale Dataset Setup Script
# Configured for your system: app-pool (SSD) + Centauri (HDD)

echo "🚀 Setting up NodeCast ZFS datasets on TrueNAS Scale..."
echo "📦 SSD Pool: app-pool (Database, Config, Redis, Themes)"
echo "💾 HDD Pool: Centauri (Uploads, Temp, Public)"
echo ""

# SSD Pool (app-pool) - Performance critical data
echo "Creating SSD pool datasets (app-pool)..."
sudo zfs create app-pool/nodecast
sudo zfs create app-pool/nodecast/postgresql
sudo zfs create app-pool/nodecast/redis
sudo zfs create app-pool/nodecast/config
sudo zfs create app-pool/nodecast/themes

# HDD Pool (Centauri) - Bulk storage
echo "Creating HDD pool datasets (Centauri)..."
sudo zfs create Centauri/nodecast
sudo zfs create Centauri/nodecast/uploads
sudo zfs create Centauri/nodecast/temp
sudo zfs create Centauri/nodecast/public

echo "⚡ Optimizing ZFS settings..."

# SSD Pool Optimizations (performance critical)
echo "Optimizing SSD pool (app-pool)..."
sudo zfs set compression=lz4 app-pool/nodecast
sudo zfs set atime=off app-pool/nodecast
sudo zfs set recordsize=8k app-pool/nodecast/postgresql  # Optimal for PostgreSQL
sudo zfs set recordsize=4k app-pool/nodecast/redis       # Optimal for Redis
sudo zfs set sync=standard app-pool/nodecast/postgresql  # Ensure ACID compliance

# HDD Pool Optimizations (bulk storage)
echo "Optimizing HDD pool (Centauri)..."
sudo zfs set compression=lz4 Centauri/nodecast
sudo zfs set atime=off Centauri/nodecast
sudo zfs set recordsize=1M Centauri/nodecast/uploads     # Large files
sudo zfs set recordsize=128k Centauri/nodecast/temp      # Mixed file sizes
sudo zfs set recordsize=128k Centauri/nodecast/public    # Web assets
sudo zfs set xattr=sa Centauri/nodecast/uploads          # Required for NodeCast metadata

# Enable deduplication on uploads (saves space for duplicate files)
echo "Enabling deduplication for uploads..."
sudo zfs set dedup=on Centauri/nodecast/uploads

echo "🔧 Setting up directory permissions..."

# Set proper ownership and permissions
sudo chown -R 1000:1000 /mnt/app-pool/nodecast
sudo chown -R 1000:1000 /mnt/Centauri/nodecast

sudo chmod -R 755 /mnt/app-pool/nodecast
sudo chmod -R 755 /mnt/Centauri/nodecast

# PostgreSQL needs specific permissions
sudo chmod 700 /mnt/app-pool/nodecast/postgresql

echo ""
echo "✅ NodeCast datasets created successfully!"
echo ""
echo "📋 Created datasets:"
echo "   SSD (app-pool):"
echo "   - app-pool/nodecast/postgresql  → /mnt/app-pool/nodecast/postgresql"
echo "   - app-pool/nodecast/redis       → /mnt/app-pool/nodecast/redis"
echo "   - app-pool/nodecast/config      → /mnt/app-pool/nodecast/config"
echo "   - app-pool/nodecast/themes      → /mnt/app-pool/nodecast/themes"
echo ""
echo "   HDD (Centauri):"
echo "   - Centauri/nodecast/uploads     → /mnt/Centauri/nodecast/uploads"
echo "   - Centauri/nodecast/temp        → /mnt/Centauri/nodecast/temp"
echo "   - Centauri/nodecast/public      → /mnt/Centauri/nodecast/public"
echo ""
echo "🚀 Next steps:"
echo "1. Copy this script to your TrueNAS Scale system"
echo "2. Run: chmod +x setup-truenas-datasets.sh && sudo ./setup-truenas-datasets.sh"
echo "3. Deploy NodeCast using portainer-truenas.yml in Portainer"
echo "4. Access NodeCast at: http://192.168.1.113:3000"
echo ""
echo "📊 Pool optimization applied:"
echo "- SSD pool: Optimized for database and config performance"
echo "- HDD pool: Optimized for large file storage with deduplication"
echo "- All pools: LZ4 compression, disabled atime, proper record sizes"