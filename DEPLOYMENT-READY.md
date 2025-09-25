# 🚀 NodeCast TrueNAS Scale Deployment - READY TO DEPLOY!

## 📋 Your System Configuration
- **TrueNAS Scale IP**: `192.168.1.113`
- **SSD Pool**: `app-pool` (Database, Redis, Config, Themes)
- **HDD Pool**: `Centauri` (Uploads, Temp, Public files)

## ✅ Files Ready for Deployment

### 1. **portainer-truenas.yml** - ✅ CONFIGURED
- Docker Compose file customized for your pools
- SSD pool for database/config performance
- HDD pool for bulk file storage
- ZFS integration enabled

### 2. **env-truenas-template.txt** - ✅ CONFIGURED  
- Environment variables with your paths
- Domain set to `192.168.1.113:3000`
- Optimized for dual-pool setup

### 3. **setup-truenas-datasets.sh** - ✅ READY
- Creates all required ZFS datasets
- Applies optimal ZFS settings
- Sets proper permissions
- Optimizes for SSD/HDD performance characteristics

## 🏗️ Deployment Steps

### Step 1: Prepare TrueNAS Scale System
```bash
# Copy setup script to TrueNAS Scale
scp setup-truenas-datasets.sh root@192.168.1.113:/tmp/

# SSH into TrueNAS Scale
ssh root@192.168.1.113

# Run dataset setup
chmod +x /tmp/setup-truenas-datasets.sh
sudo /tmp/setup-truenas-datasets.sh
```

### Step 2: Build Docker Image (One-time Setup)
You need to build and push the NodeCast Docker image:

**Option A: GitHub Container Registry (Recommended)**
```bash
# The portainer-truenas.yml already references: ghcr.io/infamousmorningstar/nodecast:latest
# Build and push via GitHub Actions or manually:
docker build -t ghcr.io/infamousmorningstar/nodecast:latest .
docker push ghcr.io/infamousmorningstar/nodecast:latest
```

**Option B: Local Registry**
```bash
docker build -t nodecast:latest .
docker tag nodecast:latest your-registry/nodecast:latest
docker push your-registry/nodecast:latest
# Update image in portainer-truenas.yml to match your registry
```

### Step 3: Deploy via Portainer
1. Open Portainer: `http://192.168.1.113:9000` (or your Portainer URL)
2. Go to **Stacks** → **Add stack**
3. Name: `nodecast`
4. Copy contents of **portainer-truenas.yml**
5. Set environment variables (or use the .env template values)
6. **Deploy**

### Step 4: Configure Security (Important!)
Before deployment, set these in Portainer environment variables:
```env
CORE_SECRET=your-super-secret-random-string-here
POSTGRES_PASSWORD=your-secure-database-password-here
```

## 🌐 Access URLs After Deployment
- **Web Interface**: `http://192.168.1.113:3000`
- **WebSocket Sync**: `ws://192.168.1.113:8081`
- **Health Check**: `http://192.168.1.113:3000/api/healthcheck`

## ⚡ Performance Features Enabled
- **SSD Pool** (app-pool): Database, Redis cache, configs
- **HDD Pool** (Centauri): File uploads, temporary files
- **ZFS Deduplication**: Enabled on uploads (saves space)
- **LZ4 Compression**: Enabled on all datasets
- **Optimized Record Sizes**: 8K for DB, 1M for large files
- **Extended Attributes**: Enabled for NodeCast metadata

## 📊 Expected Storage Layout
```
/mnt/app-pool/nodecast/    (SSD - Fast Access)
├── postgresql/            → Database files
├── redis/                 → Cache data  
├── config/               → App configuration
└── themes/               → UI themes

/mnt/Centauri/nodecast/   (HDD - Bulk Storage)
├── uploads/              → User files (with dedup)
├── temp/                 → Temporary processing
└── public/               → Public web assets
```

## 🔍 Troubleshooting
If deployment fails:
1. **Check datasets exist**: `zfs list | grep nodecast`
2. **Check permissions**: `ls -la /mnt/*/nodecast`
3. **Check container logs**: `docker logs nodecast-app`
4. **Verify ZFS access**: Container needs privileged mode for ZFS

## 🎯 Next Action Required
**You need to build and push the Docker image**, then run the dataset setup script on your TrueNAS Scale system. After that, you're ready to deploy via Portainer!

Would you like me to help with the Docker image build process next?