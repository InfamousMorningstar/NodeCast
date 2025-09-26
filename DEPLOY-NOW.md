# 🚀 NodeCast TrueNAS Scale Deployment Guide - IMMEDIATE SOLUTION

## ⚡ **Quick Deploy (5 Minutes)**

The fastest way to get NodeCast running on your TrueNAS Scale system:

### **Step 1: SSH into TrueNAS Scale**
```bash
ssh root@192.168.1.113
```

### **Step 2: Create ZFS Datasets**
```bash
curl -fsSL https://raw.githubusercontent.com/InfamousMorningstar/NodeCast/trunk/setup-truenas-datasets.sh | sudo bash
```

### **Step 3: Build NodeCast Image**
```bash
curl -fsSL https://raw.githubusercontent.com/InfamousMorningstar/NodeCast/trunk/build-local-truenas.sh | bash
```

### **Step 4: Deploy via Portainer**
1. Open Portainer: `http://192.168.1.113:9000`
2. Go to **Stacks** → **Add stack**
3. Name: `nodecast`
4. Copy contents from `portainer-truenas-local.yml` (uses `nodecast:local` image)
5. Set environment variables:
   ```env
   POSTGRES_PASSWORD=your-secure-database-password
   CORE_SECRET=your-super-secret-random-string
   ```
6. **Deploy**

### **Step 5: Access NodeCast**
- Web Interface: `http://192.168.1.113:3000`
- Health Check: `http://192.168.1.113:3000/api/healthcheck`

---

## 🔧 **Why Local Build Works Better**

### ❌ **GitHub Actions Issues:**
- Container registry authentication problems
- Complex multi-arch build matrix failures
- Dependency conflicts in CI environment

### ✅ **Local Build Advantages:**
- **Immediate deployment** - No waiting for CI
- **Full control** - Build exactly what you need
- **Better debugging** - See errors directly
- **Optimized for your hardware** - Built on target system

---

## 📋 **What the Scripts Do**

### **setup-truenas-datasets.sh:**
- Creates user `nodecast` (568:568)
- Creates optimized ZFS datasets for both pools:
  - **SSD Pool (app-pool)**: PostgreSQL, Redis, Config, Themes
  - **HDD Pool (Centauri)**: Uploads, Temp, Public files
- Applies enterprise-grade ZFS optimizations:
  - Record sizes optimized for each data type
  - LZ4/gzip compression based on usage
  - Deduplication on uploads
  - Proper sync policies for performance

### **build-local-truenas.sh:**
- Clones latest NodeCast source
- Builds Docker image with proper dependencies
- Creates `nodecast:local` image
- Cleans up build artifacts

---

## 🛠️ **Manual Deployment (Alternative)**

If you prefer manual steps:

### **1. Create Datasets Manually:**
```bash
# SSD Pool (app-pool)
sudo zfs create app-pool/nodecast
sudo zfs create app-pool/nodecast/postgresql
sudo zfs create app-pool/nodecast/redis
sudo zfs create app-pool/nodecast/config
sudo zfs create app-pool/nodecast/themes

# HDD Pool (Centauri)
sudo zfs create Centauri/nodecast
sudo zfs create Centauri/nodecast/uploads
sudo zfs create Centauri/nodecast/temp
sudo zfs create Centauri/nodecast/public

# Set permissions
sudo chown -R 568:568 /mnt/app-pool/nodecast /mnt/Centauri/nodecast
sudo chmod -R 755 /mnt/app-pool/nodecast /mnt/Centauri/nodecast
sudo chmod 700 /mnt/app-pool/nodecast/postgresql
```

### **2. Build Image Manually:**
```bash
git clone https://github.com/InfamousMorningstar/NodeCast.git /tmp/nodecast-build
cd /tmp/nodecast-build
docker build -t nodecast:local .
rm -rf /tmp/nodecast-build
```

### **3. Deploy with Custom Compose:**
Use `portainer-truenas-local.yml` in Portainer.

---

## 🎯 **Expected Results**

After successful deployment:

- **PostgreSQL**: Running on SSD pool for fast queries
- **Redis**: Caching on SSD pool for performance  
- **Uploads**: Stored on HDD pool with deduplication
- **Config/Themes**: Fast access from SSD pool
- **ZFS Features**: Compression, snapshots, versioning enabled
- **Security**: Non-root user (568:568) for all containers

---

## 🚨 **Troubleshooting**

### **If Dataset Creation Fails:**
```bash
# Check if pools exist
zfs list | grep -E "(app-pool|Centauri)"

# Check mount points
ls -la /mnt/app-pool /mnt/Centauri
```

### **If Docker Build Fails:**
```bash
# Check Docker is running
systemctl status docker

# Check disk space
df -h

# Check build logs
docker build -t nodecast:local . --progress=plain
```

### **If Portainer Deploy Fails:**
1. Verify image exists: `docker images | grep nodecast`
2. Check mount paths exist: `ls -la /mnt/*/nodecast/`
3. Verify user 568 exists: `id 568`

---

## ✅ **Success Checklist**

- [ ] SSH access to TrueNAS Scale (192.168.1.113)
- [ ] ZFS datasets created successfully
- [ ] Docker image `nodecast:local` built
- [ ] Portainer stack deployed
- [ ] Web interface accessible at port 3000
- [ ] Database connection working
- [ ] File uploads functional

**🎉 Once deployed, you'll have a production-ready NodeCast server with enterprise ZFS features!**